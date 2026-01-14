'use client';

import React, { useState, useEffect } from 'react';
import {
  Code,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Shield,
  Zap,
  ChevronUp,
  Cookie,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// CSS SANITIZER
// =============================================================================

interface CssSanitizationResult {
  isValid: boolean;
  sanitizedCss: string;
  warnings: string[];
  errors: string[];
}

const DANGEROUS_PATTERNS = [
  { pattern: /expression\s*\(/gi, message: 'CSS expressions are not allowed' },
  { pattern: /behavior\s*:/gi, message: 'behavior property is not allowed' },
  { pattern: /javascript\s*:/gi, message: 'JavaScript URLs are not allowed' },
  { pattern: /@import/gi, message: '@import is not allowed' },
  { pattern: /position\s*:\s*fixed/gi, message: 'position: fixed may cause layout issues' },
  { pattern: /z-index\s*:\s*\d{4,}/gi, message: 'Very high z-index values may cause issues' },
];

const RESTRICTED_SELECTORS = [
  { pattern: /^html\s*{/gim, message: 'Cannot style html element' },
  { pattern: /^body\s*{/gim, message: 'Cannot style body element' },
  { pattern: /^\*\s*{/gim, message: 'Universal selector (*) is discouraged' },
  { pattern: /\.tenant-/gi, message: 'Cannot use .tenant- class prefix (reserved)' },
];

function sanitizeCss(css: string): CssSanitizationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let sanitizedCss = css;

  // Check for dangerous patterns
  DANGEROUS_PATTERNS.forEach(({ pattern, message }) => {
    if (pattern.test(css)) {
      errors.push(message);
      sanitizedCss = sanitizedCss.replace(pattern, '/* REMOVED */');
    }
  });

  // Check for restricted selectors
  RESTRICTED_SELECTORS.forEach(({ pattern, message }) => {
    if (pattern.test(css)) {
      warnings.push(message);
    }
  });

  // Check for external URLs (except images)
  const urlPattern = /url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  let match;
  while ((match = urlPattern.exec(css)) !== null) {
    const url = match[1];
    if (!url.startsWith('data:') && !url.startsWith('/') && !url.startsWith('#')) {
      warnings.push(`External URL detected: ${url.substring(0, 50)}...`);
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedCss,
    warnings,
    errors,
  };
}

// =============================================================================
// TYPES
// =============================================================================

export interface AdvancedConfig {
  customCss?: string;
  showBreadcrumbs?: boolean;
  showBackToTop?: boolean;
  showCookieBanner?: boolean;
  showPromoBar?: boolean;
  lazyLoadImages?: boolean;
  preloadFonts?: boolean;
  enableServiceWorker?: boolean;
}

interface AdvancedEditorProps {
  config: AdvancedConfig;
  onChange: (config: AdvancedConfig) => void;
  disabled?: boolean;
}

// =============================================================================
// ADVANCED EDITOR
// =============================================================================

export function AdvancedEditor({ config, onChange, disabled = false }: AdvancedEditorProps) {
  const [cssValidation, setCssValidation] = useState<CssSanitizationResult | null>(null);

  const updateConfig = (updates: Partial<AdvancedConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Validate CSS when it changes
  useEffect(() => {
    if (config.customCss) {
      const result = sanitizeCss(config.customCss);
      setCssValidation(result);
    } else {
      setCssValidation(null);
    }
  }, [config.customCss]);

  return (
    <div className="space-y-6">
      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            Custom CSS
          </CardTitle>
          <CardDescription>
            Add custom CSS styles. Styles are scoped to your storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-amber-50 border-amber-200">
            <Shield className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Security Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              Custom CSS is sanitized to prevent security issues. Some patterns like
              @import, JavaScript URLs, and targeting html/body are restricted.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>CSS Styles</Label>
              {cssValidation && (
                <div className="flex items-center gap-2">
                  {cssValidation.errors.length > 0 ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {cssValidation.errors.length} errors
                    </Badge>
                  ) : cssValidation.warnings.length > 0 ? (
                    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-3 h-3" />
                      {cssValidation.warnings.length} warnings
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3" />
                      Valid
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Textarea
              value={config.customCss || ''}
              onChange={(e) => updateConfig({ customCss: e.target.value })}
              placeholder={`.my-custom-class {
  color: #333;
  background: #f5f5f5;
}

.product-card {
  border-radius: 8px;
}`}
              disabled={disabled}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Validation Messages */}
          {cssValidation && (cssValidation.errors.length > 0 || cssValidation.warnings.length > 0) && (
            <div className="space-y-2">
              {cssValidation.errors.map((error, i) => (
                <Alert key={`error-${i}`} variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
              {cssValidation.warnings.map((warning, i) => (
                <Alert key={`warning-${i}`} className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-700">{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visibility Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Visibility Options
          </CardTitle>
          <CardDescription>
            Show or hide various UI elements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <ChevronUp className="w-4 h-4" />
              </div>
              <div>
                <Label>Breadcrumbs</Label>
                <p className="text-sm text-muted-foreground">Navigation path on product/category pages</p>
              </div>
            </div>
            <Switch
              checked={config.showBreadcrumbs !== false}
              onCheckedChange={(checked) => updateConfig({ showBreadcrumbs: checked })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <ChevronUp className="w-4 h-4" />
              </div>
              <div>
                <Label>Back to Top Button</Label>
                <p className="text-sm text-muted-foreground">Floating button to scroll to top</p>
              </div>
            </div>
            <Switch
              checked={config.showBackToTop !== false}
              onCheckedChange={(checked) => updateConfig({ showBackToTop: checked })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Cookie className="w-4 h-4" />
              </div>
              <div>
                <Label>Cookie Consent Banner</Label>
                <p className="text-sm text-muted-foreground">GDPR cookie consent notice</p>
              </div>
            </div>
            <Switch
              checked={config.showCookieBanner}
              onCheckedChange={(checked) => updateConfig({ showCookieBanner: checked })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <Label>Promotional Bar</Label>
                <p className="text-sm text-muted-foreground">Top banner for announcements</p>
              </div>
            </div>
            <Switch
              checked={config.showPromoBar !== false}
              onCheckedChange={(checked) => updateConfig({ showPromoBar: checked })}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </CardTitle>
          <CardDescription>
            Optimize loading speed and user experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Lazy Load Images</Label>
              <p className="text-sm text-muted-foreground">Load images as they enter viewport</p>
            </div>
            <Switch
              checked={config.lazyLoadImages !== false}
              onCheckedChange={(checked) => updateConfig({ lazyLoadImages: checked })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Preload Fonts</Label>
              <p className="text-sm text-muted-foreground">Load custom fonts early to prevent flash</p>
            </div>
            <Switch
              checked={config.preloadFonts !== false}
              onCheckedChange={(checked) => updateConfig({ preloadFonts: checked })}
              disabled={disabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Service Worker</Label>
              <p className="text-sm text-muted-foreground">Enable offline support and faster loads</p>
            </div>
            <Switch
              checked={config.enableServiceWorker}
              onCheckedChange={(checked) => updateConfig({ enableServiceWorker: checked })}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedEditor;

// Export sanitizer for use elsewhere
export { sanitizeCss, type CssSanitizationResult };
