'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Check,
  Loader2,
  Edit3,
  Globe,
  Building2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DetectedLocation } from '@/hooks/useLocationDetection';

interface LocationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: DetectedLocation) => void;
  onSkip: () => void;
  detectedLocation: DetectedLocation | null;
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
  const [editedLocation, setEditedLocation] = useState<Partial<DetectedLocation>>({});

  // Reset editing state when modal opens with new data
  useEffect(() => {
    if (detectedLocation) {
      setEditedLocation(detectedLocation);
      setIsEditing(false);
    }
  }, [detectedLocation]);

  const handleConfirm = () => {
    if (detectedLocation) {
      const locationToConfirm = isEditing
        ? { ...detectedLocation, ...editedLocation }
        : detectedLocation;
      onConfirm(locationToConfirm as DetectedLocation);
    }
  };

  const locationDisplay = detectedLocation
    ? [detectedLocation.city, detectedLocation.stateName, detectedLocation.countryName]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isDetecting}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-tenant-primary to-tenant-primary/70 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>
                {isDetecting ? 'Detecting Location' : 'Confirm Your Location'}
              </DialogTitle>
              <DialogDescription>
                {isDetecting
                  ? 'Please wait while we detect your location...'
                  : 'We detected your location to help with shipping'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {isDetecting ? (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <div className="w-16 h-16 bg-tenant-primary/10 rounded-full flex items-center justify-center">
                  <Navigation className="w-8 h-8 text-tenant-primary animate-pulse" />
                </div>
                <div className="absolute inset-0 animate-ping">
                  <div className="w-16 h-16 bg-tenant-primary/20 rounded-full" />
                </div>
              </div>
              <p className="mt-4 text-foreground text-center font-medium">
                Detecting your location...
              </p>
              <p className="mt-2 text-sm text-muted-foreground text-center">
                This helps us provide accurate shipping options and taxes
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-red-600 font-medium mb-2">Location Detection Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : detectedLocation ? (
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  {/* Location Display */}
                  <div className="bg-muted/50 rounded-xl p-4 border">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-1">Detected Location</p>
                        <p className="text-foreground font-medium flex items-center gap-2">
                          <span className="text-lg">{detectedLocation.flagEmoji}</span>
                          {locationDisplay}
                        </p>
                        {detectedLocation.postalCode && (
                          <p className="text-muted-foreground text-sm mt-1">
                            Postal Code: {detectedLocation.postalCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auto-detected settings */}
                  <div className="grid grid-cols-2 gap-3">
                    {detectedLocation.timezone && (
                      <div className="bg-muted/30 rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Timezone</p>
                        <p className="text-sm font-medium truncate">
                          {detectedLocation.timezone.split('/').pop()?.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    {detectedLocation.currency && (
                      <div className="bg-muted/30 rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground mb-1">Currency</p>
                        <p className="text-sm font-medium">{detectedLocation.currency}</p>
                      </div>
                    )}
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm text-tenant-primary hover:text-tenant-primary/80 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit location details
                  </button>
                </>
              ) : (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        value={editedLocation.city || ''}
                        onChange={(e) =>
                          setEditedLocation({ ...editedLocation, city: e.target.value })
                        }
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-state">State</Label>
                      <Input
                        id="edit-state"
                        value={editedLocation.stateName || ''}
                        onChange={(e) =>
                          setEditedLocation({ ...editedLocation, stateName: e.target.value })
                        }
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-country">Country</Label>
                      <Input
                        id="edit-country"
                        value={editedLocation.countryName || ''}
                        onChange={(e) =>
                          setEditedLocation({ ...editedLocation, countryName: e.target.value })
                        }
                        placeholder="Enter country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-postal">Postal Code</Label>
                      <Input
                        id="edit-postal"
                        value={editedLocation.postalCode || ''}
                        onChange={(e) =>
                          setEditedLocation({ ...editedLocation, postalCode: e.target.value })
                        }
                        placeholder="Enter postal code"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel editing
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          {isDetecting ? (
            <div className="flex justify-center w-full">
              <Loader2 className="w-6 h-6 text-tenant-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex-1"
              >
                Enter Manually
              </Button>
              <Button
                onClick={onClose}
                variant="tenant-primary"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleConfirm}
                variant="tenant-primary"
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Use This Location
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
