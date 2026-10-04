const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/db');

let server;

const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Start HTTP Server
    server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(` FraudShield API Server is running`);
      console.log(` Port:        ${config.port}`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(` CORS Origin: ${config.corsOrigin}`);
      console.log(` Health URL:  http://localhost:${config.port}/api/health`);
      console.log(`====================================================`);
    });

    // Handle Port Already In Use error
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[PORT CONFLICT] Port ${config.port} is already in use by another process.`);
        console.error(`Please change PORT in .env or stop the conflicting application.`);
        process.exit(1);
      } else {
        console.error('[SERVER ERROR]', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('[BOOTSTRAP ERROR] Fatal error during server startup:', error.message);
    process.exit(1);
  }
};

/**
 * Graceful Process Shutdown Handler
 * @param {'SIGINT' | 'SIGTERM'} signal
 */
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[SHUTDOWN] HTTP server closed cleanly. No longer accepting new connections.');
      try {
        await disconnectDB();
        console.log('[SHUTDOWN] MongoDB connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('[SHUTDOWN ERROR] Error while closing MongoDB connection:', err.message);
        process.exit(1);
      }
    });

    // Force close after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[SHUTDOWN FORCE] Graceful shutdown timed out. Forcing process termination.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();

module.exports = { startServer, handleGracefulShutdown };
