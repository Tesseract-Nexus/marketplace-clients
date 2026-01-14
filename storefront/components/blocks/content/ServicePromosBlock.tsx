'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import type { ServicePromosBlockConfig, ServicePromo } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function ServicePromosBlock({ config }: BlockComponentProps<ServicePromosBlockConfig>) {
  const getNavPath = useNavPath();
  const gridCols = config.columns || { mobile: 1, tablet: 2, desktop: 4 };

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="text-center mb-8 sm:mb-12">
            {config.title && (
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                <TranslatedUIText text={config.title} />
              </h2>
            )}
            {config.subtitle && (
              <p className="text-muted-foreground">
                <TranslatedUIText text={config.subtitle} />
              </p>
            )}
          </div>
        )}

        {/* Services Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className={cn(
            config.layout === 'list' ? 'space-y-4' : 'grid gap-4 sm:gap-6',
            config.layout !== 'list' && [
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            ].join(' ')
          )}
        >
          {config.services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              config={config}
              getNavPath={getNavPath}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface ServiceCardProps {
  service: ServicePromo;
  index: number;
  config: ServicePromosBlockConfig;
  getNavPath: (path: string) => string;
}

function ServiceCard({ service, index, config, getNavPath }: ServiceCardProps) {
  const IconComponent = (LucideIcons as any)[toPascalCase(service.icon)] || LucideIcons.Package;

  const content = (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={cn(
        'bg-background rounded-xl p-6 transition-all',
        service.url && 'hover:shadow-lg cursor-pointer group',
        config.layout === 'list' && 'flex items-center gap-6',
        config.layout === 'icons' && 'text-center'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center',
          config.iconStyle === 'circle' && 'w-14 h-14 rounded-full bg-tenant-primary/10',
          config.iconStyle === 'square' && 'w-14 h-14 rounded-lg bg-tenant-primary/10',
          config.iconStyle === 'none' && '',
          config.layout === 'icons' && 'mx-auto mb-4',
          config.layout === 'list' && 'flex-shrink-0'
        )}
      >
        <IconComponent className="w-7 h-7 text-tenant-primary" />
      </div>

      {/* Content */}
      <div className={cn(config.layout === 'list' && 'flex-1')}>
        <h3 className={cn(
          'font-semibold mb-1',
          service.url && 'group-hover:text-tenant-primary transition-colors'
        )}>
          <TranslatedUIText text={service.title} />
        </h3>
        {service.description && config.cardStyle !== 'icon-focused' && (
          <p className="text-sm text-muted-foreground mb-2">
            <TranslatedUIText text={service.description} />
          </p>
        )}
        {config.showFeatures && service.features && service.features.length > 0 && (
          <ul className="space-y-1 mt-3">
            {service.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}
        {service.badge && (
          <span className="inline-block mt-2 px-2 py-0.5 bg-tenant-primary/10 text-tenant-primary text-xs font-medium rounded">
            {service.badge}
          </span>
        )}
      </div>

      {/* Arrow for list layout */}
      {config.layout === 'list' && service.url && (
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      )}
    </motion.div>
  );

  if (service.url) {
    return (
      <Link href={getNavPath(service.url)} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export default ServicePromosBlock;
