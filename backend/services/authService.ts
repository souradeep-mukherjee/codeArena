import bcrypt from 'bcryptjs';
import { getDatabase } from './databaseService';
import { AuthUser } from '../utils/types';
import { HttpError } from '../utils/httpError';
import { LoginPayload, SignupPayload, UpdateAccountPayload } from '../utils/authValidation';

interface UserRow {
  id: number;
  full_name: string;
  email: string;
  phone_e164: string;
  password_hash: string;
}

const BCRYPT_COST = 12;

const mapUser = (row: Pick<UserRow, 'id' | 'full_name' | 'email' | 'phone_e164'>): AuthUser => ({
  id: Number(row.id),
  fullName: row.full_name,
  email: row.email,
  phone: row.phone_e164,
});

const isEmailUniqueViolation = (pgError: { constraint?: string; detail?: string }): boolean => {
  const constraint = pgError.constraint ?? '';
  const detail = pgError.detail ?? '';

  return (
    constraint === 'users_email_key' ||
    constraint === 'users_email_lower_unique_idx' ||
    detail.includes('(email)') ||
    detail.includes('lower((email')
  );
};

const isPhoneUniqueViolation = (pgError: { constraint?: string; detail?: string }): boolean => {
  const constraint = pgError.constraint ?? '';
  const detail = pgError.detail ?? '';

  return constraint === 'users_phone_e164_key' || detail.includes('(phone_e164)');
};

export const createUser = async (payload: SignupPayload): Promise<AuthUser> => {
  const db = getDatabase();
  const passwordHash = await bcrypt.hash(payload.password, BCRYPT_COST);

  try {
    const result = (await db.query(
      `
        INSERT INTO users (full_name, email, phone_e164, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, full_name, email, phone_e164
      `,
      [payload.fullName, payload.email, payload.phone, passwordHash],
    )) as { rows: Array<Pick<UserRow, 'id' | 'full_name' | 'email' | 'phone_e164'>> };

    const row = result.rows[0];
    return mapUser(row);
  } catch (error) {
    const pgError = error as { code?: string; constraint?: string; detail?: string; message?: string };

    if (pgError.code === '23505') {
      if (isEmailUniqueViolation(pgError)) {
        throw new HttpError(409, 'Email is already registered.');
      }
      if (isPhoneUniqueViolation(pgError)) {
        throw new HttpError(409, 'Phone number is already registered.');
      }

      throw new HttpError(409, 'Account already exists with provided credentials.');
    }

    throw new HttpError(500, pgError.message || 'Failed to create user.');
  }
};

export const authenticateUser = async (payload: LoginPayload): Promise<AuthUser> => {
  const db = getDatabase();

  const result = (await db.query(
    `
      SELECT id, full_name, email, phone_e164, password_hash
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [payload.email],
  )) as { rows: UserRow[] };

  const user = result.rows[0];
  if (!user) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.password_hash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  return mapUser(user);
};

export const getUserById = async (userId: number): Promise<AuthUser | null> => {
  const db = getDatabase();

  const result = (await db.query(
    `
      SELECT id, full_name, email, phone_e164
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  )) as { rows: Array<Pick<UserRow, 'id' | 'full_name' | 'email' | 'phone_e164'>> };

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapUser(row);
};

export const updateAccount = async (
  userId: number,
  payload: UpdateAccountPayload,
): Promise<AuthUser> => {
  const db = getDatabase();

  const userResult = (await db.query(
    `
      SELECT id, full_name, email, phone_e164, password_hash
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId],
  )) as { rows: UserRow[] };

  const user = userResult.rows[0];
  if (!user) {
    throw new HttpError(404, 'User account was not found.');
  }

  const currentPasswordMatches = await bcrypt.compare(payload.currentPassword, user.password_hash);
  if (!currentPasswordMatches) {
    throw new HttpError(401, 'Current password is incorrect.');
  }

  const values: unknown[] = [];
  const setClauses: string[] = [];

  if (payload.email && payload.email !== user.email) {
    values.push(payload.email);
    setClauses.push(`email = $${values.length}`);
  }

  if (payload.newPassword) {
    const newPasswordHash = await bcrypt.hash(payload.newPassword, BCRYPT_COST);
    values.push(newPasswordHash);
    setClauses.push(`password_hash = $${values.length}`);
  }

  if (!setClauses.length) {
    throw new HttpError(400, 'No account changes detected.');
  }

  values.push(userId);

  try {
    const updateResult = (await db.query(
      `
        UPDATE users
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING id, full_name, email, phone_e164
      `,
      values,
    )) as { rows: Array<Pick<UserRow, 'id' | 'full_name' | 'email' | 'phone_e164'>> };

    const updatedUser = updateResult.rows[0];
    return mapUser(updatedUser);
  } catch (error) {
    const pgError = error as { code?: string; constraint?: string; detail?: string; message?: string };

    if (pgError.code === '23505' && isEmailUniqueViolation(pgError)) {
      throw new HttpError(409, 'Email is already registered.');
    }

    throw new HttpError(500, pgError.message || 'Failed to update account.');
  }
};
