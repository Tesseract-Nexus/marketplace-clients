// POST /api/onboarding/validate/[type] - Validate business name, email, subdomain, domain
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { type } = await params;
  // type can be: business, email, subdomain, domain
  return proxyPost(SERVICES.TENANT, `/api/onboarding/validate/${type}`, request);
}
