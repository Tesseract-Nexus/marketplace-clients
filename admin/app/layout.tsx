import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { AuthProvider } from "@/lib/auth";
import { CsrfTokenInitializer } from "@/hooks/useCsrfToken";

export const metadata: Metadata = {
  title: "Admin Panel - Tesserix",
  description: "Multi-tenant ecommerce admin panel",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <CsrfTokenInitializer>
              <ThemeProvider>
                <DialogProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </DialogProvider>
              </ThemeProvider>
            </CsrfTokenInitializer>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
