import { apiClient } from './client';
import type { ApiResponse, ApiListResponse } from './types';
import type {
  StaffDocument,
  CreateStaffDocumentRequest,
  UpdateStaffDocumentRequest,
  VerifyDocumentRequest,
  EmergencyContact,
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
  StaffComplianceStatus,
  DocumentTypeInfo,
} from './staffDocumentTypes';

// ===========================================
// Staff Document Service
// ===========================================

export class StaffDocumentService {
  // Document CRUD
  async list(
    staffId: string,
    params?: {
      page?: number;
      limit?: number;
      documentType?: string;
      verificationStatus?: string;
    }
  ): Promise<ApiListResponse<StaffDocument>> {
    return apiClient.get<ApiListResponse<StaffDocument>>(
      `/staff/staff/${staffId}/verification-documents`,
      params
    );
  }

  async get(staffId: string, documentId: string): Promise<ApiResponse<StaffDocument>> {
    return apiClient.get<ApiResponse<StaffDocument>>(
      `/staff/staff/${staffId}/verification-documents/${documentId}`
    );
  }

  async create(staffId: string, data: CreateStaffDocumentRequest): Promise<ApiResponse<StaffDocument>> {
    return apiClient.post<ApiResponse<StaffDocument>>(
      `/staff/staff/${staffId}/verification-documents`,
      data
    );
  }

  async update(
    staffId: string,
    documentId: string,
    data: UpdateStaffDocumentRequest
  ): Promise<ApiResponse<StaffDocument>> {
    return apiClient.put<ApiResponse<StaffDocument>>(
      `/staff/staff/${staffId}/verification-documents/${documentId}`,
      data
    );
  }

  async delete(staffId: string, documentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(
      `/staff/staff/${staffId}/verification-documents/${documentId}`
    );
  }

  // Document Verification
  async verify(
    staffId: string,
    documentId: string,
    data: VerifyDocumentRequest
  ): Promise<ApiResponse<StaffDocument>> {
    return apiClient.post<ApiResponse<StaffDocument>>(
      `/staff/staff/${staffId}/verification-documents/${documentId}/verify`,
      data
    );
  }

  // Compliance Status
  async getComplianceStatus(staffId: string): Promise<ApiResponse<StaffComplianceStatus>> {
    return apiClient.get<ApiResponse<StaffComplianceStatus>>(`/staff/staff/${staffId}/compliance`);
  }

  // Document Types
  async getDocumentTypes(): Promise<ApiResponse<DocumentTypeInfo[]>> {
    return apiClient.get<ApiResponse<DocumentTypeInfo[]>>('/staff/documents/types');
  }

  // Pending Documents (for verification queue)
  async getPendingDocuments(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiListResponse<StaffDocument>> {
    return apiClient.get<ApiListResponse<StaffDocument>>('/staff/documents/pending', params);
  }

  // Expiring Documents
  async getExpiringDocuments(params?: {
    page?: number;
    limit?: number;
    days?: number;
  }): Promise<ApiListResponse<StaffDocument>> {
    return apiClient.get<ApiListResponse<StaffDocument>>('/staff/documents/expiring', params);
  }

  // Update expired document statuses
  async updateExpiredDocuments(): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.post<ApiResponse<{ updated: number }>>('/staff/documents/update-expired', {});
  }
}

// ===========================================
// Emergency Contact Service
// ===========================================

export class EmergencyContactService {
  async list(staffId: string): Promise<ApiResponse<EmergencyContact[]>> {
    return apiClient.get<ApiResponse<EmergencyContact[]>>(`/staff/staff/${staffId}/emergency-contacts`);
  }

  async get(staffId: string, contactId: string): Promise<ApiResponse<EmergencyContact>> {
    return apiClient.get<ApiResponse<EmergencyContact>>(
      `/staff/staff/${staffId}/emergency-contacts/${contactId}`
    );
  }

  async create(
    staffId: string,
    data: CreateEmergencyContactRequest
  ): Promise<ApiResponse<EmergencyContact>> {
    return apiClient.post<ApiResponse<EmergencyContact>>(
      `/staff/staff/${staffId}/emergency-contacts`,
      data
    );
  }

  async update(
    staffId: string,
    contactId: string,
    data: UpdateEmergencyContactRequest
  ): Promise<ApiResponse<EmergencyContact>> {
    return apiClient.put<ApiResponse<EmergencyContact>>(
      `/staff/staff/${staffId}/emergency-contacts/${contactId}`,
      data
    );
  }

  async delete(staffId: string, contactId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(
      `/staff/staff/${staffId}/emergency-contacts/${contactId}`
    );
  }

  async setPrimary(staffId: string, contactId: string): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(
      `/staff/staff/${staffId}/emergency-contacts/${contactId}/primary`,
      {}
    );
  }
}

// Export singleton instances
export const staffDocumentService = new StaffDocumentService();
export const emergencyContactService = new EmergencyContactService();
