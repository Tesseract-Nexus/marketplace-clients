'use client';

import { useState, useEffect } from 'react';
import { useMobileConfig } from '@/context/TenantContext';

/**
 * Hook to detect if low data mode should be used.
 * Respects the mobileConfig.lowDataMode setting and can also detect
 * if the user has enabled "Save Data" in their browser.
 *
 * @returns Object with lowDataMode status and recommended image quality
 */
export function useLowDataMode() {
  const mobileConfig = useMobileConfig();
  const [connectionSaveData, setConnectionSaveData] = useState(false);

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined' || !('connection' in navigator)) return;

    // Check for Save-Data header or slow connection
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionSaveData(connection.saveData === true);

      const handleChange = () => {
        setConnectionSaveData(connection.saveData === true);
      };

      connection.addEventListener('change', handleChange);
      return () => connection.removeEventListener('change', handleChange);
    }
  }, []);

  // Determine if low data mode is active
  const isLowDataMode = mobileConfig?.lowDataMode === true || connectionSaveData;

  // Get recommended image quality based on mode
  const imageQuality = isLowDataMode ? 60 : 85;

  // Get recommended image sizes for responsive images
  const getImageSizes = (defaultSizes: string): string => {
    if (isLowDataMode) {
      // Reduce image sizes in low data mode
      return defaultSizes
        .replace(/(\d+)vw/g, (_, num) => `${Math.round(parseInt(num) * 0.7)}vw`)
        .replace(/(\d+)px/g, (_, num) => `${Math.round(parseInt(num) * 0.7)}px`);
    }
    return defaultSizes;
  };

  return {
    isLowDataMode,
    imageQuality,
    getImageSizes,
  };
}

export default useLowDataMode;
