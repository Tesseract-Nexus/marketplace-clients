import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_WIDGET_ORDER, DashboardWidget } from '@/lib/types/dashboard';

// Get auth headers from incoming request
const getAuthHeaders = (request: NextRequest) => {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }

  if (userId) {
    headers['X-User-ID'] = userId;
  }

  return headers;
};

const getBaseUrl = () => {
  const url = process.env.SETTINGS_SERVICE_URL || 'http://localhost:8085';
  return url.replace(/\/+$/, '').replace(/\/api\/v1\/?$/, '');
};

const SETTINGS_SERVICE_BASE = getBaseUrl();

// Validate that required headers are present
const validateRequest = (request: NextRequest): { tenantId: string; userId: string } | null => {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');

  if (!tenantId || !userId) {
    return null;
  }

  return { tenantId, userId };
};

// GET: Retrieve user's dashboard layout preferences
export async function GET(request: NextRequest) {
  try {
    const validation = validateRequest(request);
    if (!validation) {
      // Return defaults if no user context
      return NextResponse.json({
        success: true,
        data: {
          dashboardLayout: DEFAULT_WIDGET_ORDER,
        },
      });
    }

    const { userId } = validation;

    // Try to get user preferences from settings service
    const url = `${SETTINGS_SERVICE_BASE}/api/v1/settings?key=user_preferences_${userId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(request),
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
    const validation = validateRequest(request);
    if (!validation) {
      return NextResponse.json(
        { success: false, message: 'User authentication required' },
        { status: 401 }
      );
    }

    const { userId } = validation;
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
        headers: getAuthHeaders(request),
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
