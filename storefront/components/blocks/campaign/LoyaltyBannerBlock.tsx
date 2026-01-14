'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, Crown, Star, Award } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { LoyaltyBannerBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function LoyaltyBannerBlock({ config }: BlockComponentProps<LoyaltyBannerBlockConfig>) {
  const getNavPath = useNavPath();
  const { customer, isAuthenticated } = useAuthStore();

  // Show member view if authenticated and configured
  const showMemberView = config.showMemberView && isAuthenticated && customer;

  // Inline variant
  if (config.variant === 'inline') {
    return (
      <section className="py-4 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="container-tenant">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6" />
              <div>
                <span className="font-bold">
                  <TranslatedUIText text={showMemberView && config.memberTitle ? config.memberTitle : config.title} />
                </span>
                {config.subtitle && (
                  <span className="ml-2 text-white/80">
                    <TranslatedUIText text={showMemberView && config.memberSubtitle ? config.memberSubtitle : config.subtitle} />
                  </span>
                )}
              </div>
            </div>
            {config.joinCta && !showMemberView && (
              <Button asChild variant="secondary" className="bg-white text-amber-600 hover:bg-white/90">
                <Link href={getNavPath(config.joinCta.href)}>
                  <TranslatedUIText text={config.joinCta.label} />
                </Link>
              </Button>
            )}
            {showMemberView && config.learnMoreUrl && (
              <Button asChild variant="link" className="text-white">
                <Link href={getNavPath(config.learnMoreUrl)}>
                  View My Rewards
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Banner variant
  if (config.variant === 'banner') {
    return (
      <section className="relative py-12 overflow-hidden">
        {/* Background */}
        {config.backgroundMedia?.url ? (
          <>
            <Image
              src={config.backgroundMedia.url}
              alt=""
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500" />
        )}

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="container-tenant relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-white max-w-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-8 h-8 text-yellow-300" />
                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {showMemberView ? 'Member Benefits' : 'Join Now'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                <TranslatedUIText text={showMemberView && config.memberTitle ? config.memberTitle : config.title} />
              </h2>
              {(showMemberView ? config.memberSubtitle : config.subtitle) && (
                <p className="text-lg text-white/90 mb-4">
                  <TranslatedUIText text={showMemberView && config.memberSubtitle ? config.memberSubtitle : config.subtitle!} />
                </p>
              )}
              {config.description && !showMemberView && (
                <p className="text-white/70 mb-6">
                  <TranslatedUIText text={config.description} />
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {config.joinCta && !showMemberView && (
                  <Button asChild size="lg" className="bg-white text-amber-600 hover:bg-white/90">
                    <Link href={getNavPath(config.joinCta.href)}>
                      <Gift className="mr-2 w-5 h-5" />
                      <TranslatedUIText text={config.joinCta.label} />
                    </Link>
                  </Button>
                )}
                {config.learnMoreUrl && (
                  <Button asChild variant="link" className="text-white" size="lg">
                    <Link href={getNavPath(config.learnMoreUrl)}>
                      {showMemberView ? 'View My Rewards' : 'Learn More'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>

            {/* Features */}
            {config.features && config.features.length > 0 && !showMemberView && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                {config.features.map((feature, index) => {
                  const IconComponent = (LucideIcons as any)[toPascalCase(feature.icon)] || Star;
                  return (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white"
                    >
                      <IconComponent className="w-6 h-6 mb-2 text-yellow-300" />
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      {feature.description && (
                        <p className="text-sm text-white/70">{feature.description}</p>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Card variant (default)
  return (
    <section className="py-8 sm:py-12">
      <div className="container-tenant">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Background */}
          {config.backgroundMedia?.url ? (
            <>
              <Image
                src={config.backgroundMedia.url}
                alt=""
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
          )}

          <div className="relative p-6 sm:p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-8 h-8 text-yellow-300" />
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    <TranslatedUIText text={showMemberView && config.memberTitle ? config.memberTitle : config.title} />
                  </h2>
                </div>
                {(showMemberView ? config.memberSubtitle : config.subtitle) && (
                  <p className="text-lg text-white/90 mb-2">
                    <TranslatedUIText text={showMemberView && config.memberSubtitle ? config.memberSubtitle : config.subtitle!} />
                  </p>
                )}
                {config.description && !showMemberView && (
                  <p className="text-white/70">
                    <TranslatedUIText text={config.description} />
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {config.joinCta && !showMemberView && (
                  <Button asChild size="lg" className="bg-white text-amber-600 hover:bg-white/90">
                    <Link href={getNavPath(config.joinCta.href)}>
                      <Gift className="mr-2 w-5 h-5" />
                      <TranslatedUIText text={config.joinCta.label} />
                    </Link>
                  </Button>
                )}
                {config.learnMoreUrl && (
                  <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                    <Link href={getNavPath(config.learnMoreUrl)}>
                      {showMemberView ? 'View Rewards' : 'Learn More'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Features row */}
            {config.features && config.features.length > 0 && !showMemberView && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
                {config.features.map((feature, index) => {
                  const IconComponent = (LucideIcons as any)[toPascalCase(feature.icon)] || Star;
                  return (
                    <div key={index} className="text-center">
                      <IconComponent className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export default LoyaltyBannerBlock;
