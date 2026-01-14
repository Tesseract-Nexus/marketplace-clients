'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Phone, MessageCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../lib/store/auth-store';
import { authApi } from '../../lib/api/auth';
import { locationApi, type Country } from '../../lib/api/location';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewUser: boolean) => void;
  mode?: 'signin' | 'signup';
}

type AuthStep = 'method' | 'phone' | 'otp';

export function AuthModal({ isOpen, onClose, onSuccess, mode = 'signin' }: AuthModalProps) {
  const { setUser, setLoading, setError, isLoading, error } = useAuthStore();

  const [step, setStep] = useState<AuthStep>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [callingCode, setCallingCode] = useState('+1');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpMethod, setOtpMethod] = useState<'sms' | 'whatsapp'>('sms');
  const [countries, setCountries] = useState<Country[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load countries
  useEffect(() => {
    locationApi.getCountries().then(setCountries).catch(() => {});
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('method');
      setPhoneNumber('');
      setOtp(['', '', '', '', '', '']);
      setLocalError(null);
    }
  }, [isOpen]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find(c => c.id === e.target.value);
    if (country) {
      setCountryCode(country.id);
      setCallingCode(country.calling_code || '');
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const handleFacebookLogin = () => {
    setLoading(true);
    window.location.href = authApi.getFacebookAuthUrl();
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      setLocalError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      await authApi.sendOtp({
        phone: phoneNumber,
        countryCode,
        method: otpMethod,
      });
      setStep('otp');
      setCountdown(60);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setLocalError('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      // Call OTP verification endpoint - this should create a BFF session
      // via secure HttpOnly cookies (no client-side token storage)
      const response = await authApi.verifyOtp({
        phone: phoneNumber,
        countryCode,
        otp: otpValue,
      });

      // Note: Auth session is managed by BFF with secure cookies
      // The verifyOtp endpoint creates a session server-side

      setUser({
        id: response.user.id,
        phone: response.user.phone,
        provider: response.user.provider,
        onboardingComplete: response.user.onboardingComplete,
        createdAt: new Date().toISOString(),
      });

      onSuccess(response.isNewUser);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      document.getElementById(`otp-${nextIndex}`)?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, '');
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          {step !== 'method' && (
            <button
              onClick={() => setStep(step === 'otp' ? 'phone' : 'method')}
              className="absolute left-6 top-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-white" />
            </button>
          )}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-8">
          {/* Method Selection */}
          {step === 'method' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">T</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {mode === 'signin'
                    ? 'Sign in to your account'
                    : 'Create your account to start selling'}
                </p>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <button
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-[#1877F2] rounded-xl font-medium text-white hover:bg-[#166FE5] transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Phone/WhatsApp Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setOtpMethod('sms'); setStep('phone'); }}
                  className="h-14 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Phone
                </button>
                <button
                  onClick={() => { setOtpMethod('whatsapp'); setStep('phone'); }}
                  className="h-14 flex items-center justify-center gap-2 bg-[#25D366]/10 rounded-xl font-medium text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-blue-500 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-500 hover:underline">Privacy Policy</a>
              </p>
            </div>
          )}

          {/* Phone Number Entry */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="text-center pt-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  otpMethod === 'whatsapp' ? 'bg-[#25D366]' : 'bg-blue-500'
                }`}>
                  {otpMethod === 'whatsapp' ? (
                    <MessageCircle className="w-8 h-8 text-white" />
                  ) : (
                    <Phone className="w-8 h-8 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Enter your phone number
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  We'll send you a verification code via {otpMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <select
                    value={countryCode}
                    onChange={handleCountryChange}
                    className="w-28 h-14 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.flag_emoji} {c.calling_code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Phone number"
                    className="flex-1 h-14 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {localError && (
                  <p className="text-sm text-red-500">{localError}</p>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={isLoading || !phoneNumber}
                  className={`w-full h-14 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                    otpMethod === 'whatsapp'
                      ? 'bg-[#25D366] hover:bg-[#20BD5A]'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Send Code</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center pt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Verify your number
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Enter the 6-digit code sent to {callingCode}{phoneNumber}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>

                {localError && (
                  <p className="text-sm text-center text-red-500">{localError}</p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.join('').length !== 6}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Verify & Continue</>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Didn't receive the code?{' '}
                  <button
                    onClick={handleResendOtp}
                    disabled={countdown > 0}
                    className="text-blue-500 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
