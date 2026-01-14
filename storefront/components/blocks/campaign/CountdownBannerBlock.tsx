'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useNavPath } from '@/context/TenantContext';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import type { CountdownBannerBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function CountdownBannerBlock({ config }: BlockComponentProps<CountdownBannerBlockConfig>) {
  const getNavPath = useNavPath();
  const { days, hours, minutes, seconds, isExpired } = useCountdown(config.countdown.endDate);

  // Handle expired state
  if (isExpired) {
    if (config.countdown.expiredAction === 'hide') return null;
    if (config.countdown.expiredAction === 'redirect' && config.countdown.expiredRedirectUrl) {
      if (typeof window !== 'undefined') {
        window.location.href = config.countdown.expiredRedirectUrl;
      }
      return null;
    }
  }

  const textColorClass = config.textColor === 'dark' ? 'text-gray-900' : 'text-white';
  const textColorMuted = config.textColor === 'dark' ? 'text-gray-600' : 'text-white/80';

  // Minimal variant
  if (config.variant === 'minimal') {
    return (
      <section className="py-6 bg-tenant-primary">
        <div className="container-tenant">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Timer className="w-6 h-6 text-white" />
              <div>
                <h3 className="text-lg font-bold text-white">
                  <TranslatedUIText text={config.title} />
                </h3>
                {config.subtitle && (
                  <p className="text-sm text-white/80">
                    <TranslatedUIText text={config.subtitle} />
                  </p>
                )}
              </div>
            </div>

            {!isExpired ? (
              <div className="flex items-center gap-4">
                <CountdownDisplay
                  days={days}
                  hours={hours}
                  minutes={minutes}
                  seconds={seconds}
                  config={config.countdown}
                  variant="compact"
                />
                {config.cta && (
                  <Button asChild variant="secondary" className="bg-white text-tenant-primary">
                    <Link href={getNavPath(config.cta.href)}>
                      <TranslatedUIText text={config.cta.label} />
                    </Link>
                  </Button>
                )}
              </div>
            ) : config.countdown.expiredMessage ? (
              <p className="text-white">{config.countdown.expiredMessage}</p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  // Immersive variant
  if (config.variant === 'immersive') {
    return (
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background */}
        {config.backgroundMedia?.url ? (
          <>
            <Image
              src={config.backgroundMedia.url}
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-tenant-primary to-tenant-secondary" />
        )}

        {/* Content */}
        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center text-white"
          >
            <Timer className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              <TranslatedUIText text={config.title} />
            </h2>
            {config.subtitle && (
              <p className="text-xl mb-2 text-white/90">
                <TranslatedUIText text={config.subtitle} />
              </p>
            )}
            {config.description && (
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                <TranslatedUIText text={config.description} />
              </p>
            )}

            {!isExpired ? (
              <>
                <div className="mb-8">
                  <CountdownDisplay
                    days={days}
                    hours={hours}
                    minutes={minutes}
                    seconds={seconds}
                    config={config.countdown}
                    variant="large"
                  />
                </div>
                {config.cta && (
                  <Button asChild size="xl" variant="tenant-gradient">
                    <Link href={getNavPath(config.cta.href)}>
                      <TranslatedUIText text={config.cta.label} />
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                )}
              </>
            ) : config.countdown.expiredMessage ? (
              <p className="text-xl">{config.countdown.expiredMessage}</p>
            ) : null}
          </motion.div>
        </div>
      </section>
    );
  }

  // Detailed variant (default)
  return (
    <section className={cn(
      'py-8 sm:py-12',
      !config.backgroundMedia?.url && 'bg-gradient-to-r from-tenant-primary to-tenant-secondary'
    )}>
      {config.backgroundMedia?.url && (
        <div className="absolute inset-0">
          <Image
            src={config.backgroundMedia.url}
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="container-tenant relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={textColorClass}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              <TranslatedUIText text={config.title} />
            </h2>
            {config.subtitle && (
              <p className={cn('text-lg mb-1', textColorMuted)}>
                <TranslatedUIText text={config.subtitle} />
              </p>
            )}
            {config.description && (
              <p className={cn('text-sm', textColorMuted)}>
                <TranslatedUIText text={config.description} />
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {!isExpired ? (
              <CountdownDisplay
                days={days}
                hours={hours}
                minutes={minutes}
                seconds={seconds}
                config={config.countdown}
                variant="default"
              />
            ) : config.countdown.expiredMessage ? (
              <p className={textColorClass}>{config.countdown.expiredMessage}</p>
            ) : null}

            {config.cta && !isExpired && (
              <Button asChild size="lg" className="bg-white text-tenant-primary hover:bg-white/90">
                <Link href={getNavPath(config.cta.href)}>
                  <TranslatedUIText text={config.cta.label} />
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface CountdownDisplayProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  config: CountdownBannerBlockConfig['countdown'];
  variant: 'compact' | 'default' | 'large';
}

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  config,
  variant,
}: CountdownDisplayProps) {
  const TimeUnit = ({ value, label }: { value: number; label: string }) => {
    const sizeClasses = {
      compact: 'px-2 py-1 text-lg',
      default: 'px-3 py-2 text-2xl sm:text-3xl',
      large: 'px-4 py-3 text-3xl sm:text-4xl md:text-5xl',
    };

    const labelClasses = {
      compact: 'text-[10px]',
      default: 'text-xs',
      large: 'text-sm',
    };

    return (
      <div className="flex flex-col items-center">
        <span className={cn(
          'font-bold tabular-nums bg-black/30 backdrop-blur-sm rounded text-white',
          sizeClasses[variant]
        )}>
          {String(value).padStart(2, '0')}
        </span>
        <span className={cn('text-white/70 uppercase mt-1', labelClasses[variant])}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex gap-2 sm:gap-3">
      {config.showDays !== false && days > 0 && <TimeUnit value={days} label="Days" />}
      {config.showHours !== false && <TimeUnit value={hours} label="Hrs" />}
      {config.showMinutes !== false && <TimeUnit value={minutes} label="Min" />}
      {config.showSeconds !== false && <TimeUnit value={seconds} label="Sec" />}
    </div>
  );
}

export default CountdownBannerBlock;
