import { NextRequest, NextResponse } from 'next/server';

const SETTINGS_SERVICE_URL = process.env.SETTINGS_SERVICE_URL || 'http://localhost:3008';

interface GiftCardTemplateSettings {
  enabled: boolean;
  presetAmounts: number[];
  allowCustomAmount: boolean;
  minAmount: number;
  maxAmount: number;
}

interface SettingsResponse {
  id: string;
  marketing?: {
    giftCardTemplates?: GiftCardTemplateSettings;
  };
}

// Default templates as fallback (amounts in display currency)
const defaultTemplates = {
  id: 'default-1',
  name: 'Classic Gift Card',
  description: 'A timeless gift for any occasion',
  amounts: [100, 500, 1000, 2000, 5000],
  allowCustomAmount: false,
  minAmount: 100,
  maxAmount: 50000,
};

/**
 * GET /api/gift-cards/templates
 * Get available gift card templates from tenant settings
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID');

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
  }

  try {
    // Try to fetch settings from the settings service
    const settingsUrl = `${SETTINGS_SERVICE_URL}/api/settings?applicationId=admin-portal&scope=application`;

    const response = await fetch(settingsUrl, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'x-jwt-claim-tenant-id': tenantId,
      },
      // Cache for 5 minutes to reduce load on settings service
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const settings: SettingsResponse = await response.json();
      const giftCardConfig = settings?.marketing?.giftCardTemplates;

      // If gift cards are disabled, return empty array
      if (giftCardConfig?.enabled === false) {
        return NextResponse.json([]);
      }

      // If we have custom settings, use them
      // Amounts are stored in display currency (e.g., INR, USD)
      if (giftCardConfig && giftCardConfig.presetAmounts?.length > 0) {
        const templates = [
          {
            id: 'tenant-config',
            name: 'Gift Card',
            description: 'A perfect gift for any occasion',
            amounts: giftCardConfig.presetAmounts,
            allowCustomAmount: giftCardConfig.allowCustomAmount ?? true,
            minAmount: giftCardConfig.minAmount ?? 100,
            maxAmount: giftCardConfig.maxAmount ?? 50000,
          },
        ];
        return NextResponse.json(templates);
      }
    }

    // Fallback to defaults if settings not found or fetch failed
    return NextResponse.json([defaultTemplates]);
  } catch (error) {
    console.error('Failed to fetch gift card templates from settings:', error);
    // Return default templates on error
    return NextResponse.json([defaultTemplates]);
  }
}
