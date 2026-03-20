import { Request, Response, NextFunction } from 'express';
import { executeCode } from '../services/executionService';
import { validateExecutePayload } from '../utils/validation';
import { HttpError } from '../utils/httpError';

export const executeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required.');
    }

    const payload = validateExecutePayload(req.body);
    const result = await executeCode(payload, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
