'use client';

/**
 * ThemeLoadingSkeleton - A branded skeleton loader shown while tenant styles initialize
 *
 * This component uses CSS variables that are already injected server-side,
 * so it displays with the correct tenant colors even during the initial load.
 */
export function ThemeLoadingSkeleton() {
  return (
    <div className="theme-skeleton min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container-tenant h-full flex items-center justify-between px-4">
          {/* Logo placeholder */}
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />

          {/* Nav links placeholder */}
          <div className="hidden md:flex items-center gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-16 rounded bg-muted animate-pulse" />
            ))}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </header>

      {/* Hero section skeleton */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        {/* Animated gradient background using tenant colors */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(135deg, var(--tenant-primary, #8B5CF6) 0%, var(--tenant-secondary, #EC4899) 100%)'
          }}
        />

        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

        {/* Content skeleton */}
        <div className="container-tenant relative z-10 py-16 px-4">
          <div className="max-w-2xl space-y-6">
            {/* Badge */}
            <div className="h-8 w-48 rounded-full bg-muted/50 animate-pulse" />

            {/* Title */}
            <div className="space-y-3">
              <div className="h-12 w-full max-w-xl rounded-lg bg-muted/50 animate-pulse" />
              <div className="h-12 w-3/4 rounded-lg bg-muted/50 animate-pulse" />
            </div>

            {/* Subtitle */}
            <div className="h-6 w-full max-w-md rounded bg-muted/40 animate-pulse" />

            {/* CTA buttons */}
            <div className="flex gap-4 pt-4">
              <div
                className="h-12 w-36 rounded-lg animate-pulse"
                style={{ background: 'var(--tenant-primary, #8B5CF6)', opacity: 0.5 }}
              />
              <div className="h-12 w-36 rounded-lg bg-muted/30 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Products grid skeleton */}
      <section className="py-16 px-4">
        <div className="container-tenant">
          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-card border border-border/50">
                {/* Image placeholder */}
                <div className="aspect-square bg-muted animate-pulse" />

                {/* Content placeholder */}
                <div className="p-4 space-y-2">
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-20 rounded bg-muted animate-pulse mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loading indicator at bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg">
          <div
            className="h-2 w-2 rounded-full animate-bounce"
            style={{
              background: 'var(--tenant-primary, #8B5CF6)',
              animationDelay: '0ms'
            }}
          />
          <div
            className="h-2 w-2 rounded-full animate-bounce"
            style={{
              background: 'var(--tenant-primary, #8B5CF6)',
              animationDelay: '150ms'
            }}
          />
          <div
            className="h-2 w-2 rounded-full animate-bounce"
            style={{
              background: 'var(--tenant-primary, #8B5CF6)',
              animationDelay: '300ms'
            }}
          />
        </div>
      </div>
    </div>
  );
}
