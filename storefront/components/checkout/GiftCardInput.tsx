'use client';

import { useState } from 'react';
import { CreditCard, X, Check, Loader2, AlertCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenant, useCurrency } from '@/context/TenantContext';
import { applyGiftCard, formatGiftCardCode, type AppliedGiftCard } from '@/lib/api/gift-cards';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useTranslatedText } from '@/hooks/useTranslatedText';

interface GiftCardInputProps {
  orderTotal: number;
  appliedGiftCards: AppliedGiftCard[];
  onApply: (giftCard: AppliedGiftCard) => void;
  onRemove: (code: string) => void;
  onUpdateAmount: (code: string, amount: number) => void;
  disabled?: boolean;
}

export function GiftCardInput({
  orderTotal,
  appliedGiftCards,
  onApply,
  onRemove,
  onUpdateAmount,
  disabled = false,
}: GiftCardInputProps) {
  const { tenant } = useTenant();
  const { symbol: currencySymbol } = useCurrency();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Translated strings
  const { translatedText: storeNotLoadedText } = useTranslatedText('Store configuration not loaded', { context: 'error' });
  const { translatedText: alreadyAppliedText } = useTranslatedText('This gift card is already applied', { context: 'error' });
  const { translatedText: invalidGiftCardText } = useTranslatedText('Invalid gift card', { context: 'error' });
  const { translatedText: failedApplyText } = useTranslatedText('Failed to apply gift card', { context: 'error' });
  const { translatedText: applyText } = useTranslatedText('Apply', { context: 'button' });

  const totalGiftCardAmount = appliedGiftCards.reduce((sum, gc) => sum + gc.amountToUse, 0);
  const remainingBalance = Math.max(0, orderTotal - totalGiftCardAmount);

  const handleApply = async () => {
    if (!code.trim()) return;

    if (!tenant) {
      setError(storeNotLoadedText);
      return;
    }

    // Check if already applied
    const cleanCode = code.replace(/-/g, '').trim().toUpperCase();
    if (appliedGiftCards.some(gc => gc.code.replace(/-/g, '') === cleanCode)) {
      setError(alreadyAppliedText);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await applyGiftCard(tenant.id, tenant.storefrontId, cleanCode);

      if (response.valid && response.giftCard) {
        // Calculate amount to use (up to remaining balance or gift card balance)
        const amountToUse = Math.min(response.giftCard.balance, remainingBalance);

        onApply({
          code: response.giftCard.code,
          balance: response.giftCard.balance,
          currency: response.giftCard.currency,
          status: response.giftCard.status,
          expiresAt: response.giftCard.expiresAt,
          amountToUse,
        });
        setCode('');
        setIsExpanded(false);
      } else {
        setError(response.error || invalidGiftCardText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : failedApplyText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Format as XXXX-XXXX-XXXX-XXXX
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const formatted = formatGiftCardCode(cleaned);
    setCode(formatted);
    setError(null);
  };

  // Show applied gift cards
  if (appliedGiftCards.length > 0) {
    return (
      <div className="space-y-3">
        {appliedGiftCards.map((gc) => (
          <div
            key={gc.code}
            className="p-3 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <span className="font-medium text-purple-800 dark:text-purple-200 font-mono text-sm">
                    {formatGiftCardCode(gc.code)}
                  </span>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    <TranslatedUIText text="Balance" />: {currencySymbol}{gc.balance.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(gc.code)}
                disabled={disabled}
                className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Amount selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600 dark:text-purple-400"><TranslatedUIText text="Apply" />:</span>
              <div className="flex-1 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
                <Input
                  type="number"
                  min={0}
                  max={gc.balance}
                  step={0.01}
                  value={gc.amountToUse}
                  onChange={(e) => {
                    const value = Math.min(parseFloat(e.target.value) || 0, gc.balance);
                    onUpdateAmount(gc.code, value);
                  }}
                  disabled={disabled}
                  className="h-8 pl-6 text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateAmount(gc.code, gc.balance)}
                disabled={disabled}
                className="text-xs h-8"
              >
                <TranslatedUIText text="Use all" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add another gift card */}
        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            disabled={disabled}
            className="flex items-center gap-2 text-sm text-tenant-primary hover:underline disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            <TranslatedUIText text="Add another gift card" />
          </button>
        )}

        {/* Input form for adding another */}
        {isExpanded && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApply();
                    }
                  }}
                  disabled={disabled || isLoading}
                  className="pl-9 font-mono uppercase tracking-wider"
                  maxLength={19}
                />
              </div>
              <button
                type="button"
                onClick={handleApply}
                disabled={disabled || isLoading || !code.trim()}
                className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 text-sm font-medium"
              >
                {isLoading ? '...' : applyText}
              </button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsExpanded(false);
                  setCode('');
                  setError(null);
                }}
                disabled={isLoading}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          disabled={disabled}
          className="flex items-center gap-2 text-sm text-tenant-primary hover:underline disabled:opacity-50"
        >
          <CreditCard className="h-4 w-4" />
          <TranslatedUIText text="Have a gift card?" />
        </button>
      )}

      {/* Input form */}
      {isExpanded && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
                disabled={disabled || isLoading}
                className="pl-9 font-mono uppercase tracking-wider"
                maxLength={19}
              />
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={disabled || isLoading || !code.trim()}
              className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 text-sm font-medium"
            >
              {isLoading ? '...' : applyText}
            </button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsExpanded(false);
                setCode('');
                setError(null);
              }}
              disabled={isLoading}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
