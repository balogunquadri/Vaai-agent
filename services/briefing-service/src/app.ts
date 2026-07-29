import express, { Request, Response } from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware, authMiddleware } from '@vaai/shared';

const app = express();

app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'briefing-service' });
});

app.use(authMiddleware);

// TODO: Add briefing routes
// GET /briefings - list briefings
// POST /briefings - create briefing
// PUT /briefings/:id - update briefing
// GET /briefings/:id/compose - compose/generate briefing
// POST /briefings/:id/send - send briefing via email

app.use(errorHandler);

export default app;
