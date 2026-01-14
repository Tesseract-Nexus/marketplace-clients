/**
 * Document Upload API Client
 *
 * Handles document uploads to GCS via the BFF API routes.
 */

export type DocumentCategory = 'address_proof' | 'business_proof' | 'logo' | 'general';
export type ProductType = 'fanzone' | 'marketplace' | 'poker' | 'onboarding';

export interface UploadDocumentOptions {
  file: File;
  sessionId?: string;
  tenantId?: string;
  category: DocumentCategory;
  documentType?: string; // e.g., 'utility_bill', 'abn', 'gstin'
  product?: ProductType;
  onProgress?: (progress: number) => void;
}

export interface UploadDocumentResult {
  success: boolean;
  id?: string;
  path?: string;
  url?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  error?: string;
}

export interface DocumentFile {
  name: string;
  url: string;
  metadata: Record<string, any>;
}

export interface ListDocumentsResult {
  files: DocumentFile[];
  count: number;
  product: ProductType;
  sessionId?: string;
  tenantId?: string;
  category?: DocumentCategory;
}

export interface MigrateDocumentsResult {
  success: boolean;
  migratedFiles: string[];
  fileCount: number;
  errors: string[];
  sessionId: string;
  tenantId: string;
}

class DocumentsAPI {
  private baseURL = '/api/documents';

  /**
   * Upload a document file
   */
  async upload(options: UploadDocumentOptions): Promise<UploadDocumentResult> {
    const {
      file,
      sessionId,
      tenantId,
      category,
      documentType,
      product = 'onboarding',
      onProgress,
    } = options;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('product', product);

      if (sessionId) {
        formData.append('sessionId', sessionId);
      }
      if (tenantId) {
        formData.append('tenantId', tenantId);
      }
      if (documentType) {
        formData.append('documentType', documentType);
      }

      // Use XMLHttpRequest for progress tracking if callback provided
      if (onProgress) {
        return new Promise((resolve) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            try {
              const response = JSON.parse(xhr.responseText);
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve({
                  success: true,
                  ...response.data,
                });
              } else {
                resolve({
                  success: false,
                  error: response.error?.message || 'Upload failed',
                });
              }
            } catch {
              resolve({
                success: false,
                error: 'Failed to parse response',
              });
            }
          });

          xhr.addEventListener('error', () => {
            resolve({
              success: false,
              error: 'Network error during upload',
            });
          });

          xhr.addEventListener('abort', () => {
            resolve({
              success: false,
              error: 'Upload was cancelled',
            });
          });

          xhr.open('POST', `${this.baseURL}/upload`);
          xhr.send(formData);
        });
      }

      // Simple fetch for uploads without progress tracking
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || 'Upload failed',
        };
      }

      return {
        success: true,
        ...data.data,
      };
    } catch (error) {
      console.error('[Documents API] Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Get a signed URL for reading a document
   */
  async getSignedUrl(
    path: string,
    expiresInMinutes: number = 60
  ): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        path,
        expires: expiresInMinutes.toString(),
      });

      const response = await fetch(`${this.baseURL}/upload?${params}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('[Documents API] Get URL error:', data.error);
        return null;
      }

      return data.data?.url || null;
    } catch (error) {
      console.error('[Documents API] Get URL error:', error);
      return null;
    }
  }

  /**
   * Delete a document
   */
  async delete(path: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ path });
      const response = await fetch(`${this.baseURL}/upload?${params}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('[Documents API] Delete error:', error);
      return false;
    }
  }

  /**
   * List documents for a session or tenant
   */
  async list(options: {
    product?: ProductType;
    sessionId?: string;
    tenantId?: string;
    category?: DocumentCategory;
  }): Promise<ListDocumentsResult | null> {
    try {
      const params = new URLSearchParams();

      if (options.product) params.append('product', options.product);
      if (options.sessionId) params.append('sessionId', options.sessionId);
      if (options.tenantId) params.append('tenantId', options.tenantId);
      if (options.category) params.append('category', options.category);

      const response = await fetch(`${this.baseURL}/list?${params}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('[Documents API] List error:', data.error);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('[Documents API] List error:', error);
      return null;
    }
  }

  /**
   * Migrate documents from onboarding session to permanent tenant storage
   * Called after successful verification
   */
  async migrate(
    sessionId: string,
    tenantId: string,
    product: ProductType = 'onboarding'
  ): Promise<MigrateDocumentsResult | null> {
    try {
      const response = await fetch(`${this.baseURL}/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product,
          sessionId,
          tenantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Documents API] Migrate error:', data.error);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('[Documents API] Migrate error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const documentsApi = new DocumentsAPI();

export default documentsApi;
