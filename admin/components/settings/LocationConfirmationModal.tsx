'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Check,
  X,
  Loader2,
  Edit3,
  Globe,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface DetectedLocationData {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  zipCode?: string;
  timezone?: string;
  currency?: string;
}

interface LocationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: DetectedLocationData) => void;
  onSkip: () => void;
  detectedLocation: DetectedLocationData | null;
  isDetecting: boolean;
  error?: string;
}

export function LocationConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  detectedLocation,
  isDetecting,
  error,
}: LocationConfirmationModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocation, setEditedLocation] = useState<DetectedLocationData>({});

  // Reset editing state when modal opens with new data
  useEffect(() => {
    if (detectedLocation) {
      setEditedLocation(detectedLocation);
      setIsEditing(false);
    }
  }, [detectedLocation]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(isEditing ? editedLocation : (detectedLocation || {}));
  };

  const locationDisplay = detectedLocation
    ? [detectedLocation.city, detectedLocation.state, detectedLocation.country]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isDetecting ? 'Detecting Location' : 'Confirm Your Location'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isDetecting
                      ? 'Please wait...'
                      : 'We detected your business location'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {isDetecting ? (
              <div className="flex flex-col items-center py-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 animate-ping">
                    <div className="w-16 h-16 bg-primary/20 rounded-full" />
                  </div>
                </div>
                <p className="mt-4 text-gray-300 text-center">
                  Detecting your location...
                </p>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  This helps set up your timezone and currency automatically
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-red-400 font-medium mb-2">Location Detection Failed</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : detectedLocation ? (
              <div className="space-y-4">
                {!isEditing ? (
                  <>
                    {/* Location Display */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-1">Detected Address</p>
                          {detectedLocation.address && (
                            <p className="text-white font-medium truncate">
                              {detectedLocation.address}
                            </p>
                          )}
                          <p className="text-gray-300">{locationDisplay}</p>
                          {detectedLocation.zipCode && (
                            <p className="text-muted-foreground text-sm">
                              {detectedLocation.zipCode}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Auto-detected settings */}
                    <div className="grid grid-cols-2 gap-3">
                      {detectedLocation.timezone && (
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-muted-foreground mb-1">Timezone</p>
                          <p className="text-sm text-white font-medium truncate">
                            {detectedLocation.timezone.split('/').pop()?.replace('_', ' ')}
                          </p>
                        </div>
                      )}
                      {detectedLocation.currency && (
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-xs text-muted-foreground mb-1">Currency</p>
                          <p className="text-sm text-white font-medium">
                            {detectedLocation.currency}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit location details
                    </button>
                  </>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                        Street Address
                      </label>
                      <Input
                        value={editedLocation.address || ''}
                        onChange={(e) =>
                          setEditedLocation({ ...editedLocation, address: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                          City
                        </label>
                        <Input
                          value={editedLocation.city || ''}
                          onChange={(e) =>
                            setEditedLocation({ ...editedLocation, city: e.target.value })
                          }
                          className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                          placeholder="Melbourne"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                          State
                        </label>
                        <Input
                          value={editedLocation.state || ''}
                          onChange={(e) =>
                            setEditedLocation({ ...editedLocation, state: e.target.value })
                          }
                          className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                          placeholder="VIC"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                          Country
                        </label>
                        <Input
                          value={editedLocation.country || ''}
                          onChange={(e) =>
                            setEditedLocation({ ...editedLocation, country: e.target.value })
                          }
                          className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                          placeholder="Australia"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                          Postal Code
                        </label>
                        <Input
                          value={editedLocation.zipCode || ''}
                          onChange={(e) =>
                            setEditedLocation({ ...editedLocation, zipCode: e.target.value })
                          }
                          className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                          placeholder="3000"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-sm text-muted-foreground hover:text-gray-300 transition-colors"
                    >
                      Cancel editing
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-black/20 border-t border-gray-700/50">
            {isDetecting ? (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Enter Manually
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Location
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
