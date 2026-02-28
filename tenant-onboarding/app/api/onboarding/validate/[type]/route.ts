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

  // Allowlist to prevent path traversal (e.g., type=../admin)
  const allowedTypes = ['business', 'email', 'subdomain', 'domain'];
  if (!allowedTypes.includes(type)) {
    return new Response(JSON.stringify({ error: 'Invalid validation type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return proxyPost(SERVICES.TENANT, `/api/onboarding/validate/${type}`, request);
}
