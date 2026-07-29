import http from 'http';
import app from './app';
import { logger, getServiceConfig } from '@vaai/shared';

async function start() {
  const config = getServiceConfig();
  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`AI Agent service listening on http://localhost:${config.port}`);
  });
  process.on('SIGTERM', () => {
    server.close(() => {
      logger.info('AI Agent service stopped');
      process.exit(0);
    });
  });
}

start().catch((err) => {
  logger.error(err, 'AI Agent service failed to start');
  process.exit(1);
});
