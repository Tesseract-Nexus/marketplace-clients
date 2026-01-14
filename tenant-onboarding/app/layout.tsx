import type { Metadata } from "next";
import { Toaster } from 'sonner';
import { ErrorBoundary } from '../components/errors/ErrorBoundary';
import { PostHogProvider } from '../lib/analytics/posthog';
import { ThemeProvider } from '../components/theme-provider';
import "./globals.css";

export const metadata: Metadata = {
  title: "Tesseract Hub - Tenant Onboarding",
  description: "Self-service tenant onboarding for Tesseract Hub e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <ErrorBoundary>
              {children}
              <Toaster position="top-right" richColors />
            </ErrorBoundary>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
