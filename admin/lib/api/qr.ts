import { apiClient } from './client';
import {
  GenerateQRRequest,
  GenerateQRResponse,
  BatchGenerateRequest,
  BatchGenerateResponse,
  QRTypesResponse,
  ApiResponse,
} from './types';

export class QRService {
  /**
   * Generate a QR code
   */
  async generateQRCode(data: GenerateQRRequest): Promise<ApiResponse<GenerateQRResponse>> {
    return apiClient.post<ApiResponse<GenerateQRResponse>>('/qr/generate', data);
  }

  /**
   * Generate QR code as PNG image (for simple types only)
   */
  async generateQRCodeImage(params: {
    type?: 'url' | 'text' | 'phone';
    url?: string;
    text?: string;
    phone?: string;
    size?: number;
    quality?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.set('type', params.type);
    if (params.url) queryParams.set('url', params.url);
    if (params.text) queryParams.set('text', params.text);
    if (params.phone) queryParams.set('phone', params.phone);
    if (params.size) queryParams.set('size', String(params.size));
    if (params.quality) queryParams.set('quality', params.quality);

    const response = await fetch(`/api/qr/image?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to generate QR code image');
    }
    return response.blob();
  }

  /**
   * Download QR code as file attachment
   */
  async downloadQRCode(data: GenerateQRRequest, filename?: string): Promise<Blob> {
    const queryParams = filename ? `?filename=${encodeURIComponent(filename)}` : '';
    const response = await fetch(`/api/qr/download${queryParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to download QR code');
    }
    return response.blob();
  }

  /**
   * Batch generate multiple QR codes
   */
  async batchGenerateQRCodes(data: BatchGenerateRequest): Promise<ApiResponse<BatchGenerateResponse>> {
    return apiClient.post<ApiResponse<BatchGenerateResponse>>('/qr/batch', data);
  }

  /**
   * Get all supported QR code types
   */
  async getQRTypes(): Promise<ApiResponse<QRTypesResponse>> {
    return apiClient.get<ApiResponse<QRTypesResponse>>('/qr/types');
  }
}

export const qrService = new QRService();
