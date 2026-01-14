'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import type { BrandShowcaseBlockConfig, BrandItem } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function BrandShowcaseBlock({ config }: BlockComponentProps<BrandShowcaseBlockConfig>) {
  const getNavPath = useNavPath();
  const gridCols = config.columns || { mobile: 3, tablet: 4, desktop: 6 };

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="text-center mb-8">
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

        {/* Brands */}
        {config.layout === 'marquee' ? (
          <MarqueeBrands brands={config.brands} config={config} getNavPath={getNavPath} />
        ) : config.layout === 'carousel' ? (
          <CarouselBrands brands={config.brands} config={config} getNavPath={getNavPath} />
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
            className={cn(
              'grid gap-4 sm:gap-6 items-center',
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            )}
          >
            {config.brands.map((brand, index) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                index={index}
                config={config}
                getNavPath={getNavPath}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface BrandCardProps {
  brand: BrandItem;
  index: number;
  config: BrandShowcaseBlockConfig;
  getNavPath: (path: string) => string;
  className?: string;
}

function BrandCard({ brand, index, config, getNavPath, className }: BrandCardProps) {
  const content = (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
      }}
      className={cn(
        'p-4 sm:p-6 rounded-lg flex flex-col items-center justify-center transition-all',
        brand.url && 'hover:shadow-md cursor-pointer group',
        className
      )}
    >
      {brand.logo?.url && (
        <div className="relative w-full aspect-[3/2] flex items-center justify-center">
          <Image
            src={brand.logo.url}
            alt={brand.logo.alt || brand.name}
            fill
            className={cn(
              'object-contain transition-all',
              config.grayscale && 'grayscale',
              config.grayscaleOnHover && 'grayscale group-hover:grayscale-0'
            )}
          />
        </div>
      )}
      {config.showNames && (
        <span className="mt-2 text-sm font-medium text-muted-foreground text-center">
          {brand.name}
        </span>
      )}
    </motion.div>
  );

  if (brand.url) {
    return (
      <Link href={getNavPath(brand.url)} className={className}>
        {content}
      </Link>
    );
  }

  return content;
}

function MarqueeBrands({
  brands,
  config,
  getNavPath,
}: {
  brands: BrandItem[];
  config: BrandShowcaseBlockConfig;
  getNavPath: (path: string) => string;
}) {
  // Duplicate brands for seamless loop
  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex gap-8"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {duplicatedBrands.map((brand, index) => (
          <BrandCard
            key={`${brand.id}-${index}`}
            brand={brand}
            index={index}
            config={config}
            getNavPath={getNavPath}
            className="flex-none w-32 sm:w-40"
          />
        ))}
      </motion.div>
    </div>
  );
}

function CarouselBrands({
  brands,
  config,
  getNavPath,
}: {
  brands: BrandItem[];
  config: BrandShowcaseBlockConfig;
  getNavPath: (path: string) => string;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
      {brands.map((brand, index) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          index={index}
          config={config}
          getNavPath={getNavPath}
          className="flex-none w-32 sm:w-40 snap-start"
        />
      ))}
    </div>
  );
}

export default BrandShowcaseBlock;
