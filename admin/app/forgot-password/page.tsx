'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push('/auth/login?prompt=login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-20">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
          alt="Background"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Animated elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/100/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md px-4 py-8 mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 space-y-5 animate-fade-in-up">
          {/* Header */}
          <div className="text-center relative">
            <button
              onClick={handleBackToLogin}
              className="absolute -top-1 -left-1 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-3">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-1">
              Tesseract Hub
            </h1>
            <p className="text-xs text-muted-foreground mb-4">Admin Portal</p>
            <h2 className="text-xl font-semibold text-foreground mb-1">Reset Password</h2>
            <p className="text-sm text-muted-foreground">
              Password resets are handled by Keycloak. Continue to the login screen and use the
              identity provider's reset flow.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-accent px-4 py-3 text-left text-sm text-primary">
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <span>Use the "Forgot Password" link on the Keycloak login page.</span>
          </div>

          <Button
            onClick={handleBackToLogin}
            className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300"
          >
            Continue to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
