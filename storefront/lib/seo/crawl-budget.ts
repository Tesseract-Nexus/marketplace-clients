/**
 * Crawl Budget Control System
 *
 * Monitors and manages crawl budget for SEO optimization.
 * Detects orphaned pages, redirect chains, and canonical conflicts.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PageAuditResult {
  url: string;
  status: PageStatus;
  issues: PageIssue[];
  metrics: PageMetrics;
  lastCrawled?: string;
  indexable: boolean;
}

export type PageStatus =
  | 'ok'
  | 'warning'
  | 'error'
  | 'redirect'
  | 'not-found'
  | 'blocked';

export interface PageIssue {
  type: IssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
  autoFixable: boolean;
  suggestedFix?: string;
}

export type IssueType =
  | 'orphaned-page'
  | 'redirect-chain'
  | 'redirect-loop'
  | 'canonical-mismatch'
  | 'canonical-missing'
  | 'duplicate-content'
  | 'noindex-indexed'
  | 'soft-404'
  | 'slow-response'
  | 'broken-internal-link'
  | 'mixed-content'
  | 'hreflang-mismatch'
  | 'sitemap-missing'
  | 'robots-blocked'
  | 'thin-content';

export interface PageMetrics {
  internalLinks: number;
  externalLinks: number;
  backlinks: number;
  wordCount: number;
  responseTime: number;
  statusCode: number;
  contentType: string;
  byteSize: number;
}

export interface CrawlReport {
  tenantId: string;
  generatedAt: string;
  totalPages: number;
  indexablePages: number;
  issues: {
    critical: number;
    warning: number;
    info: number;
  };
  pages: PageAuditResult[];
  summary: CrawlSummary;
}

export interface CrawlSummary {
  orphanedPages: string[];
  redirectChains: RedirectChain[];
  canonicalConflicts: CanonicalConflict[];
  duplicateGroups: DuplicateGroup[];
  slowPages: string[];
  brokenLinks: BrokenLink[];
}

export interface RedirectChain {
  start: string;
  chain: string[];
  final: string;
  length: number;
}

export interface CanonicalConflict {
  url: string;
  declaredCanonical: string;
  expectedCanonical: string;
  type: 'self-reference' | 'cross-domain' | 'http-https' | 'www-non-www' | 'trailing-slash';
}

export interface DuplicateGroup {
  canonical: string;
  duplicates: string[];
  similarity: number;
}

export interface BrokenLink {
  sourceUrl: string;
  targetUrl: string;
  statusCode: number;
  anchorText?: string;
}

// =============================================================================
// CRAWL BUDGET ANALYZER
// =============================================================================

export class CrawlBudgetAnalyzer {
  private tenantId: string;
  private baseUrl: string;
  private pages: Map<string, PageAuditResult> = new Map();
  private internalLinks: Map<string, Set<string>> = new Map();
  private redirects: Map<string, string> = new Map();

  constructor(tenantId: string, baseUrl: string) {
    this.tenantId = tenantId;
    this.baseUrl = baseUrl;
  }

  // ==========================================================================
  // ORPHANED PAGE DETECTION
  // ==========================================================================

  /**
   * Find pages with no internal links pointing to them
   */
  findOrphanedPages(): string[] {
    const linkedPages = new Set<string>();

    // Collect all pages that have at least one internal link
    this.internalLinks.forEach((targets) => {
      targets.forEach((target) => linkedPages.add(target));
    });

    // Find pages not in the linked set
    const orphaned: string[] = [];
    this.pages.forEach((_, url) => {
      if (!linkedPages.has(url) && !this.isHomepage(url)) {
        orphaned.push(url);
      }
    });

    return orphaned;
  }

  // ==========================================================================
  // REDIRECT CHAIN DETECTION
  // ==========================================================================

  /**
   * Detect redirect chains longer than 1 hop
   */
  findRedirectChains(): RedirectChain[] {
    const chains: RedirectChain[] = [];
    const visited = new Set<string>();

    this.redirects.forEach((target, source) => {
      if (visited.has(source)) return;

      const chain: string[] = [source];
      let current = target;

      while (this.redirects.has(current) && !chain.includes(current)) {
        chain.push(current);
        current = this.redirects.get(current)!;
      }
      chain.push(current);

      if (chain.length > 2) {
        chains.push({
          start: source,
          chain: chain.slice(1, -1),
          final: current,
          length: chain.length - 1,
        });
      }

      chain.forEach((url) => visited.add(url));
    });

    return chains;
  }

  /**
   * Detect redirect loops
   */
  findRedirectLoops(): string[][] {
    const loops: string[][] = [];
    const visited = new Set<string>();

    this.redirects.forEach((_, source) => {
      if (visited.has(source)) return;

      const path: string[] = [source];
      let current = this.redirects.get(source);

      while (current && !visited.has(current)) {
        if (path.includes(current)) {
          // Found a loop
          const loopStart = path.indexOf(current);
          loops.push(path.slice(loopStart));
          break;
        }
        path.push(current);
        current = this.redirects.get(current);
      }

      path.forEach((url) => visited.add(url));
    });

    return loops;
  }

  // ==========================================================================
  // CANONICAL CONFLICT DETECTION
  // ==========================================================================

  /**
   * Find canonical URL conflicts
   */
  findCanonicalConflicts(
    canonicalMap: Map<string, string>
  ): CanonicalConflict[] {
    const conflicts: CanonicalConflict[] = [];

    canonicalMap.forEach((canonical, url) => {
      const expected = this.normalizeUrl(url);

      // Check for various canonical issues
      if (canonical !== expected) {
        let type: CanonicalConflict['type'] = 'self-reference';

        if (this.isDifferentDomain(url, canonical)) {
          type = 'cross-domain';
        } else if (this.isHttpMismatch(url, canonical)) {
          type = 'http-https';
        } else if (this.isWwwMismatch(url, canonical)) {
          type = 'www-non-www';
        } else if (this.isTrailingSlashMismatch(url, canonical)) {
          type = 'trailing-slash';
        }

        conflicts.push({
          url,
          declaredCanonical: canonical,
          expectedCanonical: expected,
          type,
        });
      }
    });

    return conflicts;
  }

  // ==========================================================================
  // AUTO-FIX SUGGESTIONS
  // ==========================================================================

  /**
   * Generate auto-fix suggestions for detected issues
   */
  generateAutoFixes(issues: PageIssue[]): AutoFix[] {
    const fixes: AutoFix[] = [];

    issues.forEach((issue) => {
      if (!issue.autoFixable) return;

      switch (issue.type) {
        case 'redirect-chain':
          fixes.push({
            type: 'redirect-update',
            description: 'Update redirect to point directly to final destination',
            action: issue.suggestedFix!,
          });
          break;

        case 'canonical-mismatch':
          fixes.push({
            type: 'canonical-update',
            description: 'Update canonical tag to match expected URL',
            action: issue.suggestedFix!,
          });
          break;

        case 'orphaned-page':
          fixes.push({
            type: 'internal-link-add',
            description: 'Add internal link from related page',
            action: issue.suggestedFix!,
          });
          break;

        case 'sitemap-missing':
          fixes.push({
            type: 'sitemap-add',
            description: 'Add page to sitemap',
            action: issue.suggestedFix!,
          });
          break;
      }
    });

    return fixes;
  }

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  /**
   * Generate comprehensive crawl report
   */
  generateReport(): CrawlReport {
    const orphanedPages = this.findOrphanedPages();
    const redirectChains = this.findRedirectChains();

    let critical = 0;
    let warning = 0;
    let info = 0;

    this.pages.forEach((page) => {
      page.issues.forEach((issue) => {
        switch (issue.severity) {
          case 'critical':
            critical++;
            break;
          case 'warning':
            warning++;
            break;
          case 'info':
            info++;
            break;
        }
      });
    });

    return {
      tenantId: this.tenantId,
      generatedAt: new Date().toISOString(),
      totalPages: this.pages.size,
      indexablePages: Array.from(this.pages.values()).filter((p) => p.indexable).length,
      issues: { critical, warning, info },
      pages: Array.from(this.pages.values()),
      summary: {
        orphanedPages,
        redirectChains,
        canonicalConflicts: [],
        duplicateGroups: [],
        slowPages: Array.from(this.pages.values())
          .filter((p) => p.metrics.responseTime > 3000)
          .map((p) => p.url),
        brokenLinks: [],
      },
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private isHomepage(url: string): boolean {
    const path = new URL(url).pathname;
    return path === '/' || path === '';
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash (except for root)
      let path = parsed.pathname;
      if (path !== '/' && path.endsWith('/')) {
        path = path.slice(0, -1);
      }
      return `${parsed.protocol}//${parsed.host}${path}`;
    } catch {
      return url;
    }
  }

  private isDifferentDomain(url1: string, url2: string): boolean {
    try {
      return new URL(url1).host !== new URL(url2).host;
    } catch {
      return false;
    }
  }

  private isHttpMismatch(url1: string, url2: string): boolean {
    try {
      const p1 = new URL(url1).protocol;
      const p2 = new URL(url2).protocol;
      return p1 !== p2;
    } catch {
      return false;
    }
  }

  private isWwwMismatch(url1: string, url2: string): boolean {
    try {
      const h1 = new URL(url1).host;
      const h2 = new URL(url2).host;
      return (
        (h1.startsWith('www.') && !h2.startsWith('www.')) ||
        (!h1.startsWith('www.') && h2.startsWith('www.'))
      );
    } catch {
      return false;
    }
  }

  private isTrailingSlashMismatch(url1: string, url2: string): boolean {
    try {
      const p1 = new URL(url1).pathname;
      const p2 = new URL(url2).pathname;
      return (
        (p1.endsWith('/') && !p2.endsWith('/')) ||
        (!p1.endsWith('/') && p2.endsWith('/'))
      );
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // PUBLIC API FOR ADDING DATA
  // ==========================================================================

  addPage(result: PageAuditResult): void {
    this.pages.set(result.url, result);
  }

  addInternalLink(source: string, target: string): void {
    if (!this.internalLinks.has(source)) {
      this.internalLinks.set(source, new Set());
    }
    this.internalLinks.get(source)!.add(target);
  }

  addRedirect(source: string, target: string): void {
    this.redirects.set(source, target);
  }
}

// =============================================================================
// AUTO-FIX TYPES
// =============================================================================

export interface AutoFix {
  type:
    | 'redirect-update'
    | 'canonical-update'
    | 'internal-link-add'
    | 'sitemap-add'
    | 'robots-update'
    | 'noindex-remove';
  description: string;
  action: string;
}

// =============================================================================
// ALERT SYSTEM
// =============================================================================

export interface CrawlAlert {
  id: string;
  tenantId: string;
  type: 'critical' | 'warning';
  issueType: IssueType;
  message: string;
  affectedUrls: string[];
  createdAt: string;
  acknowledged: boolean;
  autoFixed: boolean;
}

/**
 * Generate alerts for critical crawl issues
 */
export function generateCrawlAlerts(report: CrawlReport): CrawlAlert[] {
  const alerts: CrawlAlert[] = [];

  // Alert for redirect chains
  if (report.summary.redirectChains.length > 0) {
    alerts.push({
      id: `alert-redirect-chains-${Date.now()}`,
      tenantId: report.tenantId,
      type: 'warning',
      issueType: 'redirect-chain',
      message: `Found ${report.summary.redirectChains.length} redirect chains. Consider consolidating to direct redirects.`,
      affectedUrls: report.summary.redirectChains.map((c) => c.start),
      createdAt: new Date().toISOString(),
      acknowledged: false,
      autoFixed: false,
    });
  }

  // Alert for orphaned pages
  if (report.summary.orphanedPages.length > 10) {
    alerts.push({
      id: `alert-orphaned-${Date.now()}`,
      tenantId: report.tenantId,
      type: 'warning',
      issueType: 'orphaned-page',
      message: `Found ${report.summary.orphanedPages.length} orphaned pages with no internal links.`,
      affectedUrls: report.summary.orphanedPages,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      autoFixed: false,
    });
  }

  // Alert for slow pages
  if (report.summary.slowPages.length > 0) {
    alerts.push({
      id: `alert-slow-pages-${Date.now()}`,
      tenantId: report.tenantId,
      type: 'warning',
      issueType: 'slow-response',
      message: `Found ${report.summary.slowPages.length} pages with response time > 3 seconds.`,
      affectedUrls: report.summary.slowPages,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      autoFixed: false,
    });
  }

  // Alert for broken links
  if (report.summary.brokenLinks.length > 0) {
    alerts.push({
      id: `alert-broken-links-${Date.now()}`,
      tenantId: report.tenantId,
      type: 'critical',
      issueType: 'broken-internal-link',
      message: `Found ${report.summary.brokenLinks.length} broken internal links.`,
      affectedUrls: report.summary.brokenLinks.map((l) => l.sourceUrl),
      createdAt: new Date().toISOString(),
      acknowledged: false,
      autoFixed: false,
    });
  }

  return alerts;
}
