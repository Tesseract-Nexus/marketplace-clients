import { NextRequest } from 'next/server';
import { gcsClient, type ProductType } from '../../../../lib/storage/gcs-client';
import { errorResponse, successResponse, validateRequest } from '../../lib/api-handler';

// Validate product type
function isValidProduct(product: string): product is ProductType {
  return ['fanzone', 'marketplace', 'poker', 'onboarding'].includes(product);
}

/**
 * POST /api/documents/migrate
 *
 * Migrates documents from temporary onboarding storage to permanent tenant storage.
 * Called after successful email verification and tenant creation.
 *
 * Request body:
 * {
 *   "product": "onboarding",
 *   "sessionId": "abc123",
 *   "tenantId": "tenant_xyz"
 * }
 */
export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  try {
    const body = await request.json();
    const { product: productInput, sessionId, tenantId } = body;

    // Validate required fields
    if (!sessionId) {
      return errorResponse('sessionId is required', 400);
    }

    if (!tenantId) {
      return errorResponse('tenantId is required for migration', 400);
    }

    const product = productInput && isValidProduct(productInput)
      ? productInput as ProductType
      : 'onboarding';

    console.log(`[Documents] Starting migration for session ${sessionId} to tenant ${tenantId}`);

    // Perform the migration
    const result = await gcsClient.migrateOnboardingToTenant(
      product,
      sessionId,
      tenantId
    );

    if (!result.success && result.errors.length > 0) {
      console.error(`[Documents] Migration completed with errors:`, result.errors);
    }

    console.log(`[Documents] Migrated ${result.migratedFiles.length} files for tenant ${tenantId}`);

    return successResponse({
      success: result.success,
      migratedFiles: result.migratedFiles,
      fileCount: result.migratedFiles.length,
      errors: result.errors,
      sessionId,
      tenantId,
    });
  } catch (error) {
    console.error('[Documents] Migration error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Migration failed',
      500
    );
  }
}
