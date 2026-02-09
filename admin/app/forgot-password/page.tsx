'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Sparkles, Loader2, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  lookupTenants,
  directRequestPasswordReset,
  type TenantInfo,
} from '@/lib/auth/auth-client';

type Step = 'email' | 'tenant-select' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await lookupTenants(email);

      if (!result.success || !result.data?.tenants?.length) {
        // Security: always show success even if email doesn't exist
        setStep('success');
        setIsLoading(false);
        return;
      }

      const userTenants = result.data.tenants;
      setTenants(userTenants);

      if (userTenants.length === 1) {
        // Auto-select single tenant and submit
        await submitResetRequest(email, userTenants[0].slug);
      } else {
        setStep('tenant-select');
      }
    } catch {
      // Security: show success even on errors
      setStep('success');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenantSelect = async (tenant: TenantInfo) => {
    setSelectedTenant(tenant);
    setIsLoading(true);
    await submitResetRequest(email, tenant.slug);
    setIsLoading(false);
  };

  const submitResetRequest = async (userEmail: string, tenantSlug: string) => {
    try {
      await directRequestPasswordReset(userEmail, tenantSlug);
    } catch {
      // Always show success to not reveal email existence
    }
    setStep('success');
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
          {step === 'email' && (
            <>
              <div className="text-center relative">
                <button
                  onClick={() => router.push('/login')}
                  className="absolute -top-1 -left-1 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-3">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-primary mb-1">Tesseract Hub</h1>
                <p className="text-xs text-muted-foreground mb-4">Admin Portal</p>
                <h2 className="text-xl font-semibold text-foreground mb-1">Reset Password</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </>
          )}

          {step === 'tenant-select' && (
            <>
              <div className="text-center relative">
                <button
                  onClick={() => setStep('email')}
                  className="absolute -top-1 -left-1 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-3">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Select Organization</h2>
                <p className="text-xs text-muted-foreground">Choose which organization to reset your password for</p>
                <p className="text-xs text-primary mt-1">{email}</p>
              </div>

              <div className="space-y-2">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => handleTenantSelect(tenant)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-4 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left group disabled:opacity-50"
                  >
                    {tenant.logo_url ? (
                      <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                    </div>
                    {isLoading && selectedTenant?.id === tenant.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-3">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Check Your Email</h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists with this email, you will receive a password reset link shortly.
                </p>
              </div>

              <Button
                onClick={() => router.push('/login')}
                className="w-full h-12 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all duration-300"
              >
                Back to Sign In
              </Button>
            </>
          )}

          {/* Branding Footer */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Powered by Tesserix</p>
            <p className="text-[10px] text-muted-foreground/60">v1.0.0</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-slow-zoom { animation: slow-zoom 30s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.6; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.7; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.9; }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float 10s ease-in-out infinite; animation-delay: 2s; }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}
