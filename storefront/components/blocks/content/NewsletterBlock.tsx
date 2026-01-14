'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { NewsletterBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function NewsletterBlock({ config }: BlockComponentProps<NewsletterBlockConfig>) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setEmail('');
        setName('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to subscribe');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <section className={cn(
        'py-12 md:py-16',
        config.backgroundStyle === 'gradient' && 'bg-gradient-to-r from-tenant-primary to-tenant-secondary',
        config.backgroundStyle === 'solid' && 'bg-tenant-primary'
      )}>
        <div className="container-tenant">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <CheckCircle className={cn(
              'w-16 h-16 mx-auto mb-4',
              config.backgroundStyle ? 'text-white' : 'text-green-500'
            )} />
            <h3 className={cn(
              'text-2xl font-bold mb-2',
              config.backgroundStyle && 'text-white'
            )}>
              <TranslatedUIText text={config.successTitle || 'You\'re subscribed!'} />
            </h3>
            <p className={cn(
              'text-muted-foreground',
              config.backgroundStyle && 'text-white/80'
            )}>
              <TranslatedUIText text={config.successMessage || 'Thank you for subscribing to our newsletter.'} />
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // Banner variant
  if (config.variant === 'banner') {
    return (
      <section className="py-4 bg-tenant-primary text-white">
        <div className="container-tenant">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span className="font-medium">
                <TranslatedUIText text={config.title} />
              </span>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.placeholder || 'Enter your email'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 w-64"
                required
              />
              <Button type="submit" variant="secondary" disabled={isSubmitting}>
                <TranslatedUIText text={config.buttonText || 'Subscribe'} />
              </Button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Card/inline variant
  return (
    <section className={cn(
      'py-12 md:py-16',
      config.backgroundStyle === 'gradient' && 'bg-gradient-to-r from-tenant-primary to-tenant-secondary',
      config.backgroundStyle === 'solid' && 'bg-tenant-primary',
      config.backgroundStyle === 'pattern' && 'bg-muted/50'
    )}>
      <div className="container-tenant">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn(
            'max-w-2xl mx-auto text-center',
            config.variant === 'card' && 'bg-background rounded-2xl p-8 shadow-lg'
          )}
        >
          <Mail className={cn(
            'w-12 h-12 mx-auto mb-4',
            config.backgroundStyle && config.variant !== 'card' ? 'text-white' : 'text-tenant-primary'
          )} />

          <h2 className={cn(
            'text-2xl sm:text-3xl font-bold mb-3',
            config.backgroundStyle && config.variant !== 'card' && 'text-white'
          )}>
            <TranslatedUIText text={config.title} />
          </h2>

          {config.subtitle && (
            <p className={cn(
              'text-muted-foreground mb-2',
              config.backgroundStyle && config.variant !== 'card' && 'text-white/80'
            )}>
              <TranslatedUIText text={config.subtitle} />
            </p>
          )}

          {config.description && (
            <p className={cn(
              'text-sm text-muted-foreground mb-6',
              config.backgroundStyle && config.variant !== 'card' && 'text-white/70'
            )}>
              <TranslatedUIText text={config.description} />
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {config.showNameField && (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  config.backgroundStyle && config.variant !== 'card' && 'bg-white/10 border-white/20 text-white placeholder:text-white/60'
                )}
              />
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.placeholder || 'Enter your email'}
                className={cn(
                  'flex-1',
                  config.backgroundStyle && config.variant !== 'card' && 'bg-white/10 border-white/20 text-white placeholder:text-white/60'
                )}
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  config.backgroundStyle && config.variant !== 'card' && 'bg-white text-tenant-primary hover:bg-white/90'
                )}
              >
                {isSubmitting ? 'Subscribing...' : (
                  <>
                    <TranslatedUIText text={config.buttonText || 'Subscribe'} />
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>

          {config.privacyText && (
            <p className={cn(
              'text-xs text-muted-foreground mt-4',
              config.backgroundStyle && config.variant !== 'card' && 'text-white/60'
            )}>
              <TranslatedUIText text={config.privacyText} />{' '}
              {config.privacyUrl && (
                <a href={config.privacyUrl} className="underline">Privacy Policy</a>
              )}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default NewsletterBlock;
