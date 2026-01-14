import { NextRequest } from 'next/server';
import { gcsClient, type ProductType } from '../../../../lib/storage/gcs-client';
import { errorResponse, successResponse, validateRequest } from '../../lib/api-handler';

// API Key for internal service-to-service calls
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || process.env.CLEANUP_API_KEY;

/**
 * POST /api/documents/cleanup
 *
 * Cleans up expired onboarding session documents.
 * This endpoint should be called by a scheduled job (e.g., Kubernetes CronJob)
 * after the corresponding sessions have been marked as expired in the database.
 *
 * Request body:
 * {
 *   "product": "onboarding",
 *   "sessionIds": ["session1", "session2", ...]
 * }
 *
 * This endpoint requires internal API key authentication via X-Internal-API-Key header.
 */
export async function POST(request: NextRequest) {
  // Validate internal API key
  const apiKey = request.headers.get('x-internal-api-key');
  if (!INTERNAL_API_KEY || apiKey !== INTERNAL_API_KEY) {
    return errorResponse('Unauthorized: Invalid or missing API key', 401);
  }

  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  try {
    const body = await request.json();
    const { product: productInput, sessionIds } = body;

    // Validate required fields
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return errorResponse('sessionIds array is required and must not be empty', 400);
    }

    // Limit batch size to prevent timeout
    const MAX_BATCH_SIZE = 100;
    if (sessionIds.length > MAX_BATCH_SIZE) {
      return errorResponse(`Maximum batch size is ${MAX_BATCH_SIZE} sessions`, 400);
    }

    const product: ProductType = productInput === 'fanzone' || productInput === 'marketplace' || productInput === 'poker'
      ? productInput
      : 'onboarding';

    console.log(`[Documents] Starting cleanup for ${sessionIds.length} expired sessions`);

    // Perform the cleanup
    const result = await gcsClient.cleanupExpiredOnboarding(product, sessionIds);

    if (result.errors.length > 0) {
      console.error(`[Documents] Cleanup completed with errors:`, result.errors);
    }

    console.log(`[Documents] Cleaned up ${result.deleted} files from ${sessionIds.length} sessions`);

    return successResponse({
      deleted: result.deleted,
      sessionsProcessed: sessionIds.length,
      errors: result.errors,
      product,
    });
  } catch (error) {
    console.error('[Documents] Cleanup error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Cleanup failed',
      500
    );
  }
}

/**
 * GET /api/documents/cleanup/status
 *
 * Health check endpoint for the cleanup service.
 * Returns the bucket configuration and connectivity status.
 */
export async function GET(request: NextRequest) {
  try {
    const bucketName = gcsClient.getBucketName();

    return successResponse({
      status: 'healthy',
      bucket: bucketName,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return errorResponse('Cleanup service unhealthy', 503);
  }
}
