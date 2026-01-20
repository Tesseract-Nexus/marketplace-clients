import { Storage, Bucket, File } from '@google-cloud/storage';

// Product types supported by the document service
export type ProductType = 'fanzone' | 'marketplace' | 'poker' | 'onboarding';

// Document categories
export type DocumentCategory = 'address_proof' | 'business_proof' | 'logo' | 'general';

// Environment configuration
const GCS_BUCKET_MAP: Record<string, string> = {
  development: 'tesserix-devtest-assets',
  devtest: 'tesserix-devtest-assets',
  pilot: 'tesserix-pilot-assets',
  staging: 'tesserix-pilot-assets',
  production: 'tesserix-prod-assets',
  prod: 'tesserix-prod-assets',
};

// Upload response interface
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  error?: string;
}

// Upload options interface
export interface UploadOptions {
  product: ProductType;
  sessionId?: string;       // For onboarding uploads (temporary)
  tenantId?: string;        // For verified tenant uploads (permanent)
  category: DocumentCategory;
  fileName: string;
  contentType: string;
  metadata?: Record<string, string>;
}

// List files options
export interface ListFilesOptions {
  product: ProductType;
  sessionId?: string;
  tenantId?: string;
  category?: DocumentCategory;
  prefix?: string;
}

// Signed URL options
export interface SignedUrlOptions {
  action: 'read' | 'write' | 'delete';
  expiresInMinutes?: number;
  contentType?: string;
}

class GCSStorageClient {
  private storage: Storage;
  private bucketName: string;
  private bucket: Bucket;
  private initialized: boolean = false;

