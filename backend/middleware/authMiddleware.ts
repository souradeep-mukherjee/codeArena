import { NextFunction, Request, Response } from 'express';
import { getAuthCookieName, verifyAuthToken } from '../utils/authToken';
import { HttpError } from '../utils/httpError';
import { getUserById } from '../services/authService';

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.[getAuthCookieName()] as string | undefined;
    if (!token) {
      throw new HttpError(401, 'Authentication required.');
    }

    const payload = verifyAuthToken(token);
    const user = await getUserById(payload.userId);

    if (!user) {
      throw new HttpError(401, 'Authentication required.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
