import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useRefresh, useMultiRefresh } from '../../hooks/useRefresh';

describe('useRefresh', () => {
  describe('useRefresh hook', () => {
    it('should start with refreshing as false', () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useRefresh({ onRefresh }));

      expect(result.current.refreshing).toBe(false);
    });

    it('should set refreshing to true during refresh', async () => {
      let resolveRefresh: () => void;
      const onRefresh = jest.fn().mockImplementation(
        () => new Promise((resolve) => { resolveRefresh = resolve; })
      );

      const { result } = renderHook(() => useRefresh({ onRefresh, minimumDelay: 0 }));

      let refreshPromise: Promise<void>;
      act(() => {
        refreshPromise = result.current.onRefresh();
      });

      expect(result.current.refreshing).toBe(true);

      await act(async () => {
        resolveRefresh!();
        await refreshPromise;
      });

      expect(result.current.refreshing).toBe(false);
    });

    it('should call onRefresh callback', async () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => useRefresh({ onRefresh, minimumDelay: 0 }));

      await act(async () => {
        await result.current.onRefresh();
      });

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    // Skip: This test requires real timers and conflicts with Jest fake timers
    it.skip('should maintain minimum delay for UX', async () => {
      const onRefresh = jest.fn().mockResolvedValue(undefined);
      const minimumDelay = 500;

      const { result } = renderHook(() => useRefresh({ onRefresh, minimumDelay }));

      const startTime = Date.now();

      await act(async () => {
        await result.current.onRefresh();
      });

      const elapsed = Date.now() - startTime;

      // Should take at least minimumDelay time
      expect(elapsed).toBeGreaterThanOrEqual(minimumDelay - 50); // Allow small margin
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Refresh failed');
      const onRefresh = jest.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useRefresh({ onRefresh, minimumDelay: 0 }));

      await act(async () => {
        try {
          await result.current.onRefresh();
        } catch (e) {
          // Expected
        }
      });

      // Should set refreshing back to false even on error
      expect(result.current.refreshing).toBe(false);
    });
  });

  describe('useMultiRefresh hook', () => {
    it('should call all refresh functions', async () => {
      const refresh1 = jest.fn().mockResolvedValue(undefined);
      const refresh2 = jest.fn().mockResolvedValue(undefined);
      const refresh3 = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMultiRefresh([refresh1, refresh2, refresh3])
      );

      await act(async () => {
        await result.current.onRefresh();
      });

      expect(refresh1).toHaveBeenCalledTimes(1);
      expect(refresh2).toHaveBeenCalledTimes(1);
      expect(refresh3).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failures', async () => {
      const refresh1 = jest.fn().mockResolvedValue(undefined);
      const refresh2 = jest.fn().mockRejectedValue(new Error('Failed'));
      const refresh3 = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useMultiRefresh([refresh1, refresh2, refresh3])
      );

      await act(async () => {
        await result.current.onRefresh();
      });

      // All should still be called
      expect(refresh1).toHaveBeenCalledTimes(1);
      expect(refresh2).toHaveBeenCalledTimes(1);
      expect(refresh3).toHaveBeenCalledTimes(1);

      // Refreshing should be false after completion
      expect(result.current.refreshing).toBe(false);
    });

    it('should set refreshing state correctly', async () => {
      const refresh1 = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useMultiRefresh([refresh1]));

      expect(result.current.refreshing).toBe(false);

      let refreshPromise: Promise<void>;
      act(() => {
        refreshPromise = result.current.onRefresh();
      });

      expect(result.current.refreshing).toBe(true);

      await act(async () => {
        await refreshPromise;
      });

      expect(result.current.refreshing).toBe(false);
    });
  });
});
