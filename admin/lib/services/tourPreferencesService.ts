import settingsService from './settingsService';
import type { TourPreferences } from '../types/settings';

const APP_ID = 'admin';
const SCOPE = 'user';

class TourPreferencesService {
  private settingsId: string | null = null;
  private cachedPrefs: TourPreferences | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSave: { tenantId: string; userId: string; prefs: TourPreferences } | null = null;

  /**
   * Load tour preferences from the settings DB.
   * Returns null if no settings exist yet for this user.
   */
  async load(tenantId: string, userId: string): Promise<TourPreferences | null> {
    try {
      const settings = await settingsService.getSettingsByContext({
        applicationId: APP_ID,
        scope: SCOPE,
        userId,
        tenantId,
      });
      if (settings) {
        this.settingsId = settings.id;
        this.cachedPrefs = settings.userPreferences?.tours || null;
        return this.cachedPrefs;
      }
      return null;
    } catch (error) {
      console.error('[TourPreferencesService] Failed to load preferences:', error);
      return null;
    }
  }

  /**
   * Save tour preferences to the settings DB.
   * Merges the provided prefs with cached state to avoid overwriting
   * page tour data when saving wizard data and vice versa.
   */
  async save(tenantId: string, userId: string, prefs: TourPreferences): Promise<void> {
    try {
      // Merge with cached preferences to avoid overwriting other fields
      const merged: TourPreferences = {
        ...this.cachedPrefs,
        ...prefs,
        // Deep merge setupWizard if both exist
        setupWizard: prefs.setupWizard
          ? { ...this.cachedPrefs?.setupWizard, ...prefs.setupWizard }
          : this.cachedPrefs?.setupWizard,
      };
      this.cachedPrefs = merged;

      if (this.settingsId) {
        await settingsService.updateSettings(
          this.settingsId,
          { userPreferences: { tours: merged } as any },
          tenantId
        );
      } else {
        const settings = await settingsService.createSettings(
          {
            context: { applicationId: APP_ID, scope: SCOPE, userId, tenantId },
            userPreferences: { tours: merged } as any,
          },
          tenantId
        );
        this.settingsId = settings.id;
      }
    } catch (error) {
      console.error('[TourPreferencesService] Failed to save preferences:', error);
    }
  }

  /**
   * Debounced save - waits 2s before actually saving to avoid excessive API calls.
   * If called multiple times within the debounce window, only the last call executes.
   */
  saveDebounced(tenantId: string, userId: string, prefs: TourPreferences): void {
    this.pendingSave = { tenantId, userId, prefs };

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.pendingSave) {
        this.save(
          this.pendingSave.tenantId,
          this.pendingSave.userId,
          this.pendingSave.prefs
        );
        this.pendingSave = null;
      }
    }, 2000);
  }

  /**
   * Flush any pending debounced save immediately.
   */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.pendingSave) {
      await this.save(
        this.pendingSave.tenantId,
        this.pendingSave.userId,
        this.pendingSave.prefs
      );
      this.pendingSave = null;
    }
  }
}

export const tourPreferencesService = new TourPreferencesService();
