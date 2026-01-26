import { NextRequest, NextResponse } from 'next/server';

/**
 * Payment Gateway Templates
 * Static configuration data for each supported payment gateway
 */

export interface PaymentGatewayTemplate {
  id: string;
  gatewayType: string;
  displayName: string;
  description: string;
  logoUrl: string;
  supportedCountries: string[];
  supportedPaymentMethods: string[];
  requiredCredentials: string[];
  setupInstructions: string;
  supportsPlatformSplit: boolean;
  isActive: boolean;
}

const GATEWAY_TEMPLATES: PaymentGatewayTemplate[] = [
  {
    id: 'stripe-template',
    gatewayType: 'STRIPE',
    displayName: 'Stripe',
    description: 'Accept credit cards, debit cards, Apple Pay, Google Pay and more. Best for US, UK, EU and Australia.',
    logoUrl: '/logos/stripe.svg',
    supportedCountries: ['US', 'GB', 'AU', 'NZ', 'CA', 'DE', 'FR', 'IE', 'SG', 'JP'],
    supportedPaymentMethods: ['CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_ACCOUNT'],
    requiredCredentials: ['publishable_key', 'secret_key', 'webhook_secret'],
    setupInstructions: `
1. Log in to your Stripe Dashboard at https://dashboard.stripe.com
2. Go to Developers → API Keys
3. Copy your Publishable key (starts with pk_)
4. Copy your Secret key (starts with sk_)
5. For webhooks: Go to Developers → Webhooks → Add endpoint
6. Add your webhook URL and copy the signing secret
    `.trim(),
    supportsPlatformSplit: true,
    isActive: true,
  },
  {
    id: 'paypal-template',
    gatewayType: 'PAYPAL',
    displayName: 'PayPal',
    description: 'Accept PayPal payments and Pay Later options. Trusted worldwide.',
    logoUrl: '/logos/paypal.svg',
    supportedCountries: ['US', 'GB', 'AU', 'CA', 'DE', 'FR', 'IN', 'SG', 'JP', 'NZ'],
    supportedPaymentMethods: ['PAYPAL', 'PAY_LATER'],
    requiredCredentials: ['client_id', 'client_secret'],
    setupInstructions: `
1. Log in to PayPal Developer Dashboard at https://developer.paypal.com
2. Go to Apps & Credentials
3. Create a new app or select an existing one
4. Copy your Client ID and Client Secret
5. For sandbox testing, use sandbox credentials
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'razorpay-template',
    gatewayType: 'RAZORPAY',
    displayName: 'Razorpay',
    description: 'India\'s leading payment gateway. Accept cards, UPI, NetBanking, wallets and more.',
    logoUrl: '/logos/razorpay.svg',
    supportedCountries: ['IN'],
    supportedPaymentMethods: ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'EMI'],
    requiredCredentials: ['key_id', 'key_secret', 'webhook_secret'],
    setupInstructions: `
1. Log in to Razorpay Dashboard at https://dashboard.razorpay.com
2. Go to Settings → API Keys
3. Generate a new API key or use existing
4. Copy your Key ID and Key Secret
5. For webhooks: Go to Settings → Webhooks → Add webhook
6. Copy the webhook secret
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'afterpay-template',
    gatewayType: 'AFTERPAY',
    displayName: 'Afterpay',
    description: 'Buy Now, Pay Later in 4 interest-free installments. Popular in Australia and US.',
    logoUrl: '/logos/afterpay.svg',
    supportedCountries: ['AU', 'NZ', 'US', 'GB'],
    supportedPaymentMethods: ['PAY_LATER'],
    requiredCredentials: ['merchant_id', 'secret_key'],
    setupInstructions: `
1. Sign up for an Afterpay merchant account at https://www.afterpay.com/for-retailers
2. Once approved, log in to your merchant portal
3. Go to Settings → API Configuration
4. Copy your Merchant ID and Secret Key
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'zip-template',
    gatewayType: 'ZIP',
    displayName: 'Zip Pay',
    description: 'Flexible Buy Now, Pay Later solution with longer payment terms.',
    logoUrl: '/logos/zip.svg',
    supportedCountries: ['AU', 'NZ', 'US'],
    supportedPaymentMethods: ['PAY_LATER'],
    requiredCredentials: ['merchant_id', 'api_key'],
    setupInstructions: `
1. Sign up for a Zip merchant account at https://zip.co/business
2. Once approved, access your merchant dashboard
3. Go to Integration → API Settings
4. Copy your Merchant ID and API Key
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
];

/**
 * GET /api/payments/gateway-configs/templates
 * Returns available payment gateway templates
 */
export async function GET(_request: NextRequest) {
  // Filter to only active templates
  const activeTemplates = GATEWAY_TEMPLATES.filter(t => t.isActive);
  return NextResponse.json(activeTemplates, { status: 200 });
}
