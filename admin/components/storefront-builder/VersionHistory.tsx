'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  RotateCcw,
  Eye,
  X,
  Clock,
  ChevronRight,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storefrontSettingsApi } from '@/lib/api/storefront';
import { ThemeHistoryEntry, StorefrontSettings } from '@/lib/api/types';

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (settings: StorefrontSettings) => void;
  currentSettings?: StorefrontSettings | null;
}

export function VersionHistory({
  isOpen,
  onClose,
  onRestore,
  currentSettings,
}: VersionHistoryProps) {
  const [history, setHistory] = useState<ThemeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<ThemeHistoryEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await storefrontSettingsApi.getHistory(20);
      if (response.success) {
        setHistory(response.data || []);
      } else {
        setError(response.message || 'Failed to load history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  const handleRestore = async (version: number) => {
    setIsRestoring(true);
    setError(null);
    try {
      const response = await storefrontSettingsApi.restoreVersion(version);
      if (response.success && response.data) {
        onRestore(response.data);
        setConfirmRestore(null);
        onClose();
      } else {
        setError(response.message || 'Failed to restore version');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeSummary = (entry: ThemeHistoryEntry) => {
    if (entry.changeSummary) return entry.changeSummary;
    // Generate a default summary based on the snapshot
    const snapshot = entry.snapshot;
    if (!snapshot) return 'Settings updated';
    return `Theme: ${snapshot.themeTemplate || 'custom'}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-2xl z-50',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Version History</h2>
              <p className="text-xs text-muted-foreground">Last 20 versions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="p-3 bg-red-100 rounded-full mb-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-red-600 text-center">{error}</p>
              <button
                onClick={fetchHistory}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Try again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-muted-foreground">
              <div className="p-3 bg-muted rounded-full mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">No version history yet</p>
              <p className="text-xs text-center mt-1">
                Changes will be tracked automatically when you save settings
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    'px-6 py-4 hover:bg-muted transition-colors',
                    confirmRestore === entry.version && 'bg-warning-muted'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Version {entry.version}
                        </span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-success-muted text-success-foreground rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(entry.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {getChangeSummary(entry)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Preview button */}
                      <button
                        onClick={() => setPreviewVersion(entry)}
                        className="p-2 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Preview this version"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Restore button - only show for non-current versions */}
                      {index !== 0 && (
                        <>
                          {confirmRestore === entry.version ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleRestore(entry.version)}
                                disabled={isRestoring}
                                className={cn(
                                  'p-2 text-success hover:bg-success-muted rounded-lg transition-colors',
                                  isRestoring && 'opacity-50 cursor-not-allowed'
                                )}
                                title="Confirm restore"
                              >
                                {isRestoring ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmRestore(null)}
                                disabled={isRestoring}
                                className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRestore(entry.version)}
                              className="p-2 text-muted-foreground hover:text-warning hover:bg-warning-muted rounded-lg transition-colors"
                              title="Restore this version"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Confirm restore message */}
                  {confirmRestore === entry.version && (
                    <div className="mt-3 p-3 bg-warning-muted rounded-lg border border-warning/30">
                      <p className="text-xs text-amber-800">
                        <strong>Restore this version?</strong> This will replace your current
                        settings. A backup of your current settings will be saved to history.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewVersion && (
        <VersionPreviewModal
          entry={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRestore={() => {
            setPreviewVersion(null);
            setConfirmRestore(previewVersion.version);
          }}
          isCurrentVersion={history[0]?.version === previewVersion.version}
        />
      )}
    </>
  );
}

interface VersionPreviewModalProps {
  entry: ThemeHistoryEntry;
  onClose: () => void;
  onRestore: () => void;
  isCurrentVersion: boolean;
}

function VersionPreviewModal({
  entry,
  onClose,
  onRestore,
  isCurrentVersion,
}: VersionPreviewModalProps) {
  const snapshot = entry.snapshot;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />
      <div className="fixed inset-4 md:inset-10 bg-card rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Version {entry.version} Preview
            </h3>
            <p className="text-xs text-muted-foreground">
              Created {new Date(entry.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isCurrentVersion && (
              <button
                onClick={onRestore}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restore this version
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {snapshot ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Theme & Branding */}
              <PreviewSection title="Theme & Branding">
                <PreviewItem label="Theme Template" value={snapshot.themeTemplate} />
                <PreviewItem
                  label="Primary Color"
                  value={snapshot.primaryColor}
                  isColor
                />
                <PreviewItem
                  label="Secondary Color"
                  value={snapshot.secondaryColor}
                  isColor
                />
                <PreviewItem label="Primary Font" value={snapshot.fontPrimary} />
                <PreviewItem label="Secondary Font" value={snapshot.fontSecondary} />
              </PreviewSection>

              {/* Header Configuration */}
              <PreviewSection title="Header">
                <PreviewItem
                  label="Sticky Header"
                  value={snapshot.headerConfig?.stickyHeader ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Show Search"
                  value={snapshot.headerConfig?.showSearch ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Show Cart"
                  value={snapshot.headerConfig?.showCart ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Announcement"
                  value={snapshot.headerConfig?.showAnnouncement ? 'Enabled' : 'Disabled'}
                />
              </PreviewSection>

              {/* Homepage Configuration */}
              <PreviewSection title="Homepage">
                <PreviewItem
                  label="Hero Enabled"
                  value={snapshot.homepageConfig?.heroEnabled ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Hero Title"
                  value={snapshot.homepageConfig?.heroTitle || 'Not set'}
                />
                <PreviewItem
                  label="Newsletter"
                  value={snapshot.homepageConfig?.showNewsletter ? 'Enabled' : 'Disabled'}
                />
              </PreviewSection>

              {/* Product Configuration */}
              <PreviewSection title="Products">
                <PreviewItem
                  label="Grid Columns"
                  value={String(snapshot.productConfig?.gridColumns || 4)}
                />
                <PreviewItem
                  label="Card Style"
                  value={snapshot.productConfig?.cardStyle || 'default'}
                />
                <PreviewItem
                  label="Show Ratings"
                  value={snapshot.productConfig?.showRatings ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Hover Effect"
                  value={snapshot.productConfig?.hoverEffect || 'none'}
                />
              </PreviewSection>

              {/* Checkout Configuration */}
              <PreviewSection title="Checkout">
                <PreviewItem
                  label="Guest Checkout"
                  value={snapshot.checkoutConfig?.guestCheckoutEnabled ? 'Enabled' : 'Disabled'}
                />
                <PreviewItem
                  label="Require Phone"
                  value={snapshot.checkoutConfig?.requirePhone ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Trust Badges"
                  value={snapshot.checkoutConfig?.showTrustBadges ? 'Shown' : 'Hidden'}
                />
              </PreviewSection>

              {/* Footer Configuration */}
              <PreviewSection title="Footer">
                <PreviewItem
                  label="Show Footer"
                  value={snapshot.footerConfig?.showFooter ? 'Yes' : 'No'}
                />
                <PreviewItem
                  label="Social Icons"
                  value={snapshot.footerConfig?.showSocialIcons ? 'Shown' : 'Hidden'}
                />
                <PreviewItem
                  label="Powered By"
                  value={snapshot.footerConfig?.showPoweredBy ? 'Shown' : 'Hidden'}
                />
              </PreviewSection>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No preview data available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted rounded-xl p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PreviewItem({
  label,
  value,
  isColor = false,
}: {
  label: string;
  value: string;
  isColor?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {isColor ? (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: value }}
          />
          <span className="text-xs font-mono text-foreground">{value}</span>
        </div>
      ) : (
        <span className="text-xs font-medium text-foreground capitalize">{value}</span>
      )}
    </div>
  );
}

export default VersionHistory;
