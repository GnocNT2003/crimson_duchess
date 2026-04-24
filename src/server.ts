import express from 'express';
import { config } from './config.js';
import healthRouter from './routes/health.js';

export function createServer() {
  const app = express();

  app.use(express.json());
  app.use('/api', healthRouter);

  return app;
}

export function startServer() {
  const app = createServer();
  const { port } = config.server;

  app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
  });

  return app;
}
