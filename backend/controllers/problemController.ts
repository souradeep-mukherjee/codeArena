import { Request, Response } from 'express';
import { getProblemBank } from '../services/problemBankService';

export const problemBankController = (_req: Request, res: Response): void => {
  const problems = getProblemBank();

  res.status(200).json({
    count: problems.length,
    problems,
  });
};
