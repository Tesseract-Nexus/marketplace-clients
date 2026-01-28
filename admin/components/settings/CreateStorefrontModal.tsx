'use client';

import React, { useState, useMemo } from 'react';
import { Store, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storefrontService } from '@/lib/services/storefrontService';
import { useToast } from '@/contexts/ToastContext';
import { getStorefrontDomain } from '@/lib/utils/tenant';
import type { Storefront } from '@/lib/api/types';

interface CreateStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (storefront: Storefront) => void;
  vendorId: string;
}

export function CreateStorefrontModal({
  isOpen,
  onClose,
  onCreated,
  vendorId,
}: CreateStorefrontModalProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  // Generate slug from name
  const slug = useMemo(() => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, [name]);

  // Preview URL
  const storefrontDomain = getStorefrontDomain();
  const storefrontProtocol = storefrontDomain.includes('localhost') ? 'http' : 'https';
  const storefrontUrl = slug ? `${storefrontProtocol}://${slug}.${storefrontDomain}` : '';

  const handleCreate = async () => {
    if (!vendorId) {
      setError('Unable to create storefront: Tenant information not loaded.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a store name');
      return;
    }

    if (slug.length < 3) {
      setError('Store name must be at least 3 characters');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Check slug availability
      const isAvailable = await storefrontService.checkSlugAvailability(slug);
      if (!isAvailable) {
        setError('This store URL is already taken. Try a different name.');
        setIsCreating(false);
        return;
      }

      // Create storefront
      const result = await storefrontService.createStorefront({
        vendorId,
        name: name.trim(),
        slug,
        description: undefined,
        customDomain: undefined,
        logoUrl: undefined,
        faviconUrl: undefined,
        metaTitle: undefined,
        metaDescription: undefined,
      });

      toast.success('Storefront Created', `${name} is now live at ${storefrontUrl}`);
      onCreated(result.data);
      setName('');
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create storefront:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create storefront';
      setError(errorMessage);
      toast.error('Error', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Create New Storefront</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Create a new storefront with just a name. You can configure other details later.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Store Name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g., My Awesome Store"
                className="w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim() && !isCreating) {
                    handleCreate();
                  }
                }}
              />
            </div>

            {/* URL Preview */}
            {slug && (
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Your storefront URL will be:
                </p>
                <p className="text-sm font-mono text-primary break-all">
                  {storefrontUrl}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg border border-destructive/30">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="bg-primary text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Storefront
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateStorefrontModal;
