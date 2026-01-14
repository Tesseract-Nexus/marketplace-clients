import { NextRequest, NextResponse } from 'next/server';

// OAuth configuration
const OAUTH_CONFIG = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture',
    scopes: ['email', 'public_profile'],
    clientId: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scopes: ['name', 'email'],
    clientId: process.env.APPLE_CLIENT_ID || '',
    clientSecret: process.env.APPLE_CLIENT_SECRET || '',
  },
};

type Provider = keyof typeof OAUTH_CONFIG;

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!OAUTH_CONFIG[provider as Provider]) {
    return NextResponse.json(
      { error: 'Invalid OAuth provider' },
      { status: 400 }
    );
  }

  const config = OAUTH_CONFIG[provider as Provider];

  if (!config.clientId) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured` },
      { status: 500 }
    );
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/oauth/${provider}/callback`;

  // Get tenant info from cookies or query params
  const tenantId = request.cookies.get('tenantId')?.value ||
                   request.nextUrl.searchParams.get('tenantId') || '';
  const storefrontId = request.cookies.get('storefrontId')?.value ||
                       request.nextUrl.searchParams.get('storefrontId') || '';
  const returnUrl = request.nextUrl.searchParams.get('returnUrl') || '/account';

  // Create state parameter with tenant info
  const state = Buffer.from(JSON.stringify({
    tenantId,
    storefrontId,
    returnUrl,
    nonce: Math.random().toString(36).substring(7),
  })).toString('base64url');

  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  // Provider-specific params
  if (provider === 'google') {
    authParams.set('access_type', 'offline');
    authParams.set('prompt', 'consent');
  } else if (provider === 'apple') {
    authParams.set('response_mode', 'form_post');
  }

  const authUrl = `${config.authUrl}?${authParams.toString()}`;

  return NextResponse.redirect(authUrl);
}
