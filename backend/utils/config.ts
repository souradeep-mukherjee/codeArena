import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
};

const frontendOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const config = {
  port: parseNumber(process.env.PORT, 4000),
  executionTimeoutMs: parseNumber(process.env.EXECUTION_TIMEOUT_MS, 4000),
  maxCodeSize: parseNumber(process.env.MAX_CODE_SIZE, 20000),
  maxStdinSize: parseNumber(process.env.MAX_STDIN_SIZE, 5000),
  maxOutputSize: parseNumber(process.env.MAX_OUTPUT_SIZE, 20000),
  dockerMemoryLimit: process.env.DOCKER_MEMORY_LIMIT || '128m',
  dockerCpuLimit: process.env.DOCKER_CPU_LIMIT || '0.5',
  databaseUrl: process.env.DATABASE_URL || '',
  frontendOrigins,
  jwtSecret: process.env.JWT_SECRET || '',
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  authTokenTtlHours: parseNumber(process.env.AUTH_TOKEN_TTL_HOURS, 24),
  nodeEnv: process.env.NODE_ENV || 'development',
};
