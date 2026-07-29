import express from 'express';
import cors from 'cors';
import { requestLogger, errorHandler, corsMiddleware, authMiddleware } from '@vaai/shared';

const app = express();
app.use(cors());
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-agent-service' });
});

app.use(authMiddleware);

// POST /chat - chat with AI
// POST /upload - upload files
// POST /summarize - summarize content
// GET /models - list available models

app.use(errorHandler);
export default app;
