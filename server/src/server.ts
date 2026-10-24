import http from 'http';
import { createApp } from './app.js';
import { initializeSockets } from './sockets/socketManager.js';
import { config } from './config/index.js';

const app = createApp();
const httpServer = http.createServer(app);

// Initialize Socket.IO with WebSocket + polling
initializeSockets(httpServer);

httpServer.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 HyperLocal Shared Backend running on port ${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Customer App expected at: ${config.corsOrigins[0]}`);
  console.log(`🔧 Worker App expected at: ${config.corsOrigins[1]}`);
  console.log(`⚡ Real-time Socket.IO initialized`);
  console.log(`====================================================`);
});
