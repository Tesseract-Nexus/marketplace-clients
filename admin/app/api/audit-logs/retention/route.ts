import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config/api';
import { proxyGet, proxyPut } from '@/lib/utils/api-route-handler';

// GET /api/audit-logs/retention - Get retention settings
export async function GET(request: NextRequest) {
  return proxyGet(API_CONFIG.SERVICES.AUDIT, 'audit-logs/retention', request);
}

// PUT /api/audit-logs/retention - Update retention settings
export async function PUT(request: NextRequest) {
  return proxyPut(API_CONFIG.SERVICES.AUDIT, 'audit-logs/retention', request);
}
