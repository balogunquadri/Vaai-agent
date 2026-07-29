import express, { Request, Response } from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware } from '@vaai/shared';
import authRoutes from './routes/auth';

const app = express();

app.use(cors());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Auth routes
app.use('/auth', authRoutes);
export default app;
