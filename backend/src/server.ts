import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from '../routes';
import { initDatabase } from '../services/databaseService';
import { initSubmissionStore } from '../services/submissionService';
import { assertAuthConfig } from '../utils/authToken';
import { config } from '../utils/config';
import { HttpError } from '../utils/httpError';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS policy.'));
    },
    credentials: true,
  }),
);
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '256kb' }));

app.use(routes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  res.status(500).json({
    message,
    statusCode: 500,
  });
});

const startServer = async (): Promise<void> => {
  try {
    assertAuthConfig();
    await initDatabase();
    await initSubmissionStore();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.error(`Failed to start backend: ${message}`);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });
};

void startServer();
