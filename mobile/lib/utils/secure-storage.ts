import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage abstraction that uses SecureStore on native
 * and AsyncStorage on web (with a warning)
 */
class SecureStorage {
  private isNative: boolean;

  constructor() {
    this.isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Store a value securely
   */
  async setItem(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } else {
      // Web fallback - not as secure
      if (__DEV__) {
        console.warn('SecureStorage: Using AsyncStorage on web. Data is not encrypted.');
      }
      await AsyncStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve a value
   */
  async getItem(key: string): Promise<string | null> {
    if (this.isNative) {
      return SecureStore.getItemAsync(key);
    } else {
      return AsyncStorage.getItem(key);
    }
  }

  /**
   * Remove a value
   */
  async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
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
