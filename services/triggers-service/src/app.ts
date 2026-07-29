import express from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware, authMiddleware } from '@vaai/shared';

const app = express();
app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'triggers-service' });
});

app.use(authMiddleware);

// POST /triggers - create trigger
// GET /triggers - list triggers
// POST /triggers/:id/evaluate - run trigger evaluation
// POST /jobs/refresh-tokens - scheduled job
// POST /jobs/evaluate-triggers - scheduled job

app.use(errorHandler);
export default app;
