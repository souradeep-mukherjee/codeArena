import { Request, Response, NextFunction } from 'express';
import { listSubmissionsByUser } from '../services/submissionService';
import { HttpError } from '../utils/httpError';

const parsePositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
};

export const listSubmissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required.');
    }

    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);

    const response = await listSubmissionsByUser(req.user.id, page, limit);

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
