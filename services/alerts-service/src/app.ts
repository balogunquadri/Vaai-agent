import express, { Request, Response } from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware, authMiddleware } from '@vaai/shared';

const app = express();

app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'alerts-service' });
});

// Protected routes
app.use(authMiddleware);

// TODO: Add alert routes
// GET /alerts - list alerts
// POST /alerts - create alert
// PUT /alerts/:id - update alert
// DELETE /alerts/:id - delete alert
// POST /alerts/:id/actions - alert actions (snooze, archive, etc)
// GET /alerts/summary - AI summary of alerts

app.use(errorHandler);

export default app;
