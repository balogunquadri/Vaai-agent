import express from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware } from '@vaai/shared';

const app = express();
app.use(cors());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'messaging-service' });
});

// WhatsApp, Telegram, Email routes
// POST /whatsapp/connect, /whatsapp/send, /whatsapp/disconnect
// POST /telegram/connect, /telegram/send
// POST /email/send

app.use(errorHandler);
export default app;
