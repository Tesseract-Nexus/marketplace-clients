'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import type { BannerStripBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function BannerStripBlock({ config }: BlockComponentProps<BannerStripBlockConfig>) {
  const getNavPath = useNavPath();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotating variant
  useEffect(() => {
    if (config.variant !== 'rotating' || config.items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % config.items.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [config.variant, config.items.length]);

  // Static variant
  if (config.variant === 'static') {
    return (
      <div className="py-3 px-4 bg-tenant-primary text-white">
        <div className="container-tenant">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {config.items.map((item) => (
              <BannerItem key={item.id} item={item} getNavPath={getNavPath} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Rotating variant
  if (config.variant === 'rotating') {
    return (
      <div className="py-3 px-4 bg-tenant-primary text-white overflow-hidden">
        <div className="container-tenant">
          <div className="flex items-center justify-center h-6">
            {config.items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: index === currentIndex ? 1 : 0,
                  y: index === currentIndex ? 0 : 20,
                }}
                className="absolute"
              >
                <BannerItem item={item} getNavPath={getNavPath} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Scrolling variant (marquee)
  const speedClass =
    config.speed === 'slow' ? 'animate-marquee-slow' :
    config.speed === 'fast' ? 'animate-marquee-fast' :
    'animate-marquee';

  // Duplicate items for seamless loop
  const items = [...config.items, ...config.items];

  return (
    <div
      className={cn(
        'py-3 px-4 bg-tenant-primary text-white overflow-hidden',
        config.pauseOnHover && 'group'
      )}
    >
      <div
        className={cn(
          'flex whitespace-nowrap',
          speedClass,
          config.pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
      >
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="mx-8">
            <BannerItem item={item} getNavPath={getNavPath} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface BannerItemProps {
  item: BannerStripBlockConfig['items'][0];
  getNavPath: (path: string) => string;
}

function BannerItem({ item, getNavPath }: BannerItemProps) {
  const IconComponent = item.icon
    ? (LucideIcons as any)[toPascalCase(item.icon)] || null
    : null;

  const content = (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      {IconComponent && <IconComponent className="w-4 h-4" />}
      <TranslatedUIText text={item.text} />
    </span>
  );

  if (item.url) {
    return (
      <Link
        href={getNavPath(item.url)}
        className="hover:underline underline-offset-2"
      >
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

export default BannerStripBlock;
