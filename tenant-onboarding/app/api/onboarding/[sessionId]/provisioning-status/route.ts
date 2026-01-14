/**
 * Provisioning Status API Route
 *
 * GET /api/onboarding/:sessionId/provisioning-status?slug=tenant-slug
 *
 * Checks the provisioning status of a tenant's infrastructure (VirtualServices, etc.)
 * by querying the tenant-router-service.
 */

import { NextRequest, NextResponse } from 'next/server';

const TENANT_ROUTER_URL = process.env.TENANT_ROUTER_URL || 'http://tenant-router-service.marketplace.svc.cluster.local:8089';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Query tenant-router-service for host status
    const response = await fetch(`${TENANT_ROUTER_URL}/api/v1/hosts/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache this response
      cache: 'no-store',
    });

    if (response.status === 404) {
      // Host record not found yet - still being created
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Infrastructure provisioning in progress',
        ready: false,
      });
    }

    if (!response.ok) {
      console.error('[Provisioning Status] Failed to fetch status:', response.status);
      return NextResponse.json({
        success: true,
        status: 'unknown',
        message: 'Unable to check status',
        ready: false,
      });
    }

    const data = await response.json();
    const hostRecord = data.data;

    if (!hostRecord) {
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Infrastructure provisioning in progress',
        ready: false,
      });
    }

    // Check if all VirtualServices are provisioned
    const isReady =
      hostRecord.status === 'provisioned' &&
      hostRecord.admin_vs_patched === true &&
      hostRecord.storefront_vs_patched === true &&
      hostRecord.api_vs_patched === true;

    // Calculate what's done and what's pending
    const steps = {
      certificate: hostRecord.certificate_created === true,
      gateway: hostRecord.gateway_patched === true,
      admin_vs: hostRecord.admin_vs_patched === true,
      storefront_vs: hostRecord.storefront_vs_patched === true,
      api_vs: hostRecord.api_vs_patched === true,
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const totalSteps = Object.keys(steps).length;

    return NextResponse.json({
      success: true,
      status: hostRecord.status,
      ready: isReady,
      progress: {
        completed: completedSteps,
        total: totalSteps,
        percentage: Math.round((completedSteps / totalSteps) * 100),
        steps,
      },
      admin_host: hostRecord.admin_host,
      storefront_host: hostRecord.storefront_host,
      message: isReady
        ? 'Your store is ready!'
        : `Setting up infrastructure (${completedSteps}/${totalSteps})...`,
    });
  } catch (error) {
    console.error('[Provisioning Status] Error:', error);
    return NextResponse.json({
      success: true,
      status: 'error',
      message: 'Unable to check provisioning status',
      ready: false,
    });
  }
}
