/**
 * Next.js Instrumentation
 * This file is executed once when the Next.js server starts.
 * Used to initialize background services like NATS consumer.
 */

export async function register() {
  // Only run on the server (not edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server-side services...');

    // Check if NATS is enabled (disable in development unless explicitly enabled)
    const natsEnabled = process.env.NATS_ENABLED === 'true' || process.env.NODE_ENV === 'production';

    if (natsEnabled) {
      // Dynamic import to avoid loading on client
      const { natsClient } = await import('./lib/nats/client');

      // Retry connection with backoff
      const connectWithRetry = async (maxRetries = 5, delay = 3000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`[Instrumentation] NATS connection attempt ${attempt}/${maxRetries}...`);
            await natsClient.connect();

            // Start consuming events in background
            natsClient.startConsumer().catch((error) => {
              console.error('[Instrumentation] NATS consumer error:', error);
            });

            console.log('[Instrumentation] NATS consumer initialized');
            return true;
          } catch (error) {
            console.error(`[Instrumentation] NATS connection attempt ${attempt} failed:`, error);
            if (attempt < maxRetries) {
              console.log(`[Instrumentation] Retrying in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              delay = Math.min(delay * 1.5, 15000); // Exponential backoff, max 15s
            }
          }
        }
        console.error('[Instrumentation] All NATS connection attempts failed, continuing without NATS');
        return false;
      };

      // Start connection in background to not block server startup
      connectWithRetry().then((connected) => {
        if (connected) {
          // Handle graceful shutdown
          process.on('SIGTERM', async () => {
            console.log('[Instrumentation] SIGTERM received, closing NATS connection...');
            await natsClient.close();
          });

          process.on('SIGINT', async () => {
            console.log('[Instrumentation] SIGINT received, closing NATS connection...');
            await natsClient.close();
          });
        }
      });
    } else {
      console.log('[Instrumentation] NATS disabled (set NATS_ENABLED=true to enable)');
    }
  }
}
