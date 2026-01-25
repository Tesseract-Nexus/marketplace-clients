/**
 * Approval Service
 *
 * Handles API calls to the approval-service for managing approval workflows
 */

import { apiClient } from '../api/client';

// Approval types
export type ApprovalType =
  | 'product_creation'
  | 'product_update'
  | 'category_creation'
  | 'category_update'
  | 'order_refund'
  | 'order_cancel'
  | 'vendor_payout'
  | 'price_override'
  | 'vendor_onboarding'
  | 'vendor_status_change'
  | 'vendor_commission_change'
  | 'vendor_contract_change'
  | 'vendor_large_payout';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'request_changes' | 'cancelled' | 'expired';

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  approvalType: ApprovalType;
  status: ApprovalStatus;
  requestedById: string;
  requestedByName: string;
  approvedById?: string;
  approvedByName?: string;
  entityType: string;
  entityId: string;
  entityReference: string;
  amount?: number;
  currency?: string;
  reason: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  requiredPriority: number;
  expiresAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalListParams {
  status?: ApprovalStatus;
  approvalType?: ApprovalType;
  entityType?: string;
  entityId?: string;
  page?: number;
  limit?: number;
}

export interface ApprovalListResponse {
  success: boolean;
  data: ApprovalRequest[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApprovalActionRequest {
  comment?: string;
}

export interface ApprovalResponse {
  success: boolean;
  data: ApprovalRequest;
  message?: string;
}

// API endpoints
// Note: apiClient already has baseUrl='/api', so we use relative paths
const APPROVAL_API_BASE = '/approvals';

export const approvalService = {
  /**
   * List approvals with optional filters
   */
  async listApprovals(params?: ApprovalListParams): Promise<ApprovalListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.approvalType) queryParams.append('approval_type', params.approvalType);
    if (params?.entityType) queryParams.append('entity_type', params.entityType);
    if (params?.entityId) queryParams.append('entity_id', params.entityId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = query ? `${APPROVAL_API_BASE}?${query}` : APPROVAL_API_BASE;

    const response = await apiClient.get<ApprovalListResponse>(url);
    return response;
  },

  /**
   * Get a single approval by ID
   */
  async getApproval(id: string): Promise<ApprovalResponse> {
    const response = await apiClient.get<ApprovalResponse>(`${APPROVAL_API_BASE}/${id}`);
    return response;
  },

  /**
   * Approve an approval request
   */
  async approve(id: string, request?: ApprovalActionRequest): Promise<ApprovalResponse> {
    const response = await apiClient.post<ApprovalResponse>(`${APPROVAL_API_BASE}/${id}/approve`, request || {});
    return response;
  },

  /**
   * Reject an approval request
   */
  async reject(id: string, request: ApprovalActionRequest & { comment: string }): Promise<ApprovalResponse> {
    const response = await apiClient.post<ApprovalResponse>(`${APPROVAL_API_BASE}/${id}/reject`, request);
    return response;
  },

  /**
   * Cancel an approval request (by the requester)
   */
  async cancel(id: string): Promise<ApprovalResponse> {
    const response = await apiClient.post<ApprovalResponse>(`${APPROVAL_API_BASE}/${id}/cancel`, {});
    return response;
  },

  /**
   * Get pending approvals count (for badges)
   */
  async getPendingCount(): Promise<{ count: number }> {
    const response = await this.listApprovals({ status: 'pending', limit: 1 });
    return { count: response.pagination?.total || response.data?.length || 0 };
  },

  /**
   * Get approvals for a specific entity (e.g., order)
   */
  async getByEntity(entityType: string, entityId: string): Promise<ApprovalListResponse> {
    return this.listApprovals({ entityType, entityId });
  },
};

// Workflow types
export interface TriggerThreshold {
  field: string;
  thresholds: {
    max?: number;
    approver_role?: string;
    auto_approve?: boolean;
  }[];
}

export interface ApproverConfig {
  require_different_user: boolean;
  require_active_staff: boolean;
}

export interface EscalationLevel {
  after_hours: number;
  escalate_to_role: string;
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
}

export interface ApprovalWorkflow {
  id: string;
  tenantId: string;
  name: string;
  displayName: string;
  description?: string;
  triggerType: 'threshold' | 'condition' | 'always';
  triggerConfig: TriggerThreshold | Record<string, any>;
  approverConfig: ApproverConfig;
  approvalChain?: Record<string, any>;
  timeoutHours: number;
  escalationConfig?: EscalationConfig;
  notificationConfig?: Record<string, any>;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowListResponse {
  success: boolean;
  data: ApprovalWorkflow[];
}

export interface WorkflowResponse {
  success: boolean;
  data: ApprovalWorkflow;
}

// Workflow API endpoints
// Note: apiClient already has baseUrl='/api', so we use relative paths
const WORKFLOW_API_BASE = '/approvals/admin/approval-workflows';

export const workflowService = {
  /**
   * List all approval workflows
   */
  async listWorkflows(): Promise<WorkflowListResponse> {
    const response = await apiClient.get<WorkflowListResponse>(WORKFLOW_API_BASE);
    return response;
  },

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(id: string): Promise<WorkflowResponse> {
    const response = await apiClient.get<WorkflowResponse>(`${WORKFLOW_API_BASE}/${id}`);
    return response;
  },

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, workflow: Partial<ApprovalWorkflow>): Promise<WorkflowResponse> {
    const response = await apiClient.put<WorkflowResponse>(`${WORKFLOW_API_BASE}/${id}`, workflow);
    return response;
  },

