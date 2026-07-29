import http from 'http';
import app from './app';
import { logger, getServiceConfig } from '@vaai/shared';

async function start() {
  const config = getServiceConfig();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`Alerts service listening on http://localhost:${config.port}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Alerts service stopped');
      process.exit(0);
    });
  });
}

start().catch((err) => {
  logger.error(err, 'Alerts service failed to start');
  process.exit(1);
});
