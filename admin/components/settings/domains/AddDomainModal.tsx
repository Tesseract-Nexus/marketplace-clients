'use client';

import React, { useState, useCallback } from 'react';
import { Globe, Plus, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/contexts/ToastContext';
import {
  customDomainService,
  type CustomDomain,
} from '@/lib/services/customDomainService';

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDomainAdded: (domain: CustomDomain) => void;
}

const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function AddDomainModal({ isOpen, onClose, onDomainAdded }: AddDomainModalProps) {
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const toast = useToast();

  const cleanDomain = useCallback((value: string): string => {
    return value
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/.*$/, '');
  }, []);

  const validateDomain = useCallback((value: string): boolean => {
    const cleaned = cleanDomain(value);
    if (!cleaned) return false;
    return DOMAIN_REGEX.test(cleaned);
  }, [cleanDomain]);

  const handleDomainChange = (value: string) => {
    setDomain(value);
    setError('');

    if (!value.trim()) {
      setValidationState('idle');
    } else if (validateDomain(value)) {
      setValidationState('valid');
    } else {
      setValidationState('invalid');
    }
  };

  const handleSubmit = async () => {
    const cleaned = cleanDomain(domain);

    if (!cleaned) {
      setError('Please enter a domain');
      setValidationState('invalid');
      return;
    }

    if (!validateDomain(domain)) {
      setError('Please enter a valid domain (e.g., store.example.com)');
      setValidationState('invalid');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await customDomainService.createDomain({
        domain: cleaned,
        targetType: 'storefront',
        forceHTTPS: true,
        redirectWWW: true,
      });

      toast.success('Domain Added', `${cleaned} has been added. Configure your DNS to complete setup.`);
      onDomainAdded(result.data);
      handleClose();
    } catch (err: unknown) {
      console.error('Failed to add domain:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add domain';
      setError(errorMessage);
      toast.error('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDomain('');
    setError('');
    setValidationState('idle');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && validationState === 'valid') {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-bold text-white">
                Add Custom Domain
              </h2>
              <p className="text-sm text-white/80">
                Connect your own domain to your store
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Domain Input */}
          <div className="space-y-2">
            <label
              htmlFor="domain-input"
              className="block text-sm font-medium text-foreground"
            >
              Domain Name
            </label>
            <div className="relative">
              <Input
                id="domain-input"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="store.example.com"
                className={`font-mono h-11 pr-10 ${
                  validationState === 'valid'
                    ? 'border-success focus-visible:border-success'
                    : validationState === 'invalid'
                    ? 'border-error focus-visible:border-error'
                    : ''
                }`}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {validationState === 'valid' && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
              )}
              {validationState === 'invalid' && domain && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-error" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter without http:// or www (e.g., store.example.com or shop.mybrand.com)
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* What Happens Next */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              What happens next?
            </h3>
            <div className="space-y-3">
              {[
                { step: 1, text: 'We generate DNS records for your domain', icon: Globe },
                { step: 2, text: 'Add the records at your domain registrar', icon: ArrowRight },
                { step: 3, text: 'We verify and provision SSL automatically', icon: Shield },
                { step: 4, text: 'Your custom domain goes live!', icon: Zap },
              ].map(({ step, text, icon: Icon }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{step}</span>
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || validationState !== 'valid'}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
