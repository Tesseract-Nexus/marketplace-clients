import { handleCsrfTokenRequest } from '@/lib/security/csrf';

/**
 * GET /api/csrf - Get a new CSRF token
 *
 * Client should call this endpoint to get a CSRF token
 * The token will be set as a cookie and returned in the response
 */
export async function GET() {
  return handleCsrfTokenRequest();
}
