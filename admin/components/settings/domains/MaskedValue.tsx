'use client';

import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/contexts/DialogContext';

interface MaskedValueProps {
  value: string;
  label?: string;
  alwaysShowCopy?: boolean;
}

export function MaskedValue({ value, label, alwaysShowCopy = true }: MaskedValueProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showSuccess } = useDialog();

  const maskedValue = value
    ? `${value.substring(0, 8)}${'•'.repeat(Math.min(value.length - 8, 20))}`
    : '—';

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    showSuccess('Copied', `${label || 'Value'} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-1.5 group">
      <code className="bg-muted/50 rounded px-2 py-0.5 text-xs font-mono break-all border border-border">
        {revealed ? value : maskedValue}
      </code>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
        onClick={() => setRevealed(!revealed)}
        title={revealed ? 'Hide value' : 'Reveal value'}
      >
        {revealed ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
      </Button>
      {alwaysShowCopy && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
