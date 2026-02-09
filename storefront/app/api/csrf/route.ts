import { handleCsrfTokenRequest } from '@/lib/security/csrf';

export async function GET() {
  return handleCsrfTokenRequest();
}
