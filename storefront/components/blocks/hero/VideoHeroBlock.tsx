'use client';

import HeroBlock from './HeroBlock';
import type { VideoHeroBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

/**
 * Video Hero Block
 * Specialized hero block with video background.
 * Delegates to HeroBlock with video-specific configuration.
 */
export function VideoHeroBlock({ config }: BlockComponentProps<VideoHeroBlockConfig>) {
  // Convert VideoHeroBlockConfig to HeroBlockConfig format
  const heroConfig = {
    ...config,
    type: 'hero' as const,
    variant: 'video' as const,
    slides: [
      {
        id: 'video-slide-1',
        media: {
          ...config.video,
          type: 'video' as const,
        },
        badge: config.badge ? { text: config.badge.text, icon: config.badge.icon } : undefined,
        headline: config.headline,
        subheadline: config.subheadline,
        ctas: config.ctas,
        contentAlignment: config.contentAlignment,
        verticalAlignment: config.verticalAlignment,
        textColor: config.textColor,
      },
    ],
    minHeight: config.minHeight,
    showStats: false,
    showScrollIndicator: false,
    showDecorations: false,
  };

  return <HeroBlock config={heroConfig as any} />;
}

export default VideoHeroBlock;
