import { connect, NatsConnection, JetStreamClient, JetStreamManager, ConsumerConfig, AckPolicy, DeliverPolicy } from 'nats';
import { gcsClient } from '../storage/gcs-client';

// Event types - must match Go constants
export const TENANT_CREATED = 'tenant.created';
export const SESSION_COMPLETED = 'tenant.session_completed';

// Tenant service URL for database validation
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://tenant-service.marketplace.svc.cluster.local:8080';

// Track processed sessions to avoid duplicate processing (in-memory cache)
// In production, this could be backed by Redis for multi-instance deployments
const processedSessions = new Set<string>();
const MAX_PROCESSED_CACHE_SIZE = 10000; // Limit memory usage

// Session status constants
const SESSION_STATUS_COMPLETED = 'completed';
const SESSION_STATUS_IN_PROGRESS = 'in_progress';

// Interface for session data from tenant-service
interface OnboardingSessionResponse {
  data: {
    id: string;
    tenant_id: string | null;
    status: string;
    application_type: string;
    expires_at: string;
    completed_at: string | null;
    business_information?: {
      business_name: string;
    };
  };
}

// TenantCreatedEvent matches the Go struct
export interface TenantCreatedEvent {
  event_type: string;
  tenant_id: string;
  session_id: string;
  product: string;
  business_name: string;
  slug: string;
  email: string;
  timestamp: string;
}

// SessionCompletedEvent matches the Go struct
export interface SessionCompletedEvent {
  event_type: string;
  session_id: string;
  product: string;
  business_name: string;
  email: string;
  timestamp: string;
}

class NatsClient {
  private connection: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private jsm: JetStreamManager | null = null;
  private isConnected: boolean = false;
  private consumerRunning: boolean = false;

  /**
   * Connect to NATS server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[NATS] Already connected');
      return;
    }

    const natsUrl = process.env.NATS_URL || 'nats://nats.nats.svc.cluster.local:4222';

    try {
      console.log(`[NATS] Connecting to ${natsUrl}`);

      this.connection = await connect({
        servers: natsUrl,
        name: 'tenant-onboarding',
        reconnect: true,
        maxReconnectAttempts: -1, // Unlimited reconnect attempts
        reconnectTimeWait: 2000,
        timeout: 10000, // 10 second connection timeout
        pingInterval: 30000,
      });

      // Create JetStream context
      this.js = this.connection.jetstream();
      this.jsm = await this.connection.jetstreamManager();

      this.isConnected = true;
      console.log('[NATS] Connected successfully');

      // Handle connection events
      (async () => {
        if (this.connection) {
          for await (const status of this.connection.status()) {
            console.log(`[NATS] Status: ${status.type}`, status.data);
          }
        }
      })().catch(console.error);

    } catch (error) {
      console.error('[NATS] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Start consuming tenant events (session_completed and tenant.created)
   */
  async startConsumer(): Promise<void> {
    if (!this.isConnected || !this.js) {
      console.log('[NATS] Not connected, cannot start consumer');
      return;
    }

    if (this.consumerRunning) {
      console.log('[NATS] Consumer already running');
      return;
    }

    try {
      // Delete old consumer if it exists (cleanup from previous version)
      try {
        await this.jsm?.consumers.delete('TENANT_EVENTS', 'tenant-onboarding-doc-migration');
        console.log('[NATS] Deleted old consumer tenant-onboarding-doc-migration');
      } catch {
        // Consumer doesn't exist, that's fine
      }

      // Create durable consumer for tenant-onboarding that listens to all tenant.* events
      // WorkQueue streams require DeliverAll policy
      const consumerConfig: Partial<ConsumerConfig> = {
        durable_name: 'tenant-onboarding-doc-migration-v4', // New version to reset consumer state
        ack_policy: AckPolicy.Explicit,
        deliver_policy: DeliverPolicy.All, // Required for WorkQueue streams
        filter_subject: 'tenant.>', // Listen to all tenant.* events
      };

      // Delete old consumers if they exist (cleanup from previous versions)
      for (const oldConsumer of ['tenant-onboarding-doc-migration', 'tenant-onboarding-doc-migration-v2', 'tenant-onboarding-doc-migration-v3']) {
        try {
          await this.jsm?.consumers.delete('TENANT_EVENTS', oldConsumer);
          console.log(`[NATS] Deleted old consumer ${oldConsumer}`);
        } catch {
          // Consumer doesn't exist, that's fine
        }
      }

      // Get or create consumer
      const consumer = await this.js.consumers.get('TENANT_EVENTS', 'tenant-onboarding-doc-migration-v4').catch(async () => {
        // Consumer doesn't exist, create it
        if (this.jsm) {
          await this.jsm.consumers.add('TENANT_EVENTS', consumerConfig);
          console.log('[NATS] Created new consumer tenant-onboarding-doc-migration-v4');
        }
        return this.js!.consumers.get('TENANT_EVENTS', 'tenant-onboarding-doc-migration-v4');
      });

      this.consumerRunning = true;
      console.log('[NATS] Started consuming tenant events (session_completed, tenant.created)');

      // Process messages
      const messages = await consumer.consume();
      for await (const msg of messages) {
        try {
          const eventData = JSON.parse(new TextDecoder().decode(msg.data));
          const eventType = eventData.event_type;

          console.log(`[NATS] Received event: ${eventType}`);

          if (eventType === SESSION_COMPLETED) {
            await this.handleSessionCompleted(eventData as SessionCompletedEvent);
          } else if (eventType === TENANT_CREATED) {
            await this.handleTenantCreated(eventData as TenantCreatedEvent);
          } else {
            console.log(`[NATS] Ignoring event type: ${eventType}`);
          }

          // Acknowledge the message
          msg.ack();
          console.log(`[NATS] Acknowledged ${eventType} event`);
        } catch (error) {
          console.error('[NATS] Error processing message:', error);
          // NAK the message for retry
          msg.nak();
        }
      }
    } catch (error) {
      console.error('[NATS] Consumer error:', error);
      this.consumerRunning = false;
    }
  }

