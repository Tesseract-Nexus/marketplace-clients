'use client';

import { useEffect, useCallback } from 'react';

interface UseSearchShortcutOptions {
  onOpen: () => void;
  enabled?: boolean;
}

/**
 * Hook to handle Cmd/Ctrl+K keyboard shortcut for opening search
 * Also handles the "/" key as an alternative shortcut
 */
export function useSearchShortcut({ onOpen, enabled = true }: UseSearchShortcutOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      const isCmdK = (event.metaKey || event.ctrlKey) && event.key === 'k';

      // Check for "/" key when not typing in an input
      const isSlash =
        event.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (event.target as HTMLElement)?.tagName
        ) &&
        !(event.target as HTMLElement)?.isContentEditable;

      if (isCmdK || isSlash) {
        event.preventDefault();
        onOpen();
      }
    },
    [onOpen, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Returns the appropriate keyboard shortcut symbol based on OS
 */
export function useKeyboardShortcutSymbol(): string {
  if (typeof window === 'undefined') return '⌘K';

  const isMac = navigator.platform.toLowerCase().includes('mac');
  return isMac ? '⌘K' : 'Ctrl+K';
}
