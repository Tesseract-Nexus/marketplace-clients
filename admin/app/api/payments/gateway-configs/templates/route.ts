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
    supportedCountries: ['US', 'GB', 'AU', 'NZ', 'CA', 'DE', 'FR', 'IE', 'SG', 'JP', 'GLOBAL'],
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
    description: 'Accept PayPal payments and Pay Later options. Trusted worldwide with buyer protection.',
    logoUrl: '/logos/paypal.svg',
    supportedCountries: ['US', 'GB', 'AU', 'CA', 'DE', 'FR', 'IN', 'SG', 'JP', 'NZ', 'GLOBAL'],
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
    description: 'India\'s leading payment gateway. Accept cards, UPI, NetBanking, wallets and EMI options.',
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
    id: 'phonepe-template',
    gatewayType: 'PHONEPE',
    displayName: 'PhonePe',
    description: 'Popular UPI payment gateway in India. Accept UPI, cards and wallet payments with wide reach.',
    logoUrl: '/logos/phonepe.svg',
    supportedCountries: ['IN'],
    supportedPaymentMethods: ['UPI', 'CARD', 'WALLET'],
    requiredCredentials: ['merchant_id', 'salt_key', 'salt_index'],
    setupInstructions: `
1. Register as a PhonePe merchant at https://business.phonepe.com
2. Complete KYC verification
3. Access your merchant dashboard
4. Go to Integration → API Keys
5. Copy your Merchant ID, Salt Key, and Salt Index
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'afterpay-template',
    gatewayType: 'AFTERPAY',
    displayName: 'Afterpay',
    description: 'Buy Now, Pay Later in 4 interest-free installments. Popular in Australia, NZ, US and UK.',
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
    description: 'Flexible Buy Now, Pay Later solution with longer payment terms. Up to 12 months interest-free.',
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
  {
    id: 'gpay-template',
    gatewayType: 'GOOGLE_PAY',
    displayName: 'Google Pay',
    description: 'Accept Google Pay for fast, secure checkout. Works globally on Android and web.',
    logoUrl: '/logos/gpay.svg',
    supportedCountries: ['US', 'GB', 'AU', 'IN', 'SG', 'JP', 'CA', 'DE', 'FR', 'GLOBAL'],
    supportedPaymentMethods: ['GOOGLE_PAY', 'CARD'],
    requiredCredentials: ['merchant_id', 'merchant_name', 'gateway_merchant_id'],
    setupInstructions: `
1. Sign up for Google Pay Business at https://pay.google.com/business/console
2. Complete merchant verification
3. Get your Merchant ID from the console
4. Configure your payment processor (Stripe, Razorpay, etc.)
5. Copy your Gateway Merchant ID from your processor
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'applepay-template',
    gatewayType: 'APPLE_PAY',
    displayName: 'Apple Pay',
    description: 'Accept Apple Pay for secure, private payments on iPhone, iPad, Mac and Apple Watch.',
    logoUrl: '/logos/applepay.svg',
    supportedCountries: ['US', 'GB', 'AU', 'CA', 'SG', 'JP', 'DE', 'FR', 'GLOBAL'],
    supportedPaymentMethods: ['APPLE_PAY', 'CARD'],
    requiredCredentials: ['merchant_id', 'merchant_certificate', 'domain_verification_file'],
    setupInstructions: `
1. Enroll in Apple Developer Program at https://developer.apple.com
2. Create a Merchant ID in Certificates, Identifiers & Profiles
3. Generate a Payment Processing Certificate
4. Verify your domain with Apple
5. Configure your payment processor (Stripe, etc.)
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'paytm-template',
    gatewayType: 'PAYTM',
    displayName: 'Paytm',
    description: 'India\'s popular digital wallet and payment gateway. Accept UPI, cards, netbanking and Paytm wallet.',
    logoUrl: '/logos/paytm.svg',
    supportedCountries: ['IN'],
    supportedPaymentMethods: ['UPI', 'WALLET', 'CARD', 'NET_BANKING'],
    requiredCredentials: ['merchant_id', 'merchant_key', 'website'],
    setupInstructions: `
1. Register at Paytm for Business at https://business.paytm.com
2. Complete KYC and business verification
3. Access your dashboard and go to Developer Settings
4. Copy your Merchant ID and Merchant Key
5. Configure your website/app details
    `.trim(),
    supportsPlatformSplit: false,
    isActive: true,
  },
  {
    id: 'upi-template',
    gatewayType: 'UPI',
    displayName: 'UPI Direct',
    description: 'Accept direct UPI payments in India. Works with all UPI apps - GPay, PhonePe, Paytm, BHIM etc.',
    logoUrl: '/logos/upi.svg',
    supportedCountries: ['IN'],
    supportedPaymentMethods: ['UPI'],
    requiredCredentials: ['vpa', 'merchant_name', 'mcc'],
    setupInstructions: `
1. Register with a UPI PSP (Payment Service Provider)
2. Get your Virtual Payment Address (VPA) like yourstore@upi
3. Configure your Merchant Category Code (MCC)
4. Set up webhook for payment notifications
5. Test with small amounts before going live
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
