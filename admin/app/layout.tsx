import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { QueryProvider } from "@/contexts/QueryProvider";
import { AuthProvider } from "@/lib/auth";

export const metadata = {
  title: "Admin Panel - Ecommerce Hub",
  description: "Multi-tenant ecommerce admin panel",
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
            <ThemeProvider>
              <DialogProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </DialogProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
