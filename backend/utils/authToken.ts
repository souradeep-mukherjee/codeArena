import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { HttpError } from './httpError';

interface AuthTokenPayload {
  userId: number;
  email: string;
}

const AUTH_COOKIE_NAME = 'cep_auth';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.cookieSecure,
  maxAge: config.authTokenTtlHours * 60 * 60 * 1000,
  path: '/',
};

const validateJwtConfiguration = (): void => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is required for authentication.');
  }
};

export const assertAuthConfig = (): void => {
  if (config.nodeEnv === 'production') {
    validateJwtConfiguration();
    return;
  }

  if (!config.jwtSecret) {
    console.warn('JWT_SECRET is not set. Using insecure local default for development only.');
  }
};

const getJwtSecret = (): string => config.jwtSecret || 'dev-only-insecure-secret-change-me';

export const createAuthToken = (payload: AuthTokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: `${config.authTokenTtlHours}h`,
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as AuthTokenPayload;

    if (!decoded || typeof decoded.userId !== 'number' || typeof decoded.email !== 'string') {
      throw new HttpError(401, 'Invalid authentication token.');
    }

    return decoded;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, 'Authentication required.');
  }
};

export const setAuthCookie = (response: Response, token: string): void => {
  response.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (response: Response): void => {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  });
};

export const getAuthCookieName = (): string => AUTH_COOKIE_NAME;
