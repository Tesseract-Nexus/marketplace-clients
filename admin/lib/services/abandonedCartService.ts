import { apiClient } from '../api/client';

export interface AbandonedCartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface AbandonedCart {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'ABANDONED' | 'RECOVERED' | 'EXPIRED' | 'CONTACTED';
  items: AbandonedCartItem[];
  subtotal: string;
  itemCount: number;
  abandonedAt: string;
  lastContactedAt?: string;
  recoveryAttempts: number;
  sessionDuration: number;
}

interface AbandonedCartsResponse {
  data: AbandonedCart[];
  total: number;
}

class AbandonedCartService {
  async getAbandonedCarts(params?: {
    abandonedAfterMinutes?: number;
  }): Promise<AbandonedCartsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.abandonedAfterMinutes) {
      queryParams.abandonedAfterMinutes = String(params.abandonedAfterMinutes);
    }

    const response = await apiClient.get<AbandonedCartsResponse>(
      '/carts/abandoned',
      queryParams
    );

    return response;
  }

  async deleteAbandonedCart(id: string): Promise<void> {
    await apiClient.delete(`/carts/abandoned/${id}`);
  }

  async sendRecoveryEmail(id: string): Promise<void> {
    await apiClient.post(`/carts/abandoned/${id}/send-recovery`);
  }
}

export const abandonedCartService = new AbandonedCartService();
