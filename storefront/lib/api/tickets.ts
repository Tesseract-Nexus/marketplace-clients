export type TicketType = 'SUPPORT' | 'COMPLAINT' | 'QUESTION' | 'BUG' | 'FEATURE' | 'INCIDENT' | 'RETURN_REQUEST';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'CANCELLED' | 'PENDING_APPROVAL' | 'ESCALATED';

export interface CreateTicketRequest {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  metadata?: Record<string, unknown>;
}

export interface TicketComment {
  id: string;
  userId: string;
  userName?: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketHistoryEntry {
  id: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  comments?: TicketComment[];
  history?: TicketHistoryEntry[];
  metadata?: Record<string, unknown>;
}

export interface TicketsResponse {
  success: boolean;
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Use local API route as proxy to avoid CORS issues
const TICKETS_API_URL = '/api/tickets';

export async function createTicket(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  data: CreateTicketRequest,
  userId?: string,
  userName?: string,
  userEmail?: string
): Promise<Ticket> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };

  // Include Authorization if available (legacy auth)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  if (userName) {
    headers['X-User-Name'] = userName;
  }

  if (userEmail) {
    headers['X-User-Email'] = userEmail;
  }

  const response = await fetch(TICKETS_API_URL, {
    method: 'POST',
    headers,
    credentials: 'include', // Important: send session cookies for OAuth flow
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to create ticket');
  }

  const result = await response.json();
  return result.data;
}

export async function listTickets(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  options?: { page?: number; limit?: number; status?: TicketStatus },
  userId?: string
): Promise<TicketsResponse> {
  const params = new URLSearchParams({
    page: String(options?.page || 1),
    limit: String(options?.limit || 10),
  });

  if (options?.status) {
    params.set('status', options.status);
  }

  const headers: Record<string, string> = {
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };

  // Include Authorization if available (legacy auth)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(
    `${TICKETS_API_URL}?${params}`,
    {
      headers,
      credentials: 'include', // Important: send session cookies for OAuth flow
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      };
    }
    throw new Error('Failed to fetch tickets');
  }

  return response.json();
}

export async function getTicket(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  ticketId: string,
  userId?: string
): Promise<Ticket> {
  const headers: Record<string, string> = {
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };

  // Include Authorization if available (legacy auth)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(
    `${TICKETS_API_URL}/${ticketId}`,
    { headers, credentials: 'include' }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Ticket not found');
  }

  const result = await response.json();
  return result.data;
}

export async function addTicketComment(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  ticketId: string,
  content: string,
  userId?: string,
  userName?: string
): Promise<Ticket> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };

  // Include Authorization if available (legacy auth)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  if (userName) {
    headers['X-User-Name'] = userName;
  }

  const response = await fetch(
    `${TICKETS_API_URL}/${ticketId}/comments`,
    {
      method: 'POST',
      headers,
      credentials: 'include', // Important: send session cookies for OAuth flow
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to add comment');
  }

  const result = await response.json();
  return result.data;
}

// Helper functions
export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'ON_HOLD':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'ESCALATED':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export function getPriorityColor(priority: TicketPriority): string {
  switch (priority) {
    case 'LOW':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'HIGH':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'CRITICAL':
    case 'URGENT':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function formatStatus(status: TicketStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
