import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './useDebounce';

export type FieldState = 'idle' | 'validating' | 'success' | 'error';

interface UseFieldValidationOptions {
  validationFn: (value: string) => Promise<{ available: boolean; message?: string }>;
  debounceMs?: number;
  minLength?: number;
}

export function useFieldValidation({
  validationFn,
  debounceMs = 500,
  minLength = 2,
}: UseFieldValidationOptions) {
  const [fieldState, setFieldState] = useState<FieldState>('idle');
  const [error, setError] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const lastValidatedValue = useRef<string>('');

  const debouncedValue = useDebounce(value, debounceMs);

  const validate = useCallback(async (val: string) => {
    if (!val || val.length < minLength) {
      setFieldState('idle');
      setError('');
      lastValidatedValue.current = '';
      return;
    }

    // Don't validate if we already validated this value
    if (lastValidatedValue.current === val) {
      return;
    }

    setFieldState('validating');
    setError('');

    try {
      const result = await validationFn(val);
      lastValidatedValue.current = val;

      if (result.available) {
        setFieldState('success');
        setError('');
      } else {
        setFieldState('error');
        setError(result.message || 'This value is not available');
      }
    } catch (err) {
      setFieldState('error');
      setError('Failed to validate. Please try again.');
      lastValidatedValue.current = '';
    }
  }, [validationFn, minLength]);

  useEffect(() => {
    if (debouncedValue) {
      validate(debouncedValue);
    } else {
      setFieldState('idle');
      setError('');
      lastValidatedValue.current = '';
    }
  }, [debouncedValue, validate]);

  const reset = useCallback(() => {
    setFieldState('idle');
    setError('');
    setValue('');
    lastValidatedValue.current = '';
  }, []);

  return {
    fieldState,
    error,
    setValue,
    reset,
  };
}
