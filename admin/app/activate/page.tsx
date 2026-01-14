'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  UserPlus,
  Shield,
  Mail,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  InvitationVerifyResponse,
  StaffActivationRequest,
  StaffActivationResponse,
  StaffAuthMethod,
} from '@/lib/api/staffAuthTypes';

type ActivationStep = 'loading' | 'choose-method' | 'password' | 'success' | 'error';

function ActivatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // State
  const [step, setStep] = useState<ActivationStep>('loading');
  const [invitationData, setInvitationData] = useState<InvitationVerifyResponse | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const passwordErrors = {
    minLength: password.length < 8,
    hasUppercase: !/[A-Z]/.test(password),
    hasLowercase: !/[a-z]/.test(password),
    hasNumber: !/[0-9]/.test(password),
    hasSpecial: !/[!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password !== confirmPassword && confirmPassword.length > 0,
  };

  const isPasswordValid =
    !passwordErrors.minLength &&
    !passwordErrors.hasUppercase &&
    !passwordErrors.hasLowercase &&
    !passwordErrors.hasNumber &&
    !passwordErrors.hasSpecial &&
    !passwordErrors.match &&
    password.length > 0 &&
    confirmPassword.length > 0;

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('No activation token provided. Please check your invitation email.');
      setStep('error');
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/staff/auth/invitation/verify?token=${encodeURIComponent(token || '')}`);
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.message || 'This invitation link is invalid or has expired.');
        setStep('error');
        return;
      }

      setInvitationData(data);
      setStep('choose-method');
    } catch (err) {
      setError('Failed to verify invitation. Please try again.');
      setStep('error');
    }
  };

  const handlePasswordActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const activationRequest: StaffActivationRequest = {
        token: token!,
        authMethod: 'password',
        password,
        confirmPassword,
      };

      const response = await fetch('/api/staff/auth/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activationRequest),
      });

      const data: StaffActivationResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to activate account. Please try again.');
        setIsLoading(false);
        return;
      }

      // Store tokens if provided
      if (data.accessToken) {
        localStorage.setItem('staff_access_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('staff_refresh_token', data.refreshToken);
        }
      }

      setStep('success');

      // Redirect to login after success
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOActivation = async (provider: 'google' | 'microsoft') => {
    setIsLoading(true);
    setError(null);

    // Redirect to SSO flow with activation token
    const params = new URLSearchParams();
    params.set('activation_token', token!);
    params.set('provider', provider);

    window.location.href = `/auth/login?${params.toString()}&kc_idp_hint=${provider}`;
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <div className="text-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Verifying invitation...</h2>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we verify your invitation link.</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Invitation Invalid</h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-700 hover:via-violet-700 hover:to-purple-700 text-white"
            >
              Go to Login
            </Button>
          </div>
        );

      case 'choose-method':
        return (
          <>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 shadow-lg shadow-primary/30 mb-3">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Welcome to the Team!</h2>
              {invitationData?.staff && (
                <p className="text-sm text-muted-foreground">
                  Hi {invitationData.staff.firstName}, set up your account to get started.
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {invitationData?.staff?.email}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Role: {invitationData?.staff?.role?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-center text-muted-foreground">Choose how to sign in:</p>

              {invitationData?.passwordAuthEnabled && (
                <Button
                  onClick={() => setStep('password')}
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 hover:border-primary hover:bg-primary/5"
                >
                  <KeyRound className="h-5 w-5" />
                  <span className="flex-1 text-left">Set up password</span>
                </Button>
              )}

              {invitationData?.googleEnabled && (
                <Button
                  onClick={() => handleSSOActivation('google')}
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 hover:border-primary hover:bg-primary/5"
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="flex-1 text-left">Continue with Google</span>
                </Button>
              )}

              {invitationData?.microsoftEnabled && (
                <Button
                  onClick={() => handleSSOActivation('microsoft')}
                  variant="outline"
                  className="w-full h-12 justify-start gap-3 hover:border-primary hover:bg-primary/5"
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M1 13h10v10H1z" />
                    <path fill="#7fba00" d="M13 1h10v10H13z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  <span className="flex-1 text-left">Continue with Microsoft</span>
                </Button>
              )}
            </div>
          </>
        );

      case 'password':
        return (
          <>
            <div className="text-center">
              <button
                onClick={() => setStep('choose-method')}
                className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 shadow-lg shadow-primary/30 mb-3">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-1">Create Password</h2>
              <p className="text-xs text-muted-foreground">Choose a strong password for your account</p>
            </div>

            <form onSubmit={handlePasswordActivation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 pr-10 h-12"
                    autoComplete="new-password"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="pl-10 pr-10 h-12"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                <div className="grid grid-cols-2 gap-1">
                  <RequirementItem met={!passwordErrors.minLength} text="8+ characters" />
                  <RequirementItem met={!passwordErrors.hasUppercase} text="Uppercase letter" />
                  <RequirementItem met={!passwordErrors.hasLowercase} text="Lowercase letter" />
                  <RequirementItem met={!passwordErrors.hasNumber} text="Number" />
                  <RequirementItem met={!passwordErrors.hasSpecial} text="Special character" />
                  <RequirementItem met={!passwordErrors.match} text="Passwords match" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 hover:from-blue-700 hover:via-violet-700 hover:to-purple-700 text-white shadow-lg shadow-primary/30 transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Activate Account'
                )}
              </Button>
            </form>
          </>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Account Activated!</h2>
            <p className="text-sm text-muted-foreground">Your account is ready. Redirecting to login...</p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-4" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-20">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
          alt="Marketplace background"
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-blue-900/50 to-violet-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Animated elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Activation card */}
      <div className="w-full max-w-md px-4 py-8 mx-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 space-y-5 animate-fade-in-up relative">
          {renderContent()}
        </div>

        <p className="text-center text-[10px] text-white/60 mt-4">
          &copy; 2026 Tesseract Hub. All rights reserved.
        </p>
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

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />
      )}
      <span className={`text-xs ${met ? 'text-green-600' : 'text-muted-foreground'}`}>{text}</span>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-violet-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="text-white/80">Loading...</p>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ActivatePageContent />
    </Suspense>
  );
}
