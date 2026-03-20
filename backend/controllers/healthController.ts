import { Request, Response } from 'express';
import { checkDockerAvailability } from '../services/healthService';
import { isSubmissionStoreEnabled } from '../services/submissionService';

export const healthController = async (_req: Request, res: Response): Promise<void> => {
  const dockerAvailable = await checkDockerAvailability();

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dockerAvailable,
    persistenceEnabled: isSubmissionStoreEnabled(),
  });
};
