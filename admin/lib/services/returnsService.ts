import { apiClient } from '../api/client';

export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Return {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string;
  rmaNumber: string;
  status: string;
  reason: string;
  returnType: string;
  customerNotes?: string;
  adminNotes?: string;
  refundAmount?: number;
  refundMethod?: string;
  createdAt: string;
  updatedAt: string;
  items?: ReturnItem[];
  order?: {
    orderNumber: string;
    customer?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface ReturnsListResponse {
  data: Return[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ReturnResponse {
  data: Return;
}

class ReturnsService {
  async getReturns(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Promise<ReturnsListResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
    if (params?.search) queryParams.search = params.search;

    const response = await apiClient.get<ReturnsListResponse>('/returns', queryParams);
    return response;
  }

  async getReturn(id: string): Promise<ReturnResponse> {
    return await apiClient.get<ReturnResponse>(`/returns/${id}`);
  }

  async approveReturn(id: string, notes?: string): Promise<void> {
    await apiClient.post(`/returns/${id}/approve`, { notes });
  }

  async rejectReturn(id: string, reason: string): Promise<void> {
    await apiClient.post(`/returns/${id}/reject`, { reason });
  }

  async completeReturn(id: string, refundAmount: number, refundMethod: string): Promise<void> {
    await apiClient.post(`/returns/${id}/complete`, { refundAmount, refundMethod });
  }

  async cancelReturn(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/returns/${id}/cancel`, { reason });
  }
}

export const returnsService = new ReturnsService();
