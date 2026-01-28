'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OTPInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
  className,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(
    value.split('').concat(Array(length).fill('')).slice(0, length)
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Sync external value changes
  useEffect(() => {
    if (value !== otp.join('')) {
      setOtp(value.split('').concat(Array(length).fill('')).slice(0, length));
    }
  }, [value, length]);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    const fullValue = newOtp.join('');
    onChange?.(fullValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (fullValue.length === length && !fullValue.includes('')) {
      onComplete?.(fullValue);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBlockClipboard = (e: React.ClipboardEvent | React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select();
  };

  return (
    <div className={cn('flex gap-2 sm:gap-3 justify-center', className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handleBlockClipboard}
          onCopy={handleBlockClipboard}
          onCut={handleBlockClipboard}
          onContextMenu={handleBlockClipboard}
          onFocus={() => handleFocus(index)}
          autoComplete="off"
          disabled={disabled}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold',
            'border-2 rounded-xl transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 text-red-700'
              : otp[index]
                ? 'border-primary bg-primary/5 text-foreground focus:ring-primary'
                : 'border-border bg-white text-foreground focus:border-primary focus:ring-primary',
            'placeholder:text-muted-foreground/30'
          )}
          placeholder="0"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default OTPInput;
