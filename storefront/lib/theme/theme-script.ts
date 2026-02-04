/**
 * Theme script generator
 * Creates a blocking script that sets CSS variables before any paint
 */

/**
 * Generate a blocking script that sets CSS variables before any paint
 * This prevents Flash of Unstyled Content (FOUC)
 */
export function generateThemeScript(cssString: string): string {
  if (!cssString) {
    return '';
  }

  // Escape special characters to prevent script injection
  const safeCssString = JSON.stringify(cssString);

  return `
    (function() {
      var css = ${safeCssString};
      var style = document.createElement('style');
      style.id = 'theme-blocking';
      style.textContent = ':root{' + css + '}';
      document.head.insertBefore(style, document.head.firstChild);
      document.documentElement.classList.add('theme-loaded');
    })();
  `;
}

/**
 * Generate the critical CSS for theme loading states
 */
export function getThemeLoadingStyles(): string {
  return `
    /* Hide main content until theme is loaded */
    html.theme-loading #main-app-content {
      display: none !important;
    }
    /* Show skeleton loader while theme is loading */
    html.theme-loading #theme-skeleton {
      display: block !important;
    }
    /* Once loaded, show content and hide skeleton */
    html.theme-loaded #main-app-content {
      display: block !important;
      animation: fadeIn 0.2s ease-out;
    }
    html.theme-loaded #theme-skeleton {
      display: none !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
}
