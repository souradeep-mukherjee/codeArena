import { getDatabase } from './databaseService';
import { SubmissionRecord } from '../utils/types';

export interface SubmissionListItem {
  id: number;
  language: string;
  code: string;
  input: string;
  output: string;
  status: string;
  createdAt: string;
}

export interface SubmissionListResponse {
  items: SubmissionListItem[];
  total: number;
  page: number;
  limit: number;
}

let submissionStoreEnabled = false;
const LEGACY_PASSWORD_HASH = '$2a$12$u5eMgwrpXmkubRpuLm0gZObR4hU5f7zbrfuNtmxgteBSdtK2Imvxa';

export const initSubmissionStore = async (): Promise<void> => {
  const db = getDatabase();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(100),
      email VARCHAR(255),
      phone_e164 VARCHAR(20),
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'name'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'full_name'
      ) THEN
        ALTER TABLE users RENAME COLUMN name TO full_name;
      END IF;
    END
    $$;
  `);

  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);');
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);');
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20);');
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;');
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;');
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;');
  await db.query('ALTER TABLE users ALTER COLUMN full_name TYPE VARCHAR(100);');
  await db.query('ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);');
  await db.query('ALTER TABLE users ALTER COLUMN phone_e164 TYPE VARCHAR(20);');

  await db.query(`
    UPDATE users
    SET full_name = COALESCE(NULLIF(BTRIM(full_name), ''), COALESCE(NULLIF(BTRIM(email), ''), 'legacy-user'))
    WHERE full_name IS NULL OR BTRIM(full_name) = ''
  `);

  await db.query(`
    UPDATE users
    SET email = LOWER(BTRIM(email))
    WHERE email IS NOT NULL
  `);

  const duplicateEmailsResult = (await db.query(`
    SELECT LOWER(email) AS normalized_email, COUNT(*)::INT AS count
    FROM users
    WHERE email IS NOT NULL
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
    LIMIT 1
  `)) as { rows: Array<{ normalized_email: string; count: number }> };

  if (duplicateEmailsResult.rows.length > 0) {
    const duplicate = duplicateEmailsResult.rows[0];
    throw new Error(
      `Cannot initialize auth store. Found duplicate user emails that differ only by case: "${duplicate.normalized_email}".`,
    );
  }

  await db.query('UPDATE users SET email = LOWER(email) WHERE email <> LOWER(email);');

  await db.query(`
    UPDATE users
    SET phone_e164 = '+1999' || LPAD(id::text, 10, '0')
    WHERE phone_e164 IS NULL OR BTRIM(phone_e164) = ''
  `);

  const duplicatePhonesResult = (await db.query(`
    SELECT phone_e164, COUNT(*)::INT AS count
    FROM users
    GROUP BY phone_e164
    HAVING COUNT(*) > 1
    LIMIT 1
  `)) as { rows: Array<{ phone_e164: string; count: number }> };

  if (duplicatePhonesResult.rows.length > 0) {
    const duplicate = duplicatePhonesResult.rows[0];
    throw new Error(
      `Cannot initialize auth store. Found duplicate user phones: "${duplicate.phone_e164}".`,
    );
  }

  await db.query(`
    UPDATE users
    SET password_hash = $1
    WHERE password_hash IS NULL OR BTRIM(password_hash) = ''
  `, [LEGACY_PASSWORD_HASH]);

  await db.query('UPDATE users SET created_at = NOW() WHERE created_at IS NULL;');
  await db.query('UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;');

  await db.query('ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;');
  await db.query('ALTER TABLE users ALTER COLUMN email SET NOT NULL;');
  await db.query('ALTER TABLE users ALTER COLUMN phone_e164 SET NOT NULL;');
  await db.query('ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;');
  await db.query('ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;');
  await db.query('ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;');
  await db.query('ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();');
  await db.query('ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();');

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_email_lowercase_chk'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_email_lowercase_chk
          CHECK (email = LOWER(email));
      END IF;
    END
    $$;
  `);

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_phone_e164_key'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_phone_e164_key
          UNIQUE (phone_e164);
      END IF;
    END
    $$;
  `);

  await db.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx ON users (LOWER(email));');

  await db.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      language VARCHAR(32) NOT NULL,
      input TEXT NOT NULL,
      output TEXT NOT NULL,
      status VARCHAR(32) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query('ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id BIGINT;');

  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'submissions_user_id_fkey'
      ) THEN
        ALTER TABLE submissions
          ADD CONSTRAINT submissions_user_id_fkey
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `);

  await db.query(
    'CREATE INDEX IF NOT EXISTS idx_submissions_user_id_created_at ON submissions(user_id, created_at DESC);',
  );

  submissionStoreEnabled = true;
};

export const saveSubmission = async (record: SubmissionRecord): Promise<void> => {
  const db = getDatabase();

  await db.query(
    `
      INSERT INTO submissions (user_id, code, language, input, output, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [record.userId, record.code, record.language, record.input, record.output, record.status],
  );
};

export const listSubmissionsByUser = async (
  userId: number,
  page: number,
  limit: number,
): Promise<SubmissionListResponse> => {
  const db = getDatabase();
  const offset = (page - 1) * limit;

  const itemsResult = (await db.query(
    `
      SELECT id, language, code, input, output, status, created_at
      FROM submissions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset],
  )) as { rows: Array<Record<string, unknown>> };

  const countResult = (await db.query(
    `
      SELECT COUNT(*) AS total
      FROM submissions
      WHERE user_id = $1
    `,
    [userId],
  )) as { rows: Array<{ total: string }> };

  const items: SubmissionListItem[] = itemsResult.rows.map((row) => ({
    id: Number(row.id),
    language: String(row.language ?? ''),
    code: String(row.code ?? ''),
    input: String(row.input ?? ''),
    output: String(row.output ?? ''),
    status: String(row.status ?? ''),
    createdAt: String(row.created_at ?? ''),
  }));

  return {
    items,
    total: Number(countResult.rows[0]?.total ?? 0),
    page,
    limit,
  };
};

export const isSubmissionStoreEnabled = (): boolean => submissionStoreEnabled;
