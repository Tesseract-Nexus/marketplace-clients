# CI Failure Logs — Recent Failures (as of 2026-02-07)

## 1. Storefront — CI Build Failure

- **Run ID**: 21659711674
- **Date**: 2026-02-04T05:25:41Z
- **Branch**: main
- **Workflow**: Storefront - CI Build
- **Failed Job**: Build and Push Storefront

### Root Cause

**Turbopack build error — missing module**

```
Error: Turbopack build failed with 1 errors:
./components/providers/ThemeProvider.tsx:8:1
Module not found: Can't resolve '@/components/notifications'

>  8 | import { PushNotificationProvider } from '@/components/notifications';
```

`ThemeProvider.tsx` imports `PushNotificationProvider` from `@/components/notifications`,
but that module does not exist (was likely removed or renamed without updating the import).

### Full Error Context

```
#16 [builder 7/7] RUN if [ -f .env.production ]; then set -a && . .env.production && set +a; fi && npm run build
#16 0.442 > @ecommerce/storefront@0.1.0 build
#16 0.442 > next build
#16 1.349    ▲ Next.js 16.0.10 (Turbopack)
#16 1.349    - Environments: .env.production
#16 1.352  ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
#16 1.417    Creating an optimized production build ...
#16 39.90 > Build error occurred
#16 39.90 Error: Turbopack build failed with 1 errors:
#16 39.90 ./components/providers/ThemeProvider.tsx:8:1
#16 39.90 Module not found: Can't resolve '@/components/notifications'
#16 39.90   6 | import { generateCssVariables, isDarkTheme, isEditorialTheme } from '@/lib/theme/theme-utils';
#16 39.90   7 | import { loadFonts } from '@/lib/theme/fonts';
#16 39.90 > 8 | import { PushNotificationProvider } from '@/components/notifications';
```

### Additional Warnings

- `[baseline-browser-mapping]` data is over two months old — suggests running `npm i baseline-browser-mapping@latest -D`
- `middleware` file convention is deprecated — Next.js recommends migrating to `proxy`

---

## 2. Admin Portal — CI Build Failure

- **Run ID**: 21659049182
- **Date**: 2026-02-04T04:53:38Z
- **Branch**: main
- **Workflow**: Admin Portal - CI Build
- **Failed Job**: Build and Push Admin Portal

### Root Cause

**Docker registry timeout — transient network error**

```
##[error]Error response from daemon: Get "https://ghcr.io/v2/":
net/http: request canceled while waiting for connection
(Client.Timeout exceeded while awaiting headers)
```

The GitHub Actions runner failed to connect to `ghcr.io` (GitHub Container Registry)
during the Docker build step. This is a transient infrastructure issue, not a code problem.

### Resolution

No code fix needed — this was a network timeout on the CI runner. Re-running the workflow
resolves it. Both Admin and Storefront CI builds are currently passing on main.

---

## Summary

| # | Workflow | Date | Root Cause | Actionable? |
|---|----------|------|------------|-------------|
| 1 | Storefront CI | Feb 4 | Missing `@/components/notifications` module | Yes — was fixed in a subsequent commit |
| 2 | Admin CI | Feb 4 | GHCR network timeout | No — transient infra issue |
