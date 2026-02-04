'use client';

import './skeleton-animations.css';

interface ThemeSkeletonProps {
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Header skeleton component
 */
function HeaderSkeleton() {
  return (
    <div
      style={{
        height: '64px',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--background, #fff)',
      }}
    >
      <div
        className="skeleton-pulse skeleton-shimmer"
        style={{
          height: '32px',
          width: '120px',
          borderRadius: '6px',
          background: 'var(--muted, #f1f5f9)',
        }}
      />
      <div style={{ display: 'flex', gap: '24px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton-pulse"
            style={{
              height: '16px',
              width: '60px',
              borderRadius: '4px',
              background: 'var(--muted, #f1f5f9)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          className="skeleton-pulse"
          style={{
            height: '36px',
            width: '36px',
            borderRadius: '50%',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
        <div
          className="skeleton-pulse"
          style={{
            height: '36px',
            width: '36px',
            borderRadius: '50%',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Hero section skeleton
 */
function HeroSkeleton({ primaryColor, secondaryColor }: ThemeSkeletonProps) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${primaryColor || '#8B5CF6'}15 0%, ${secondaryColor || '#EC4899'}15 100%)`,
      }}
    >
      <div style={{ padding: '64px 24px', maxWidth: '600px' }}>
        <div
          className="skeleton-pulse skeleton-shimmer"
          style={{
            height: '32px',
            width: '180px',
            borderRadius: '16px',
            marginBottom: '24px',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
        <div
          className="skeleton-pulse skeleton-shimmer"
          style={{
            height: '48px',
            width: '100%',
            maxWidth: '500px',
            borderRadius: '8px',
            marginBottom: '12px',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
        <div
          className="skeleton-pulse skeleton-shimmer"
          style={{
            height: '48px',
            width: '75%',
            borderRadius: '8px',
            marginBottom: '24px',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
        <div
          className="skeleton-pulse"
          style={{
            height: '24px',
            width: '300px',
            borderRadius: '4px',
            marginBottom: '32px',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            className="skeleton-pulse"
            style={{
              height: '48px',
              width: '140px',
              borderRadius: '8px',
              background: primaryColor || '#8B5CF6',
              opacity: 0.4,
            }}
          />
          <div
            className="skeleton-pulse"
            style={{
              height: '48px',
              width: '140px',
              borderRadius: '8px',
              background: 'var(--muted, #f1f5f9)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Product grid skeleton
 */
function ProductGridSkeleton() {
  return (
    <div style={{ padding: '64px 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div
          className="skeleton-pulse skeleton-shimmer"
          style={{
            height: '32px',
            width: '200px',
            borderRadius: '8px',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
        <div
          className="skeleton-pulse"
          style={{
            height: '16px',
            width: '80px',
            borderRadius: '4px',
            background: 'var(--muted, #f1f5f9)',
          }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '24px',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'var(--card, #fff)',
            }}
          >
            <div
              className="skeleton-pulse skeleton-shimmer"
              style={{
                aspectRatio: '1',
                background: 'var(--muted, #f1f5f9)',
              }}
            />
            <div style={{ padding: '16px' }}>
              <div
                className="skeleton-pulse"
                style={{
                  height: '12px',
                  width: '60px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  background: 'var(--muted, #f1f5f9)',
                }}
              />
              <div
                className="skeleton-pulse"
                style={{
                  height: '16px',
                  width: '100%',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  background: 'var(--muted, #f1f5f9)',
                }}
              />
              <div
                className="skeleton-pulse"
                style={{
                  height: '20px',
                  width: '80px',
                  borderRadius: '4px',
                  marginTop: '12px',
                  background: 'var(--muted, #f1f5f9)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading indicator at bottom of skeleton
 */
function LoadingIndicator({ primaryColor }: { primaryColor?: string }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '9999px',
        background: 'var(--background, #fff)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          style={{
            height: '8px',
            width: '8px',
            borderRadius: '50%',
            background: primaryColor || '#8B5CF6',
            animation: 'bounce 1s ease-in-out infinite',
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Main theme skeleton component
 * Shows a placeholder UI while the theme is loading
 */
export function ThemeSkeleton({ primaryColor, secondaryColor }: ThemeSkeletonProps) {
  return (
    <div id="theme-skeleton" style={{ display: 'none' }}>
      <HeaderSkeleton />
      <HeroSkeleton primaryColor={primaryColor} secondaryColor={secondaryColor} />
      <ProductGridSkeleton />
      <LoadingIndicator primaryColor={primaryColor} />
    </div>
  );
}

export default ThemeSkeleton;
