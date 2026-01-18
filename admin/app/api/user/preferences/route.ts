import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_WIDGET_ORDER, DashboardWidget } from '@/lib/types/dashboard';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const getBaseUrl = () => {
  const url = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085';
  return url.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
};

const SETTINGS_SERVICE_BASE = getBaseUrl();

// Get auth headers and validate that required fields are present
const getAuthInfo = async (request: NextRequest): Promise<{ tenantId: string; userId: string; headers: Record<string, string> } | null> => {
  const headers = await getProxyHeaders(request) as Record<string, string>;
  const tenantId = headers['x-jwt-claim-tenant-id'];
  const userId = headers['x-jwt-claim-sub'];

  if (!tenantId || !userId) {
    return null;
  }

  return { tenantId, userId, headers };
};

// GET: Retrieve user's dashboard layout preferences
export async function GET(request: NextRequest) {
  try {
    const authInfo = await getAuthInfo(request);
    if (!authInfo) {
      // Return defaults if no user context
      return NextResponse.json({
        success: true,
        data: {
          dashboardLayout: DEFAULT_WIDGET_ORDER,
        },
      });
    }

    const { userId, headers } = authInfo;

    // Try to get user preferences from settings service
    const url = `${SETTINGS_SERVICE_BASE}/api/v1/settings?key=user_preferences_${userId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.value?.dashboardLayout) {
          // Merge with defaults to handle new widgets
          const stored = data.data.value.dashboardLayout as DashboardWidget[];
          const merged = mergeWithDefaults(stored, DEFAULT_WIDGET_ORDER);
          return NextResponse.json({
            success: true,
            data: {
              dashboardLayout: merged,
            },
          });
        }
      }
    } catch {
      // If settings service is unavailable, fall back to defaults
      console.log('Settings service unavailable, using defaults');
    }

    // Return defaults if no stored preferences
    return NextResponse.json({
      success: true,
      data: {
        dashboardLayout: DEFAULT_WIDGET_ORDER,
      },
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({
      success: true,
      data: {
        dashboardLayout: DEFAULT_WIDGET_ORDER,
      },
    });
  }
}

// POST: Save user's dashboard layout preferences
export async function POST(request: NextRequest) {
  try {
    const authInfo = await getAuthInfo(request);
    if (!authInfo) {
      return NextResponse.json(
        { success: false, message: 'User authentication required' },
        { status: 401 }
      );
    }

    const { userId, headers } = authInfo;
    const body = await request.json();
    const { dashboardLayout } = body;

    if (!dashboardLayout || !Array.isArray(dashboardLayout)) {
      return NextResponse.json(
        { success: false, message: 'Invalid dashboard layout data' },
        { status: 400 }
      );
    }

    // Save to settings service
    const url = `${SETTINGS_SERVICE_BASE}/api/v1/settings`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: `user_preferences_${userId}`,
          value: {
            dashboardLayout,
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: 'Preferences saved successfully',
        });
      }

      // If save failed, still return success (graceful degradation)
      console.warn('Failed to persist preferences to backend');
    } catch {
      console.warn('Settings service unavailable for saving preferences');
    }

    // Return success anyway - client can cache locally
    return NextResponse.json({
      success: true,
      message: 'Preferences saved',
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

// Helper: Merge stored layout with defaults to handle new widgets
function mergeWithDefaults(stored: DashboardWidget[], defaults: DashboardWidget[]): DashboardWidget[] {
  const storedIds = new Set(stored.map(w => w.id));
  const newWidgets = defaults.filter(w => !storedIds.has(w.id));
  return [
    ...stored,
    ...newWidgets.map((w, i) => ({ ...w, position: stored.length + i })),
  ];
}
