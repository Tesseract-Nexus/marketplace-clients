/**
 * Next.js Instrumentation
 * This file is loaded at startup and can be used for:
 * - Environment validation
 * - Secret initialization (GCP Secret Manager)
 * - OpenTelemetry setup
 * - Other startup tasks
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run validation in Node.js runtime (not in Edge or during build)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvOrThrow } = await import('./lib/config/env-validation');

    // Skip validation during build to allow CI/CD to work
    // Validation will still run at runtime
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

    if (!isBuildTime) {
      validateEnvOrThrow();

      // Initialize CSRF secret from GCP Secret Manager (if enabled) or env var
      // This pre-warms the cache to avoid cold-start latency on first request
      try {
        const { initializeCsrfSecret } = await import('./lib/security/csrf');
        await initializeCsrfSecret();
      } catch (error) {
        console.error('Failed to initialize CSRF secret:', error);
        // Don't throw - the CSRF module will handle missing secret at runtime
      }
    }
  }
}
