import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage abstraction that uses SecureStore on native
 * and sessionStorage on web for security (tokens cleared on tab close)
 *
 * SECURITY: On web, we use sessionStorage instead of localStorage/AsyncStorage
 * to ensure sensitive tokens are automatically cleared when the browser tab is closed.
 * This reduces the risk of token theft from XSS attacks.
 */
class SecureStorage {
  private isNative: boolean;
  private isWeb: boolean;

  constructor() {
    this.isNative = Platform.OS === 'ios' || Platform.OS === 'android';
    this.isWeb = Platform.OS === 'web';
  }

  /**
   * Store a value securely
   * SECURITY: Uses sessionStorage on web (cleared on tab close)
   */
  async setItem(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } else if (this.isWeb && typeof window !== 'undefined') {
      // SECURITY: Use sessionStorage on web - tokens cleared when tab is closed
      // This prevents token persistence that could be exploited via XSS
      sessionStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve a value
   */
  async getItem(key: string): Promise<string | null> {
    if (this.isNative) {
      return SecureStore.getItemAsync(key);
    } else if (this.isWeb && typeof window !== 'undefined') {
      return sessionStorage.getItem(key);
    }
    return null;
  }

  /**
   * Remove a value
   */
  async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await SecureStore.deleteItemAsync(key);
    } else if (this.isWeb && typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  }

  /**
   * Store a JSON object
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.setItem(key, jsonValue);
  }

  /**
   * Retrieve a JSON object
   */
  async getObject<T>(key: string): Promise<T | null> {
    const jsonValue = await this.getItem(key);
    if (jsonValue === null) {
      return null;
    }
    try {
      return JSON.parse(jsonValue) as T;
    } catch {
      return null;
    }
  }

  /**
   * Check if a key exists
   */
  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Clear multiple keys
   */
  async removeItems(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.removeItem(key)));
  }

  /**
   * Clear all auth-related data
   */
  async clearAuthData(): Promise<void> {
    const authKeys = [
      'tesseract_access_token',
      'tesseract_refresh_token',
      'tesseract_user',
      'tesseract_current_tenant',
      'tesseract_tenants',
    ];
    await this.removeItems(authKeys);
  }
}

export const secureStorage = new SecureStorage();
