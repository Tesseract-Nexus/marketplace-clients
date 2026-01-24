'use client';

import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHomepageConfig } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface NewsletterSectionProps {
  title?: string;
  subtitle?: string;
}

export function NewsletterSection({ title, subtitle }: NewsletterSectionProps) {
  const homepageConfig = useHomepageConfig();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!homepageConfig.showNewsletter) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <section className="section-spacing">
      <div className="container-tenant">
        <div className="relative rounded-2xl overflow-hidden py-16 px-6 md:py-20 md:px-12 bg-gradient-to-br from-[var(--tenant-primary)]/10 via-[var(--tenant-secondary)]/5 to-[var(--tenant-accent)]/10">
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30"
            style={{ background: 'var(--tenant-primary)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-30"
            style={{ background: 'var(--tenant-secondary)' }}
          />
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-2xl border border-[var(--tenant-primary)]/20" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold mb-4"
            >
              <TranslatedUIText text={title || homepageConfig.newsletterTitle || 'Subscribe to our newsletter'} />
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mb-8"
            >
              <TranslatedUIText
                text={subtitle || homepageConfig.newsletterSubtitle ||
                  'Get updates on new products and exclusive offers'}
              />
            </motion.p>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-green-600"
              >
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
                <span className="font-medium">
                  <TranslatedUIText text="Thanks for subscribing!" />
                </span>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 px-4 bg-background"
                />
                <Button
                  type="submit"
                  variant="tenant-glow"
                  size="lg"
                  disabled={isLoading}
                  className="h-12 px-8"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <TranslatedUIText text="Subscribing..." />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <TranslatedUIText text="Subscribe" />
                      <Send className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </motion.form>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-xs text-muted-foreground mt-4"
            >
              <TranslatedUIText text="No spam, unsubscribe anytime. We respect your privacy." />
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