  /**
   * Handle session.completed event - migrate documents from onboarding to tenant storage
   *
   * Production-ready implementation with:
   * - Database validation (verify session exists and is completed)
   * - Event age validation (skip stale events)
   * - Duplicate processing prevention
   * - Proper validation before migration
   */
  private async handleSessionCompleted(event: SessionCompletedEvent): Promise<void> {
    const sessionId = event.session_id;

    // === VALIDATION PHASE ===

    // 1. Validate session ID format (must be valid UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      console.log(`[NATS] Skipping invalid session ID: ${sessionId}`);
      return;
    }

    // 2. Check if already processed (prevent duplicates)
    const cacheKey = `session_completed:${sessionId}`;
    if (processedSessions.has(cacheKey)) {
      console.log(`[NATS] Skipping already processed session: ${sessionId}`);
      return;
    }

    // 3. Validate event timestamp
    // Session TTL is 9 days, so events should be valid for up to 9 days
    // The event timestamp is set when the event is PUBLISHED (at verification time)
    // Adding 1 day buffer for processing delays = 10 days max age
    const eventTime = new Date(event.timestamp).getTime();
    const now = Date.now();
    const maxAgeMs = 10 * 24 * 60 * 60 * 1000; // 10 days (9 day TTL + 1 day buffer)
    const eventAgeHours = Math.round((now - eventTime) / 1000 / 60 / 60);

    if (isNaN(eventTime) || now - eventTime > maxAgeMs) {
      console.log(`[NATS] Skipping expired session_completed event for ${sessionId} (age: ${eventAgeHours} hours, max: 240 hours)`);
      this.markAsProcessed(cacheKey);
      return;
    }

    console.log(`[NATS] Processing session.completed for session ${sessionId} (event age: ${eventAgeHours} hours)`);

    // 4. DATABASE VALIDATION - Verify session exists and is in correct status
    const sessionData = await this.getSessionFromDB(sessionId);

    if (!sessionData) {
      console.log(`[NATS] Session ${sessionId} not found in database - skipping migration`);
      this.markAsProcessed(cacheKey);
      return;
    }

    // Check session status - must be 'completed' or 'in_progress' (verification in progress)
    if (sessionData.status !== SESSION_STATUS_COMPLETED && sessionData.status !== SESSION_STATUS_IN_PROGRESS) {
      console.log(`[NATS] Session ${sessionId} has status '${sessionData.status}' - skipping migration (expected: completed or in_progress)`);
      this.markAsProcessed(cacheKey);
      return;
    }

