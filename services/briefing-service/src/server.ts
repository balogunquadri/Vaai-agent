import http from 'http';
import app from './app';
import { logger, getServiceConfig } from '@vaai/shared';

async function start() {
  const config = getServiceConfig();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(`Briefing service listening on http://localhost:${config.port}`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Briefing service stopped');
      process.exit(0);
    });
  });
}

start().catch((err) => {
  logger.error(err, 'Briefing service failed to start');
  process.exit(1);
});
