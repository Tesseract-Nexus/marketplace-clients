/**
 * Translation API for Storefront
 * Handles language preferences and translation requests
 */

const API_BASE = '';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  region: string;
}

export interface UserLanguagePreference {
  id?: string;
  preferredLanguage: string;
  sourceLanguage: string;
  autoDetectSource: boolean;
  rtlEnabled: boolean;
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
}

/**
 * Get list of supported languages from the translation service
 */
export async function getLanguages(
  tenantId: string,
  storefrontId: string
): Promise<Language[]> {
  try {
    const response = await fetch(`${API_BASE}/api/translations/languages`, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch languages:', response.status);
      return [];
    }

    const data = await response.json();

    // Map backend format to frontend format
    const languages = (data.languages || []).map((lang: {
      code: string;
      name: string;
      native_name: string;
      rtl: boolean;
      is_active: boolean;
      region: string;
    }) => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.native_name,
      rtl: lang.rtl,
      region: lang.region,
    }));

    return languages;
  } catch (error) {
    console.error('Error fetching languages:', error);
    return [];
  }
}

/**
 * Get user's language preference
 */
export async function getUserLanguagePreference(
  tenantId: string,
  storefrontId: string
): Promise<UserLanguagePreference> {
  const response = await fetch(`${API_BASE}/api/translations/user-preference`, {
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    // Return default if not found
    return {
      preferredLanguage: 'en',
      sourceLanguage: 'en',
      autoDetectSource: true,
      rtlEnabled: false,
    };
  }

  const data = await response.json();
  return {
    id: data.data?.id,
    preferredLanguage: data.data?.preferred_language || 'en',
    sourceLanguage: data.data?.source_language || 'en',
    autoDetectSource: data.data?.auto_detect_source !== false,
    rtlEnabled: data.data?.rtl_enabled || false,
  };
}

/**
 * Update user's language preference
 */
export async function updateUserLanguagePreference(
  tenantId: string,
  storefrontId: string,
  preference: Partial<UserLanguagePreference>
): Promise<UserLanguagePreference> {
  const response = await fetch(`${API_BASE}/api/translations/user-preference`, {
    method: 'PUT',
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      preferred_language: preference.preferredLanguage,
      source_language: preference.sourceLanguage,
      auto_detect_source: preference.autoDetectSource,
      rtl_enabled: preference.rtlEnabled,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update language preference');
  }

  const data = await response.json();
  return {
    id: data.data?.id,
    preferredLanguage: data.data?.preferred_language || 'en',
    sourceLanguage: data.data?.source_language || 'en',
    autoDetectSource: data.data?.auto_detect_source !== false,
    rtlEnabled: data.data?.rtl_enabled || false,
  };
}

/**
 * Reset user's language preference to default
 */
export async function resetUserLanguagePreference(
  tenantId: string,
  storefrontId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/translations/user-preference`, {
    method: 'DELETE',
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to reset language preference');
  }
}

/**
 * Translate text
 */
export async function translateText(
  tenantId: string,
  storefrontId: string,
  request: TranslateRequest
): Promise<TranslateResponse> {
  const response = await fetch(`${API_BASE}/api/translations/translate`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: request.text,
      source_lang: request.sourceLang,
      target_lang: request.targetLang,
      context: request.context,
    }),
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();
  return {
    originalText: data.original_text,
    translatedText: data.translated_text,
    sourceLang: data.source_lang,
    targetLang: data.target_lang,
    cached: data.cached,
  };
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  tenantId: string,
  storefrontId: string,
  items: Array<{ id?: string; text: string; context?: string }>,
  targetLang: string,
  sourceLang?: string
): Promise<Array<{ id: string; translatedText: string; cached: boolean }>> {
  const response = await fetch(`${API_BASE}/api/translations/translate/batch`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        id: item.id,
        text: item.text,
        context: item.context,
      })),
      source_lang: sourceLang,
      target_lang: targetLang,
    }),
  });

  if (!response.ok) {
    throw new Error('Batch translation failed');
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    id: item.id,
    translatedText: item.translated_text,
    cached: item.cached,
  }));
}
