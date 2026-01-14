import { NextRequest, NextResponse } from 'next/server';

/**
 * Media Asset Handler (Admin)
 *
 * Redirects marketplace media requests directly to GCS public bucket.
 * Eliminates proxy pattern that caused triple bandwidth costs.
 *
 * Naming: marketplace-{env}-public-{region}
 * Example: marketplace-devtest-public-au
 */

const CDN_BASE_URL = process.env.STORAGE_PUBLIC_BUCKET_URL
  || `https://storage.googleapis.com/${process.env.STORAGE_PUBLIC_BUCKET || 'marketplace-devtest-public-au'}`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await params;
  const assetPath = path?.join('/');

  if (!assetPath || assetPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  return NextResponse.redirect(`${CDN_BASE_URL}/${assetPath}`, 302);
}
