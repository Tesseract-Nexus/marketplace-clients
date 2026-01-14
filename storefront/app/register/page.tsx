'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Check, Sparkles, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { initiateLogin, directRegister, DirectAuthResponse } from '@/lib/api/auth';
import { SocialLogin } from '@/components/auth/SocialLogin';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const floatingVariants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const { login, setLoading, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');

  const handleSocialLogin = (provider: string) => {
    // Use auth-bff OIDC flow with Keycloak IDP hint for social login
    const returnTo = getNavPath('/account');
    // Pass tenant context for multi-tenant authentication
    initiateLogin({
      returnTo,
      provider,
      tenantId: tenant?.id,
      tenantSlug: tenant?.slug,
    });
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.test(formData.password));
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  // Calculate password strength percentage
  const passwordStrength = useMemo(() => {
    const metRequirements = passwordRequirements.filter((req) => req.test(formData.password)).length;
    return (metRequirements / passwordRequirements.length) * 100;
  }, [formData.password]);

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (!tenant?.slug) {
      setError('Unable to determine store. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Use direct registration via auth-bff (custom UI without Keycloak redirect)
      const result = await directRegister(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        tenant.slug,
        formData.phone || undefined
      );

      if (result.success && (result.registered || result.authenticated)) {
        // Registration successful - update auth store with user info
        if (result.user) {
          login({
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.first_name || '',
            lastName: result.user.last_name || '',
            phone: '',
            createdAt: new Date().toISOString(),
            tenantId: result.user.tenant_id,
          });
        }

        // Redirect to account page
        router.push(getNavPath('/account'));
      } else {
        // Registration failed - show error message
        setError(result.message || 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decorations with floating animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/5 via-background to-[var(--tenant-secondary)]/5" />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        className="absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--tenant-secondary)' }}
      />
      <motion.div
        variants={floatingVariants}
        animate="animate"
        transition={{ delay: 1.5 }}
        className="absolute bottom-20 right-20 w-72 h-72 rounded-full blur-3xl opacity-20"
        style={{ background: 'var(--tenant-primary)' }}
      />

      {/* Decorative elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute top-1/3 right-1/4"
      >
        <Sparkles className="h-5 w-5 text-tenant-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-1/4 left-1/3"
      >
        <Shield className="h-6 w-6 text-tenant-secondary" />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-lg relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="bg-card/80 backdrop-blur-sm rounded-2xl border shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300"
        >
          {/* Header with animated icon */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <User className="h-8 w-8 text-tenant-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold"><TranslatedUIText text="Create Account" /></h1>
            <p className="text-muted-foreground mt-2">
              <TranslatedUIText text="Join us and start shopping today" />
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                >
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName"><TranslatedUIText text="First Name" /> *</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                    required
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName"><TranslatedUIText text="Last Name" /> *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  className="transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                  required
                  autoComplete="family-name"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="email"><TranslatedUIText text="Email Address" /> *</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange('email')}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                  required
                  autoComplete="email"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="phone"><TranslatedUIText text="Phone Number (Optional)" /></Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                  autoComplete="tel"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="password"><TranslatedUIText text="Password" /> *</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-[var(--tenant-primary)]/20"
                  required
                  autoComplete="new-password"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </motion.button>
              </div>

              {/* Password strength meter */}
              <AnimatePresence>
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 mt-3"
                  >
                    {/* Strength bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground"><TranslatedUIText text="Password strength" /></span>
                        <motion.span
                          key={getStrengthLabel()}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'font-medium',
                            passwordStrength <= 25 && 'text-red-500',
                            passwordStrength > 25 && passwordStrength <= 50 && 'text-orange-500',
                            passwordStrength > 50 && passwordStrength <= 75 && 'text-yellow-500',
                            passwordStrength > 75 && 'text-green-500'
                          )}
                        >
                          {getStrengthLabel()}
                        </motion.span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', getStrengthColor())}
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Requirements checklist */}
                    <div className="grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, index) => (
                        <motion.div
                          key={req.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            'flex items-center gap-1.5 text-xs transition-colors duration-200',
                            req.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                          )}
                        >
                          <motion.div
                            initial={false}
                            animate={req.test(formData.password) ? 'visible' : 'hidden'}
                            variants={checkVariants}
                          >
                            <Check className="h-3 w-3" />
                          </motion.div>
                          <span className={cn(!req.test(formData.password) && 'ml-[14px]')}>
                            {req.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <Label htmlFor="confirmPassword"><TranslatedUIText text="Confirm Password" /> *</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-tenant-primary" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className={cn(
                    'pl-10 transition-all duration-200',
                    formData.confirmPassword &&
                      (passwordsMatch
                        ? 'border-green-500 focus-visible:ring-green-500 ring-2 ring-green-500/20'
                        : 'border-red-500 focus-visible:ring-red-500 ring-2 ring-red-500/20')
                  )}
                  required
                  autoComplete="new-password"
                />
                {formData.confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {passwordsMatch ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-red-500"><TranslatedUIText text="No match" /></span>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Separator className="my-4" />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing"
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(checked as boolean)}
                  className="mt-0.5 data-[state=checked]:bg-tenant-primary data-[state=checked]:border-tenant-primary"
                />
                <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer leading-relaxed">
                  <TranslatedUIText text="I'd like to receive exclusive offers, discounts, and updates via email" />
                </Label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5 data-[state=checked]:bg-tenant-primary data-[state=checked]:border-tenant-primary"
                  required
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                  <TranslatedUIText text="I agree to the" />{' '}
                  <Link href={getNavPath('/terms')} className="text-tenant-primary hover:underline transition-colors">
                    <TranslatedUIText text="Terms of Service" />
                  </Link>{' '}
                  <TranslatedUIText text="and" />{' '}
                  <Link href={getNavPath('/privacy')} className="text-tenant-primary hover:underline transition-colors">
                    <TranslatedUIText text="Privacy Policy" />
                  </Link>{' '}
                  *
                </Label>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                type="submit"
                variant="tenant-gradient"
                size="lg"
                className="w-full"
                disabled={isLoading || !acceptTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <TranslatedUIText text="Creating account..." />
                  </>
                ) : (
                  <TranslatedUIText text="Create Account" />
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={itemVariants} className="mt-6">
            <SocialLogin onLogin={handleSocialLogin} isLoading={isLoading} mode="register" />
          </motion.div>

          <motion.p variants={itemVariants} className="text-center mt-6 text-sm text-muted-foreground">
            <TranslatedUIText text="Already have an account?" />{' '}
            <Link
              href={getNavPath('/login')}
              className="text-tenant-primary font-medium hover:underline transition-all"
            >
              <TranslatedUIText text="Sign in" />
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
