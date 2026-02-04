import { GOOGLE_FONTS } from '@/types/storefront';

// ========================================
// Google Fonts Utilities
// ========================================

const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800];

/**
 * Generate Google Fonts URL for server-side preloading
 * Filters and deduplicates fonts, returns null if no valid fonts
 */
export function getGoogleFontsUrl(fonts: (string | undefined)[]): string | null {
  const validFonts = fonts.filter(
    (f): f is string => Boolean(f) && GOOGLE_FONTS.some((gf) => gf.name === f)
  );
  const uniqueFonts = [...new Set(validFonts)];

  if (uniqueFonts.length === 0) return null;

  const familyParams = uniqueFonts
    .map((font) => {
      const formattedName = font.replace(/\s+/g, '+');
      const weightString = FONT_WEIGHTS.join(';');
      return `family=${formattedName}:wght@${weightString}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

export function getFontUrl(fontName: string, weights: number[] = FONT_WEIGHTS): string {
  const formattedName = fontName.replace(/\s+/g, '+');
  const weightString = weights.join(';');
  return `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weightString}&display=swap`;
}

export function getMultipleFontsUrl(fonts: string[], weights: number[] = FONT_WEIGHTS): string {
  const uniqueFonts = [...new Set(fonts)];
  const familyParams = uniqueFonts
    .map((font) => {
      const formattedName = font.replace(/\s+/g, '+');
      const weightString = weights.join(';');
      return `family=${formattedName}:wght@${weightString}`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

export function isValidFont(fontName: string): boolean {
  return GOOGLE_FONTS.some((f) => f.name === fontName);
}

export function getFontCategory(fontName: string): string {
  const font = GOOGLE_FONTS.find((f) => f.name === fontName);
  return font?.category || 'sans-serif';
}

// ========================================
// Font Loading
// ========================================

export function loadFonts(fonts: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const uniqueFonts = [...new Set(fonts)].filter(isValidFont);

    if (uniqueFonts.length === 0) {
      resolve();
      return;
    }

    const url = getMultipleFontsUrl(uniqueFonts);

    // Check if already loaded
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (existingLink) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.href = url;
    link.rel = 'stylesheet';
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load fonts: ${uniqueFonts.join(', ')}`));

    document.head.appendChild(link);
  });
}

// Preload font for better performance
export function preloadFont(fontName: string): void {
  if (!isValidFont(fontName)) return;

  const url = getFontUrl(fontName);
  const existingLink = document.querySelector(`link[href="${url}"]`);

  if (existingLink) return;

  const link = document.createElement('link');
  link.href = url;
  link.rel = 'preload';
  link.as = 'style';
  document.head.appendChild(link);
}

// ========================================
// Font Style Helpers
// ========================================

export function getFontFamilyStyle(
  headingFont: string,
  bodyFont: string
): { heading: string; body: string } {
  const headingCategory = getFontCategory(headingFont);
  const bodyCategory = getFontCategory(bodyFont);

  return {
    heading: `'${headingFont}', ${headingCategory}`,
    body: `'${bodyFont}', ${bodyCategory}`,
  };
}