  constructor() {
    // Initialize GCS client
    // In production, credentials come from GOOGLE_APPLICATION_CREDENTIALS env var
    // or from the service account attached to the GKE pod (via Workload Identity)
    const projectId = process.env.GCP_PROJECT_ID || 'tesserix-480811';
    this.storage = new Storage({
      projectId,
      // If running locally, use credentials file
      ...(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && {
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
      }),
    });

    // Determine bucket based on environment
    const env = process.env.NODE_ENV || 'development';
    const customBucket = process.env.GCS_BUCKET_NAME;
    const defaultBucket = 'tesserix-devtest-assets';
    this.bucketName = customBucket || GCS_BUCKET_MAP[env] || defaultBucket;
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Initialize and verify bucket access
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const [exists] = await this.bucket.exists();
      if (!exists) {
        throw new Error(`GCS bucket '${this.bucketName}' does not exist`);
      }
      this.initialized = true;
      console.log(`[GCS] Connected to bucket: ${this.bucketName}`);
    } catch (error) {
      console.error('[GCS] Failed to initialize storage client:', error);
      throw error;
    }
  }

  /**
   * Build the storage path based on product, tenant/session, and category
   *
   * Structure:
   * - For onboarding (temporary): {product}/onboarding/{sessionId}/{category}/{filename}
   * - For verified tenants: {product}/tenants/{tenantId}/{category}/{filename}
   */
  buildPath(options: UploadOptions): string {
    const { product, sessionId, tenantId, category, fileName } = options;

    // Sanitize filename to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

    if (product === 'onboarding' || sessionId) {
      // Temporary onboarding storage - will be migrated or cleaned up
      const id = sessionId || 'unknown';
      return `${product}/onboarding/${id}/${category}/${uniqueFileName}`;
    }

    if (tenantId) {
      // Permanent tenant storage
      return `${product}/tenants/${tenantId}/${category}/${uniqueFileName}`;
    }

    throw new Error('Either sessionId or tenantId must be provided');
  }

  /**
   * Upload a file to GCS
   */
  async upload(
    fileBuffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      await this.ensureInitialized();

      const path = this.buildPath(options);
      const file = this.bucket.file(path);

      // Set metadata
      const metadata: Record<string, string> = {
        contentType: options.contentType,
        product: options.product,
        category: options.category,
        ...(options.sessionId && { sessionId: options.sessionId }),
        ...(options.tenantId && { tenantId: options.tenantId }),
        uploadedAt: new Date().toISOString(),
        ...options.metadata,
      };

      // Upload the file
      await file.save(fileBuffer, {
        contentType: options.contentType,
        metadata: {
          metadata,
        },
        resumable: fileBuffer.length > 5 * 1024 * 1024, // Use resumable upload for files > 5MB
      });

      // Make file publicly readable if needed (or use signed URLs for private access)
      // For now, we'll use signed URLs for security
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      console.log(`[GCS] Uploaded file: ${path}`);

      return {
        success: true,
        url: signedUrl,
        path,
        fileName: options.fileName,
        contentType: options.contentType,
        size: fileBuffer.length,
      };
    } catch (error) {
      console.error('[GCS] Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Generate a signed URL for uploading (resumable upload for large files)
   */
  async getSignedUploadUrl(
    options: UploadOptions,
    expiresInMinutes: number = 15
  ): Promise<{ url: string; path: string } | null> {
    try {
      await this.ensureInitialized();

      const path = this.buildPath(options);
      const file = this.bucket.file(path);

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
        contentType: options.contentType,
      });

      return { url, path };
    } catch (error) {
      console.error('[GCS] Failed to generate signed upload URL:', error);
      return null;
    }
  }

  /**
   * Generate a signed URL for reading a file
   */
  async getSignedReadUrl(
    path: string,
    expiresInMinutes: number = 60
  ): Promise<string | null> {
    try {
      await this.ensureInitialized();

      const file = this.bucket.file(path);
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });

      return url;
    } catch (error) {
      console.error('[GCS] Failed to generate signed read URL:', error);
      return null;
    }
  }

  /**
   * Delete a file from GCS
   */
  async delete(path: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const file = this.bucket.file(path);
      await file.delete({ ignoreNotFound: true });

      console.log(`[GCS] Deleted file: ${path}`);
      return true;
    } catch (error) {
      console.error('[GCS] Delete failed:', error);
      return false;
    }
  }

  /**
   * List files by prefix
   */
  async listFiles(options: ListFilesOptions): Promise<{ name: string; metadata: any }[]> {
    try {
      await this.ensureInitialized();

      let prefix: string;
      if (options.prefix) {
        prefix = options.prefix;
      } else if (options.sessionId) {
        prefix = `${options.product}/onboarding/${options.sessionId}/`;
        if (options.category) {
          prefix += `${options.category}/`;
        }
      } else if (options.tenantId) {
        prefix = `${options.product}/tenants/${options.tenantId}/`;
        if (options.category) {
          prefix += `${options.category}/`;
        }
      } else {
        prefix = `${options.product}/`;
      }

      const [files] = await this.bucket.getFiles({ prefix });

      return files.map((file) => ({
        name: file.name,
        metadata: file.metadata,
      }));
    } catch (error) {
      console.error('[GCS] List files failed:', error);
      return [];
    }
  }

  /**
   * Move files from onboarding (temporary) to tenant (permanent) storage
   * Called after successful verification
   *
   * @param sessionId - The onboarding session ID
   * @param tenantId - The newly created tenant ID
   * @param destinationProduct - The product folder for permanent storage (e.g., 'marketplace', 'fanzone')
   */
  async migrateOnboardingToTenant(
    sessionId: string,
    tenantId: string,
    destinationProduct: ProductType = 'marketplace'
  ): Promise<{ success: boolean; migratedFiles: string[]; errors: string[] }> {
    const migratedFiles: string[] = [];
    const errors: string[] = [];

    try {
      await this.ensureInitialized();

      // Source is always in the onboarding folder
      // Structure: onboarding/onboarding/{sessionId}/{category}/{filename}
      const sourcePrefix = `onboarding/onboarding/${sessionId}/`;
      const [files] = await this.bucket.getFiles({ prefix: sourcePrefix });

      if (files.length === 0) {
        console.log(`[GCS] No files found in ${sourcePrefix}`);
        return { success: true, migratedFiles: [], errors: [] };
      }

      console.log(`[GCS] Found ${files.length} files to migrate from ${sourcePrefix}`);

      for (const file of files) {
        try {
          // Calculate new path: {destinationProduct}/tenants/{tenantId}/{category}/{filename}
          const relativePath = file.name.substring(sourcePrefix.length);
          const newPath = `${destinationProduct}/tenants/${tenantId}/${relativePath}`;

          // Copy to new location
          await file.copy(this.bucket.file(newPath));

          // Delete original
          await file.delete();

          migratedFiles.push(newPath);
          console.log(`[GCS] Migrated: ${file.name} -> ${newPath}`);
        } catch (fileError) {
          const errorMsg = `Failed to migrate ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`[GCS] ${errorMsg}`);
        }
      }

      return {
        success: errors.length === 0,
        migratedFiles,
        errors,
      };
    } catch (error) {
      console.error('[GCS] Migration failed:', error);
      return {
        success: false,
        migratedFiles,
        errors: [error instanceof Error ? error.message : 'Migration failed'],
      };
    }
  }

  /**
   * Clean up expired onboarding files
   * Called by a scheduled job to remove files from sessions that were abandoned
   */
  async cleanupExpiredOnboarding(
    product: ProductType,
    sessionIds: string[]
  ): Promise<{ deleted: number; errors: string[] }> {
    let deleted = 0;
    const errors: string[] = [];

    try {
      await this.ensureInitialized();

      for (const sessionId of sessionIds) {
        try {
          const prefix = `${product}/onboarding/${sessionId}/`;
          const [files] = await this.bucket.getFiles({ prefix });

          for (const file of files) {
            await file.delete();
            deleted++;
          }

          console.log(`[GCS] Cleaned up ${files.length} files for session: ${sessionId}`);
        } catch (sessionError) {
          const errorMsg = `Failed to cleanup session ${sessionId}: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`[GCS] ${errorMsg}`);
        }
      }

      return { deleted, errors };
    } catch (error) {
      console.error('[GCS] Cleanup failed:', error);
      return {
        deleted,
        errors: [error instanceof Error ? error.message : 'Cleanup failed'],
      };
    }
  }

  /**
   * Get bucket name for debugging/logging
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

// Export singleton instance
export const gcsClient = new GCSStorageClient();

export default gcsClient;