  /**
   * Toggle workflow active status
   */
  async toggleWorkflow(id: string, isActive: boolean): Promise<WorkflowResponse> {
    return this.updateWorkflow(id, { isActive });
  },
};

// Delegation types
export interface Delegation {
  id: string;
  tenantId: string;
  delegatorId: string;
  delegateId: string;
  workflowId?: string;
  reason?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending' | 'expired' | 'revoked';
  isActive: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  createdAt: string;
  updatedAt: string;
  // Enriched fields from API
  delegatorName?: string;
  delegatorEmail?: string;
  delegateName?: string;
  delegateEmail?: string;
  workflowName?: string;
}

export interface CreateDelegationRequest {
  delegateId: string;
  workflowId?: string;
  reason?: string;
  startDate: string;
  endDate: string;
}

export interface RevokeDelegationRequest {
  reason?: string;
}

export interface DelegationListResponse {
  success: boolean;
  data: Delegation[];
}

export interface DelegationResponse {
  success: boolean;
  data: Delegation;
  message?: string;
}

// Delegation API endpoints
// Note: apiClient already has baseUrl='/api', so we use relative paths
const DELEGATION_API_BASE = '/approvals/delegations';

export const delegationService = {
  /**
   * List delegations created by the current user (outgoing)
   */
  async listOutgoing(includeExpired = false): Promise<Delegation[]> {
    const query = includeExpired ? '?include_expired=true' : '';
    const response = await apiClient.get<Delegation[]>(`${DELEGATION_API_BASE}/outgoing${query}`);
    return response;
  },

  /**
   * List delegations granted to the current user (incoming)
   */
  async listIncoming(includeExpired = false): Promise<Delegation[]> {
    const query = includeExpired ? '?include_expired=true' : '';
    const response = await apiClient.get<Delegation[]>(`${DELEGATION_API_BASE}/incoming${query}`);
    return response;
  },

  /**
   * Get a single delegation by ID
   */
  async get(id: string): Promise<Delegation> {
    const response = await apiClient.get<Delegation>(`${DELEGATION_API_BASE}/${id}`);
    return response;
  },

  /**
   * Create a new delegation
   */
  async create(request: CreateDelegationRequest): Promise<Delegation> {
    const response = await apiClient.post<Delegation>(DELEGATION_API_BASE, request);
    return response;
  },

  /**
   * Revoke a delegation
   */
  async revoke(id: string, request?: RevokeDelegationRequest): Promise<Delegation> {
    const response = await apiClient.post<Delegation>(`${DELEGATION_API_BASE}/${id}/revoke`, request || {});
    return response;
  },
};

export default approvalService;
