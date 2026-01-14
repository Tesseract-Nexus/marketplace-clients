// POST /api/onboarding/validate/storefront - Validate storefront slug availability
// If session_id is provided, the slug will also be reserved for that session
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const body = await request.json();
  const storefrontSlug = body.storefront_slug;
  const sessionId = body.session_id;

  // Backend expects GET with query params
  // Include session_id if provided to reserve the slug
  let endpoint = `/api/v1/validation/storefront?storefront_slug=${encodeURIComponent(storefrontSlug)}`;
  if (sessionId) {
    endpoint += `&session_id=${encodeURIComponent(sessionId)}`;
  }

  return proxyGet(SERVICES.TENANT, endpoint, request);
}
