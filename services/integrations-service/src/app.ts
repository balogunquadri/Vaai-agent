import express, { Request, Response } from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware } from '@vaai/shared';

const app = express();

app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'integrations-service' });
});

// OAuth callbacks (public - no auth required)
// POST /auth/[platform]/callback - handle OAuth redirects
// GET /auth/[platform]/status - check integration status
// POST /integrations - list user integrations
// DELETE /integrations/:id - disconnect integration

app.use(errorHandler);

export default app;
