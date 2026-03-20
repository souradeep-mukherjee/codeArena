import { NextFunction, Request, Response } from 'express';
import { authenticateUser, createUser, updateAccount } from '../services/authService';
import {
  parseLoginPayload,
  parseSignupPayload,
  parseUpdateAccountPayload,
} from '../utils/authValidation';
import { clearAuthCookie, createAuthToken, setAuthCookie } from '../utils/authToken';
import { HttpError } from '../utils/httpError';

export const signupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = parseSignupPayload(req.body);
    const user = await createUser(payload);
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = parseLoginPayload(req.body);
    const user = await authenticateUser(payload);
    const token = createAuthToken({
      userId: user.id,
      email: user.email,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.status(200).json({
    message: 'Logged out successfully.',
  });
};

export const meController = (req: Request, res: Response): void => {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  res.status(200).json({
    user: req.user,
  });
};

export const updateAccountController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required.');
    }

    const payload = parseUpdateAccountPayload(req.body);
    const updatedUser = await updateAccount(req.user.id, payload);

    const token = createAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      user: updatedUser,
      message: 'Account updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
