import { NextRequest } from 'next/server';
import { gcsClient, type ProductType, type DocumentCategory } from '../../../../lib/storage/gcs-client';
import { errorResponse, successResponse, validateRequest } from '../../lib/api-handler';

// Validate product type
function isValidProduct(product: string): product is ProductType {
  return ['fanzone', 'marketplace', 'poker', 'onboarding'].includes(product);
}

// Validate document category
function isValidCategory(category: string): category is DocumentCategory {
  return ['address_proof', 'business_proof', 'logo', 'general'].includes(category);
}

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  try {
    const { searchParams } = new URL(request.url);
    const productInput = searchParams.get('product') || 'onboarding';
    const sessionId = searchParams.get('sessionId');
    const tenantId = searchParams.get('tenantId');
    const categoryInput = searchParams.get('category');

    if (!isValidProduct(productInput)) {
      return errorResponse('Invalid product type', 400);
    }

    if (!sessionId && !tenantId) {
      return errorResponse('Either sessionId or tenantId is required', 400);
    }

    const product = productInput as ProductType;
    const category = categoryInput && isValidCategory(categoryInput)
      ? categoryInput as DocumentCategory
      : undefined;

    const files = await gcsClient.listFiles({
      product,
      sessionId: sessionId || undefined,
      tenantId: tenantId || undefined,
      category,
    });

    // Get signed URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await gcsClient.getSignedReadUrl(file.name, 60);
        return {
          ...file,
          url,
        };
      })
    );

    return successResponse({
      files: filesWithUrls,
      count: filesWithUrls.length,
      product,
      ...(sessionId && { sessionId }),
      ...(tenantId && { tenantId }),
      ...(category && { category }),
    });
  } catch (error) {
    console.error('[Documents] List error:', error);
    return errorResponse('Failed to list documents', 500);
  }
}
