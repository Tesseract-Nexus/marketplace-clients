/**
 * Next.js Instrumentation
 * This file is loaded at startup and can be used for:
 * - Environment validation
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
    }
  }
}
