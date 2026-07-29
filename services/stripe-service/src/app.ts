import express from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware, authMiddleware } from '@vaai/shared';

const app = express();
app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'stripe-service' });
});

// POST /webhook/stripe - handle Stripe events
// POST /checkout - create checkout session
// GET /billing - get billing info
// POST /cancel - cancel subscription

app.use(authMiddleware);

app.use(errorHandler);
export default app;
