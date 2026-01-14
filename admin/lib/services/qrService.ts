import { qrService } from '../api/qr';
import {
  GenerateQRRequest,
  GenerateQRResponse,
  BatchGenerateRequest,
  BatchGenerateResponse,
  QRTypesResponse,
  QRTypeInfo,
  ApiResponse,
} from '../api/types';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

/**
 * Mock QR types for development
 */
const mockQRTypes: QRTypeInfo[] = [
  { type: 'url', name: 'URL', description: 'Link to any website', icon: 'link' },
  { type: 'text', name: 'Text', description: 'Plain text content', icon: 'type' },
  { type: 'wifi', name: 'WiFi', description: 'WiFi network credentials', icon: 'wifi' },
  { type: 'vcard', name: 'Contact', description: 'Contact information (vCard)', icon: 'user' },
  { type: 'email', name: 'Email', description: 'Email with subject and body', icon: 'mail' },
  { type: 'phone', name: 'Phone', description: 'Phone number to call', icon: 'phone' },
  { type: 'sms', name: 'SMS', description: 'SMS message', icon: 'message-square' },
  { type: 'geo', name: 'Location', description: 'Geographic coordinates', icon: 'map-pin' },
  { type: 'app', name: 'App Store', description: 'App store links', icon: 'smartphone' },
  { type: 'payment', name: 'Payment', description: 'Payment QR (UPI, Crypto)', icon: 'credit-card' },
];

/**
 * Generate a simple mock QR code (base64 placeholder)
 */
function generateMockQRCode(): string {
  // This is a placeholder 1x1 transparent PNG in base64
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * Mock service implementation
 */
class MockQRService {
  async generateQRCode(data: GenerateQRRequest): Promise<ApiResponse<GenerateQRResponse>> {
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        type: data.type,
        qr_code: generateMockQRCode(),
        format: data.format || 'base64',
        size: data.size || 256,
        quality: data.quality || 'medium',
        encrypted: false,
        created_at: new Date().toISOString(),
      },
    };
  }

  async generateQRCodeImage(): Promise<Blob> {
    // Return a minimal valid PNG blob
    const base64 = generateMockQRCode();
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'image/png' });
  }

  async downloadQRCode(): Promise<Blob> {
    return this.generateQRCodeImage();
  }

  async batchGenerateQRCodes(data: BatchGenerateRequest): Promise<ApiResponse<BatchGenerateResponse>> {
    const results = data.items.map((item) => ({
      label: item.label,
      qr_code: generateMockQRCode(),
    }));

    return {
      success: true,
      data: {
        results,
        total: data.items.length,
        success: data.items.length,
        failed: 0,
      },
    };
  }

  async getQRTypes(): Promise<ApiResponse<QRTypesResponse>> {
    return {
      success: true,
      data: {
        types: mockQRTypes,
      },
    };
  }
}

const mockService = new MockQRService();

/**
 * Unified QR service that switches between mock and API
 */
export const qrCodeService = {
  generateQRCode: async (data: GenerateQRRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.generateQRCode(data);
    }
    return qrService.generateQRCode(data);
  },

  generateQRCodeImage: async (params: {
    type?: 'url' | 'text' | 'phone';
    url?: string;
    text?: string;
    phone?: string;
    size?: number;
    quality?: string;
  }) => {
    if (USE_MOCK_DATA) {
      return mockService.generateQRCodeImage();
    }
    return qrService.generateQRCodeImage(params);
  },

  downloadQRCode: async (data: GenerateQRRequest, filename?: string) => {
    if (USE_MOCK_DATA) {
      return mockService.downloadQRCode();
    }
    return qrService.downloadQRCode(data, filename);
  },

  batchGenerateQRCodes: async (data: BatchGenerateRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.batchGenerateQRCodes(data);
    }
    return qrService.batchGenerateQRCodes(data);
  },

  getQRTypes: async () => {
    if (USE_MOCK_DATA) {
      return mockService.getQRTypes();
    }
    return qrService.getQRTypes();
  },

  isMockMode: () => USE_MOCK_DATA,
};
