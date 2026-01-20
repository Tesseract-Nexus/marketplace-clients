import Image from 'next/image';
import { Clock, Mail, Bell } from 'lucide-react';

interface ComingSoonPageProps {
  storeName: string;
  logoUrl?: string | null;
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  isPreviewMode?: boolean;
}

/**
 * Coming Soon page displayed for unpublished storefronts
 * Uses the store's theme colors and logo for branding consistency
 */
export function ComingSoonPage({
  storeName,
  logoUrl,
  themeConfig,
  isPreviewMode = false,
}: ComingSoonPageProps) {
  const primaryColor = themeConfig?.primaryColor || '#8B5CF6';
  const secondaryColor = themeConfig?.secondaryColor || '#EC4899';
  const accentColor = themeConfig?.accentColor || '#F59E0B';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 50%, ${accentColor}05 100%)`,
      }}
    >
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div
          className="fixed top-0 left-0 right-0 py-2 px-4 text-center text-sm font-medium text-white z-50"
          style={{ backgroundColor: accentColor }}
        >
          Preview Mode - This store is not yet published. Only you can see this preview.
        </div>
      )}

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ backgroundColor: secondaryColor }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo */}
        {logoUrl ? (
          <div className="mb-8">
            <Image
              src={logoUrl}
              alt={storeName}
              width={120}
              height={120}
              className="mx-auto object-contain"
            />
          </div>
        ) : (
          <div
            className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <span className="text-4xl font-bold text-white">
              {storeName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Store Name */}
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ color: primaryColor }}
        >
          {storeName}
        </h1>

        {/* Coming Soon Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
          }}
        >
          <Clock className="w-4 h-4" />
          <span className="font-medium">Coming Soon</span>
        </div>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
          We&apos;re working hard to bring you an amazing shopping experience.
          <br className="hidden md:block" />
          Our store will be launching soon!
        </p>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100">
            <div
              className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <span style={{ color: primaryColor }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Quality Products</h3>
            <p className="text-sm text-gray-500">Curated selection of premium items</p>
          </div>

          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100">
            <div
              className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${secondaryColor}15` }}
            >
              <span style={{ color: secondaryColor }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Fast Shipping</h3>
            <p className="text-sm text-gray-500">Quick and reliable delivery</p>
          </div>

          <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-100">
            <div
              className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <span style={{ color: accentColor }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Secure Shopping</h3>
            <p className="text-sm text-gray-500">Safe and protected transactions</p>
          </div>
        </div>

        {/* Notify Me Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bell className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="text-xl font-semibold text-gray-800">Get Notified</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Be the first to know when we launch. Enter your email below.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                disabled
              />
            </div>
            <button
              type="button"
              className="px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
              disabled
            >
              Notify Me
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-3">
            Email notifications coming soon
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-12 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
