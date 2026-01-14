// POST /api/onboarding/validate/subdomain - Validate subdomain availability
// If session_id is provided, the slug will also be reserved for that session
// Optional storefront_slug can be passed to save the storefront URL slug
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const body = await request.json();
  const subdomain = body.subdomain;
  const sessionId = body.session_id;
  const storefrontSlug = body.storefront_slug;

  // Backend expects GET with query params
  // Include session_id if provided to reserve the slug
  // Include storefront_slug if provided to save the storefront URL
  let endpoint = `/api/v1/validation/subdomain?subdomain=${encodeURIComponent(subdomain)}`;
  if (sessionId) {
    endpoint += `&session_id=${encodeURIComponent(sessionId)}`;
  }
  if (storefrontSlug) {
    endpoint += `&storefront_slug=${encodeURIComponent(storefrontSlug)}`;
  }

  return proxyGet(SERVICES.TENANT, endpoint, request);
}