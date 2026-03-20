import { Pool } from 'pg';
import { config } from '../utils/config';

let pool: Pool | null = null;

export const initDatabase = async (): Promise<void> => {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required for this build.');
  }

  pool = new Pool({
    connectionString: config.databaseUrl,
  });

  await pool.query('SELECT 1;');
};

export const getDatabase = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized.');
  }

  return pool;
};
