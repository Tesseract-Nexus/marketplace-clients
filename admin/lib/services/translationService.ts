/**
 * Translation Service
 * Connects to the translation-service backend for language and translation management
 */

const TRANSLATION_SERVICE_URL = process.env.NEXT_PUBLIC_TRANSLATION_SERVICE_URL || '/api/translations';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  isActive: boolean;
  region: string;
}

export interface TenantTranslationPreferences {
  tenantId: string;
  defaultSourceLang: string;
  defaultTargetLang: string;
  enabledLanguages: string[];
  autoDetect: boolean;
}

export interface TranslationStats {
  tenantId: string;
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  totalCharacters: number;
  lastRequestAt: string;
}

export interface TranslateRequest {
  text: string;
  sourceLang?: string;
  targetLang: string;
  context?: string;
}

export interface TranslateResponse {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  cached: boolean;
  provider: string;
}

export interface BatchTranslateRequest {
  items: Array<{
    id?: string;
    text: string;
    sourceLang?: string;
    context?: string;
  }>;
  sourceLang?: string;
  targetLang: string;
}

export interface BatchTranslateResponse {
  items: Array<{
    id: string;
    originalText: string;
    translatedText: string;
    sourceLang: string;
    cached: boolean;
    error?: string;
  }>;
  totalCount: number;
  cachedCount: number;
  targetLang: string;
}

class TranslationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = TRANSLATION_SERVICE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    tenantId?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (tenantId) {
      headers['x-jwt-claim-tenant-id'] = tenantId;
    }

    // Use query parameter for endpoint routing
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.baseUrl}?endpoint=${cleanEndpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get list of supported languages
   */
  async getLanguages(): Promise<{ languages: Language[]; count: number }> {
    const data = await this.request<{
      languages: Array<{
        code: string;
        name: string;
        native_name: string;
        rtl: boolean;
        is_active: boolean;
        region: string;
      }>;
      count: number;
    }>('/languages');

    // Map backend format to frontend format
    const languages = (data.languages || []).map((lang) => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.native_name,
      rtl: lang.rtl,
      isActive: lang.is_active,
      region: lang.region,
    }));

    return { languages, count: data.count || languages.length };
  }

  /**
   * Get tenant translation preferences
   */
  async getPreferences(tenantId: string): Promise<TenantTranslationPreferences> {
    return this.request('/preferences', {}, tenantId);
  }

  /**
   * Update tenant translation preferences
   */
  async updatePreferences(
    tenantId: string,
    preferences: Partial<TenantTranslationPreferences>
  ): Promise<{ message: string }> {
    return this.request(
      '/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(preferences),
      },
      tenantId
    );
  }

  /**
   * Get translation statistics for a tenant
   */
  async getStats(tenantId: string): Promise<TranslationStats> {
    return this.request('/stats', {}, tenantId);
  }

  /**
   * Translate a single text
   */
  async translate(
    request: TranslateRequest,
    tenantId?: string
  ): Promise<TranslateResponse> {
    return this.request(
      '/translate',
      {
        method: 'POST',
        body: JSON.stringify({
          text: request.text,
          source_lang: request.sourceLang,
          target_lang: request.targetLang,
          context: request.context,
        }),
      },
      tenantId
    );
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(
    request: BatchTranslateRequest,
    tenantId?: string
  ): Promise<BatchTranslateResponse> {
    return this.request(
      '/translate/batch',
      {
        method: 'POST',
        body: JSON.stringify({
          items: request.items.map((item) => ({
            id: item.id,
            text: item.text,
            source_lang: item.sourceLang,
            context: item.context,
          })),
          source_lang: request.sourceLang,
          target_lang: request.targetLang,
        }),
      },
      tenantId
    );
  }

  /**
   * Detect language of text
   */
  async detectLanguage(
    text: string,
    tenantId?: string
  ): Promise<{ language: string; confidence: number }> {
    return this.request(
      '/detect',
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      },
      tenantId
    );
  }

  /**
   * Invalidate translation cache for a tenant
   */
  async invalidateCache(tenantId: string): Promise<{ message: string }> {
    return this.request(
      '/cache',
      {
        method: 'DELETE',
      },
      tenantId
    );
  }
}

export const translationService = new TranslationService();
