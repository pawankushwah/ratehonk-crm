import { ServerManager } from './server-manager.js';

const startServer = async () => {
  const serverManager = new ServerManager();
  
  try {
    await serverManager.start();
    console.log('✓ RateHonk CRM application started successfully');
  } catch (error) {
    console.error('✗ Failed to start RateHonk CRM application:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down RateHonk CRM application...');
    serverManager.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down RateHonk CRM application...');
    serverManager.stop();
    process.exit(0);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});