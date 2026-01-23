'use client';

import React, { useState } from 'react';
import { Truck, Save, Loader2, Info, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CARRIERS, CarrierInfo } from './CarrierCard';

interface CarrierConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrierType: string | null;
  onSave: (carrierType: string, credentials: Record<string, string>, isTestMode: boolean) => Promise<void>;
  saving?: boolean;
}

const CARRIER_HELP_LINKS: Record<string, string> = {
  DELHIVERY: 'https://www.delhivery.com/api',
  SHIPROCKET: 'https://app.shiprocket.in/',
};

export function CarrierConfigModal({
  open,
  onOpenChange,
  carrierType,
  onSave,
  saving,
}: CarrierConfigModalProps) {
  const [isTestMode, setIsTestMode] = useState(false);

  // Delhivery fields
  const [delhiveryToken, setDelhiveryToken] = useState('');
  const [delhiveryPickupLocation, setDelhiveryPickupLocation] = useState('');

  // Shiprocket fields
  const [shiprocketEmail, setShiprocketEmail] = useState('');
  const [shiprocketPassword, setShiprocketPassword] = useState('');

  const carrier = CARRIERS.find(c => c.type === carrierType);

  const handleSave = async () => {
    if (!carrierType) return;

    let credentials: Record<string, string> = {};

    if (carrierType === 'DELHIVERY') {
      credentials = {
        api_token: delhiveryToken,
        pickup_location: delhiveryPickupLocation || 'Primary',
      };
    } else if (carrierType === 'SHIPROCKET') {
      credentials = {
        email: shiprocketEmail,
        password: shiprocketPassword,
      };
    }

    await onSave(carrierType, credentials, isTestMode);

    // Clear fields after save
    setDelhiveryToken('');
    setDelhiveryPickupLocation('');
    setShiprocketEmail('');
    setShiprocketPassword('');
    setIsTestMode(false);
  };

  const isValid = () => {
    if (carrierType === 'DELHIVERY') {
      return delhiveryToken.length > 0;
    }
    if (carrierType === 'SHIPROCKET') {
      return shiprocketEmail.length > 0 && shiprocketPassword.length > 0;
    }
    return false;
  };

  if (!carrier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              carrier.color === 'red' ? "bg-red-100" : "bg-primary/10"
            )}>
              <Truck className={cn(
                "h-6 w-6",
                carrier.color === 'red' ? "text-red-600" : "text-primary"
              )} />
            </div>
            <div>
              <DialogTitle>Connect {carrier.name}</DialogTitle>
              <DialogDescription>
                Enter your API credentials to enable this carrier
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contextual Help */}
          <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-primary">
              <span className="font-medium">Need credentials?</span>{' '}
              <a
                href={CARRIER_HELP_LINKS[carrierType || ''] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1"
              >
                Visit the {carrier.name} dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Dynamic Form Fields based on Carrier */}
          {carrierType === 'DELHIVERY' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  API Token *
                </label>
                <Input
                  type="password"
                  value={delhiveryToken}
                  onChange={(e) => setDelhiveryToken(e.target.value)}
                  placeholder="Enter your Delhivery API token"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Pickup Location Code
                </label>
                <Input
                  value={delhiveryPickupLocation}
                  onChange={(e) => setDelhiveryPickupLocation(e.target.value)}
                  placeholder="Primary (default)"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default pickup location for shipments
                </p>
              </div>
            </>
          )}

          {carrierType === 'SHIPROCKET' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email *
                </label>
                <Input
                  type="email"
                  value={shiprocketEmail}
                  onChange={(e) => setShiprocketEmail(e.target.value)}
                  placeholder="your-email@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Password *
                </label>
                <Input
                  type="password"
                  value={shiprocketPassword}
                  onChange={(e) => setShiprocketPassword(e.target.value)}
                  placeholder="Enter your Shiprocket password"
                />
              </div>
            </>
          )}

          {/* Test Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm text-foreground">Test Mode</p>
              <p className="text-xs text-muted-foreground">Use sandbox environment</p>
            </div>
            <Switch
              checked={isTestMode}
              onCheckedChange={setIsTestMode}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-primary"
            onClick={handleSave}
            disabled={!isValid() || saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save & Test Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CarrierConfigModal;