    // Get tenant_id from database if available (might be null if not yet created)
    const tenantId = sessionData.tenant_id || sessionId;
    const businessName = sessionData.business_information?.business_name || event.business_name || 'Unknown';

    console.log(`[NATS] DB Validation passed for session ${sessionId}:`);
    console.log(`[NATS]   - Status: ${sessionData.status}`);
    console.log(`[NATS]   - Tenant ID: ${sessionData.tenant_id || 'not yet assigned'}`);
    console.log(`[NATS]   - Business: ${businessName}`);
    console.log(`[NATS]   - Application Type: ${sessionData.application_type}`);

    // === MIGRATION PHASE ===

    try {
      // Use application_type from DB as source of truth, fallback to event
      const destinationProduct = this.getDestinationProduct(sessionData.application_type || event.product);

      // Check if source files exist before attempting migration
      const sourcePrefix = `onboarding/onboarding/${sessionId}/`;
      const sourceFiles = await gcsClient.listFiles({
        product: 'onboarding',
        prefix: sourcePrefix
      });

      if (sourceFiles.length === 0) {
        // No files to migrate - this is normal if user didn't upload documents
        console.log(`[NATS] No documents found for session ${sessionId} - user did not upload any documents`);
        this.markAsProcessed(cacheKey);
        return;
      }

      console.log(`[NATS] Found ${sourceFiles.length} files to migrate for session ${sessionId}`);

      // Wait briefly to ensure any in-flight uploads complete
      await this.delay(2000);

      // Perform migration - use tenant_id from DB if available, otherwise session_id
      const result = await gcsClient.migrateOnboardingToTenant(
        sessionId,
        tenantId, // Use tenant_id from database if available
        destinationProduct
      );

      if (result.success && result.migratedFiles.length > 0) {
        console.log(`[NATS] Successfully migrated ${result.migratedFiles.length} files for session ${sessionId} to tenant ${tenantId}`);
        result.migratedFiles.forEach(file => console.log(`[NATS]   - ${file}`));
      } else if (result.success && result.migratedFiles.length === 0) {
        console.log(`[NATS] Migration completed but no files were migrated for session ${sessionId}`);
      } else {
        console.error(`[NATS] Migration failed for session ${sessionId}:`, result.errors);
      }

      // Mark as processed regardless of outcome to prevent retry loops
      this.markAsProcessed(cacheKey);

    } catch (error) {
      console.error(`[NATS] Error migrating documents for session ${sessionId}:`, error);
      // Don't mark as processed on error - allow retry via NATS NAK
      throw error;
    }
  }

  /**
   * Get destination product folder based on application type
   */
  private getDestinationProduct(product: string): 'fanzone' | 'marketplace' | 'poker' | 'onboarding' {
    switch (product) {
      case 'fanzone': return 'fanzone';
      case 'poker': return 'poker';
      default: return 'marketplace';
    }
  }

  /**
   * Mark a session/event as processed to prevent duplicates
   */
  private markAsProcessed(cacheKey: string): void {
    // Prevent memory leak by limiting cache size
    if (processedSessions.size >= MAX_PROCESSED_CACHE_SIZE) {
      // Remove oldest entries (first 1000)
      const entries = Array.from(processedSessions);
      entries.slice(0, 1000).forEach(key => processedSessions.delete(key));
      console.log(`[NATS] Cleared old entries from processed sessions cache`);
    }
    processedSessions.add(cacheKey);
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch session data from tenant-service database
   * This validates that the session exists and gets its current status
   */
  private async getSessionFromDB(sessionId: string): Promise<OnboardingSessionResponse['data'] | null> {
    try {
      const response = await fetch(`${TENANT_SERVICE_URL}/api/v1/onboarding/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `nats-${Date.now()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[NATS] Session ${sessionId} not found in database`);
          return null;
        }
        console.error(`[NATS] Failed to fetch session ${sessionId}: ${response.status}`);
        return null;
      }

      const data: OnboardingSessionResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error(`[NATS] Error fetching session ${sessionId} from database:`, error);
      return null;
    }
  }

  /**
   * Handle tenant.created event - rename session folder to tenant folder if needed
   *
   * This is a secondary operation - the main migration happens in handleSessionCompleted.
   * This handles the case where tenant_id differs from session_id.
   */
  private async handleTenantCreated(event: TenantCreatedEvent): Promise<void> {
    const { session_id: sessionId, tenant_id: tenantId } = event;

    // === VALIDATION PHASE ===

    // 1. Validate IDs format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !tenantId || !uuidRegex.test(sessionId) || !uuidRegex.test(tenantId)) {
      console.log(`[NATS] Skipping tenant.created with invalid IDs: session=${sessionId}, tenant=${tenantId}`);
      return;
    }

    // 2. Check if already processed
    const cacheKey = `tenant_created:${tenantId}`;
    if (processedSessions.has(cacheKey)) {
      console.log(`[NATS] Skipping already processed tenant.created: ${tenantId}`);
      return;
    }

    // 3. Validate event timestamp (align with 9-day session TTL + 1 day buffer)
    const eventTime = new Date(event.timestamp).getTime();
    const now = Date.now();
    const maxAgeMs = 10 * 24 * 60 * 60 * 1000; // 10 days
    const eventAgeHours = Math.round((now - eventTime) / 1000 / 60 / 60);

    if (isNaN(eventTime) || now - eventTime > maxAgeMs) {
      console.log(`[NATS] Skipping expired tenant.created event for ${tenantId} (age: ${eventAgeHours} hours)`);
      this.markAsProcessed(cacheKey);
      return;
    }

    console.log(`[NATS] Processing tenant.created: session ${sessionId} -> tenant ${tenantId} (event age: ${eventAgeHours} hours)`);

    // 4. DATABASE VALIDATION - Verify session exists and tenant_id matches
    const sessionData = await this.getSessionFromDB(sessionId);

    if (!sessionData) {
      console.log(`[NATS] Session ${sessionId} not found in database - skipping tenant.created processing`);
      this.markAsProcessed(cacheKey);
      return;
    }

    // Verify the tenant_id from event matches the database
    if (sessionData.tenant_id && sessionData.tenant_id !== tenantId) {
      console.log(`[NATS] Tenant ID mismatch: event=${tenantId}, database=${sessionData.tenant_id} - using database value`);
    }

    // Use the tenant_id from database as source of truth
    const actualTenantId = sessionData.tenant_id || tenantId;

    console.log(`[NATS] DB Validation passed for tenant.created:`);
    console.log(`[NATS]   - Session: ${sessionId}`);
    console.log(`[NATS]   - Tenant ID (DB): ${sessionData.tenant_id || 'not assigned'}`);
    console.log(`[NATS]   - Status: ${sessionData.status}`);

    // If session_id matches actual tenant_id, no rename needed (session.completed already handled migration)
    if (sessionId === actualTenantId) {
      console.log(`[NATS] Session ID matches Tenant ID - migration already complete`);
      this.markAsProcessed(cacheKey);
      return;
    }

    // === RENAME PHASE (only if IDs differ) ===

    try {
      const destinationProduct = this.getDestinationProduct(sessionData.application_type || event.product);

      // Check if there are files in the session folder that need renaming
      const sessionPrefix = `${destinationProduct}/tenants/${sessionId}/`;
      const sessionFiles = await gcsClient.listFiles({
        product: destinationProduct,
        prefix: sessionPrefix
      });

      if (sessionFiles.length === 0) {
        console.log(`[NATS] No files found in session folder ${sessionId} - nothing to rename`);
        this.markAsProcessed(cacheKey);
        return;
      }

      console.log(`[NATS] Renaming ${sessionFiles.length} files from session ${sessionId} to tenant ${actualTenantId}`);

      // Copy files from session folder to tenant folder
      const result = await gcsClient.migrateOnboardingToTenant(
        sessionId,
        actualTenantId,
        destinationProduct
      );

      if (result.success && result.migratedFiles.length > 0) {
        console.log(`[NATS] Successfully renamed ${result.migratedFiles.length} files for tenant ${actualTenantId}`);
      }

      this.markAsProcessed(cacheKey);

    } catch (error) {
      console.error(`[NATS] Error processing tenant.created for ${tenantId}:`, error);
      // Don't throw - this is a secondary operation, don't NAK the message
      this.markAsProcessed(cacheKey);
    }
  }

  /**
   * Close the NATS connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.js = null;
      this.jsm = null;
      this.isConnected = false;
      this.consumerRunning = false;
      console.log('[NATS] Connection closed');
    }
  }

  /**
   * Check if connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const natsClient = new NatsClient();
