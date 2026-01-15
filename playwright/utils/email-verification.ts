import { Page } from '@playwright/test';

/**
 * Email Verification Utilities
 *
 * Methods to fetch and verify email verification links from various sources:
 * 1. Direct API call to notification service (internal)
 * 2. Mailinator/test email service
 * 3. Gmail API (requires OAuth setup)
 */

// Test configuration
export const TEST_CONFIG = {
  onboardingUrl: 'https://dev-onboarding.tesserix.app',
  // Email service endpoints for fetching verification links
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service.marketplace.svc.cluster.local:8080',
};

/**
 * Generate a verification link from the tenant-service directly
 * This is useful for testing when we can't access the actual email
 */
export async function getVerificationLinkFromApi(
  email: string,
  sessionId: string
): Promise<string | null> {
  try {
    // In a real scenario, this would call an internal API to get the verification token
    // For now, we'll poll the onboarding app's verification endpoint
    console.log(`[EmailVerification] Fetching verification link for ${email}`);
    return null;
  } catch (error) {
    console.error('[EmailVerification] Failed to fetch verification link:', error);
    return null;
  }
}

/**
 * Wait for verification email and extract the link
 * Uses kubectl to check tenant-service logs for the verification link
 */
export async function getVerificationLinkFromLogs(
  email: string,
  timeoutMs: number = 60000
): Promise<string | null> {
  const { execSync } = require('child_process');
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Search tenant-service logs for verification link
      const logs = execSync(
        `kubectl logs -l app=tenant-service -n marketplace --since=2m 2>/dev/null | grep -i "verification" | grep -i "${email}" | tail -5`,
        { encoding: 'utf-8', timeout: 10000 }
      );

      // Extract verification URL from logs
      const urlMatch = logs.match(/https?:\/\/[^\s]+verify[^\s]+/i);
      if (urlMatch) {
        console.log(`[EmailVerification] Found verification link in logs`);
        return urlMatch[0];
      }
    } catch {
      // Continue polling
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('[EmailVerification] Timeout waiting for verification link in logs');
  return null;
}

/**
 * Get verification link from notification-service API
 * This endpoint returns the most recent verification email for a recipient
 */
export async function getVerificationLinkFromNotificationService(
  email: string,
  apiKey?: string
): Promise<string | null> {
  try {
    const { execSync } = require('child_process');

    // Use kubectl to call the notification service internally
    const result = execSync(
      `kubectl exec -n marketplace deploy/notification-service -c notification-service -- \
       curl -s "http://localhost:8080/api/v1/internal/emails/latest?recipient=${encodeURIComponent(email)}&type=verification" \
       -H "X-Internal-Service: e2e-tests" 2>/dev/null`,
      { encoding: 'utf-8', timeout: 30000 }
    );

    const data = JSON.parse(result);
    if (data.success && data.data?.verificationLink) {
      console.log('[EmailVerification] Got verification link from notification service');
      return data.data.verificationLink;
    }

    // Try to extract from email body
    if (data.success && data.data?.body) {
      const linkMatch = data.data.body.match(/https?:\/\/[^\s"<>]+verify[^\s"<>]+/i);
      if (linkMatch) {
        return linkMatch[0];
      }
    }
  } catch (error) {
    console.log('[EmailVerification] Failed to get link from notification service:', error);
  }

  return null;
}

/**
 * Get verification token from Redis directly
 * Used when other methods fail
 */
export async function getVerificationTokenFromRedis(
  email: string
): Promise<string | null> {
  try {
    const { execSync } = require('child_process');

    // Query Redis for verification token
    const result = execSync(
      `kubectl exec -n marketplace deploy/tenant-service -c tenant-service -- \
       redis-cli -h redis.redis.svc.cluster.local GET "email_verification:${email}" 2>/dev/null`,
      { encoding: 'utf-8', timeout: 10000 }
    );

    if (result && result.trim() && result.trim() !== '(nil)') {
      const data = JSON.parse(result.trim());
      if (data.token) {
        const verifyUrl = `${TEST_CONFIG.onboardingUrl}/verify?token=${data.token}`;
        console.log('[EmailVerification] Built verification link from Redis token');
        return verifyUrl;
      }
    }
  } catch (error) {
    console.log('[EmailVerification] Failed to get token from Redis:', error);
  }

  return null;
}

/**
 * Poll for verification link using multiple methods
 */
export async function waitForVerificationLink(
  email: string,
  timeoutMs: number = 90000
): Promise<string | null> {
  console.log(`[EmailVerification] Waiting for verification link for ${email}...`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // Try notification service first (most reliable)
    let link = await getVerificationLinkFromNotificationService(email);
    if (link) return link;

    // Try Redis token
    link = await getVerificationTokenFromRedis(email);
    if (link) return link;

    // Try logs
    link = await getVerificationLinkFromLogs(email, 5000);
    if (link) return link;

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  return null;
}

/**
 * Navigate to verification link and complete verification
 */
export async function completeEmailVerification(
  page: Page,
  verificationLink: string
): Promise<boolean> {
  try {
    console.log('[EmailVerification] Navigating to verification link...');
    await page.goto(verificationLink, { waitUntil: 'networkidle' });

    // Wait for verification to complete
    await page.waitForTimeout(3000);

    // Check for success indicators
    const pageContent = await page.content();
    const isVerified =
      pageContent.toLowerCase().includes('verified') ||
      pageContent.toLowerCase().includes('success') ||
      pageContent.toLowerCase().includes('confirmed') ||
      page.url().includes('verified=true');

    if (isVerified) {
      console.log('[EmailVerification] Email verification successful');
      return true;
    }

    console.log('[EmailVerification] Verification may have failed - checking page state');
    return false;
  } catch (error) {
    console.error('[EmailVerification] Error during verification:', error);
    return false;
  }
}

/**
 * Generate slug from store name
 */
export function generateSlug(storeName: string): string {
  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
