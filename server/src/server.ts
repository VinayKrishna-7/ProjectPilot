import http from 'http';
import app from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { initializeSocket } from './sockets';

async function startServer(): Promise<void> {
  await connectDatabase();

  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.PORT, () => {
    console.log(`🚀 ProjectPilot server running on port ${env.PORT}`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Client URL: ${env.CLIENT_URL}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
