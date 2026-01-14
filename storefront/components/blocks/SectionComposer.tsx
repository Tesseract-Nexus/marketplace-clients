'use client';

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  type PageLayout,
  type PageSection,
  type BlockConfig,
  type AnimationPreset,
  type PersonalizationConfig,
  type ScheduleConfig,
} from '@/types/blocks';
import { BlockRenderer } from './BlockRenderer';
import { usePersonalization } from '@/hooks/usePersonalization';

// =============================================================================
// ANIMATION PRESETS
// =============================================================================

const animationVariants: Record<AnimationPreset, { hidden: object; visible: object }> = {
  none: { hidden: {}, visible: {} },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'slide-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  'slide-right': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  parallax: {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 },
  },
};

// =============================================================================
// SCHEDULING HELPERS
// =============================================================================

function isScheduleActive(schedule?: ScheduleConfig): boolean {
  if (!schedule?.enabled) return true;

  const now = new Date();
  const timezone = schedule.timezone || 'UTC';

  // Check date range
  if (schedule.startDate) {
    const startDate = new Date(schedule.startDate);
    if (now < startDate) return false;
  }

  if (schedule.endDate) {
    const endDate = new Date(schedule.endDate);
    if (now > endDate) return false;
  }

  // Check recurring schedule
  if (schedule.recurringSchedule) {
    const { type, daysOfWeek, daysOfMonth, startTime, endTime } = schedule.recurringSchedule;
    const currentDay = now.getDay();
    const currentDayOfMonth = now.getDate();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (type === 'weekly' && daysOfWeek && !daysOfWeek.includes(currentDay)) {
      return false;
    }

    if (type === 'monthly' && daysOfMonth && !daysOfMonth.includes(currentDayOfMonth)) {
      return false;
    }

    if (startTime && currentTime < startTime) return false;
    if (endTime && currentTime > endTime) return false;
  }

  return true;
}

// =============================================================================
// VISIBILITY HELPERS
// =============================================================================

function useDeviceVisibility() {
  // This could be enhanced with SSR-safe device detection
  // For now, we rely on CSS for responsive visibility
  return {
    isMobile: false, // Would use window.matchMedia
    isTablet: false,
    isDesktop: true,
  };
}

function shouldShowOnDevice(
  config: { showOnMobile?: boolean; showOnTablet?: boolean; showOnDesktop?: boolean },
  device: ReturnType<typeof useDeviceVisibility>
): boolean {
  // Default to true if not specified
  const showOnMobile = config.showOnMobile ?? true;
  const showOnTablet = config.showOnTablet ?? true;
  const showOnDesktop = config.showOnDesktop ?? true;

  if (device.isMobile && !showOnMobile) return false;
  if (device.isTablet && !showOnTablet) return false;
  if (device.isDesktop && !showOnDesktop) return false;

  return true;
}

// =============================================================================
// SECTION COMPOSER PROPS
// =============================================================================

interface SectionComposerProps {
  layout: PageLayout;
  className?: string;
  previewMode?: boolean;
  onBlockClick?: (blockId: string, sectionId: string) => void;
}

// =============================================================================
// SECTION COMPOSER COMPONENT
// =============================================================================

export function SectionComposer({
  layout,
  className,
  previewMode = false,
  onBlockClick,
}: SectionComposerProps) {
  const device = useDeviceVisibility();
  const { userCohorts, checkPersonalization } = usePersonalization();

  // Filter sections based on visibility, schedule, and personalization
  const visibleSections = useMemo(() => {
    return layout.sections.filter((section) => {
      // Check if section is enabled
      if (!section.enabled) return false;

      // Check device visibility
      if (!shouldShowOnDevice(section, device)) return false;

      // Check schedule
      if (!isScheduleActive(section.schedule)) return false;

      // Check personalization (if enabled)
      if (section.personalization?.enabled) {
        if (!checkPersonalization(section.personalization)) return false;
      }

      return true;
    });
  }, [layout.sections, device, checkPersonalization]);

  // Filter blocks within a section
  const getVisibleBlocks = useCallback(
    (blocks: BlockConfig[]): BlockConfig[] => {
      return blocks.filter((block) => {
        // Check if block is enabled
        if (!block.enabled) return false;

        // Check device visibility
        if (!shouldShowOnDevice(block, device)) return false;

        // Check schedule
        if (!isScheduleActive(block.schedule)) return false;

        // Check personalization
        if (block.personalization?.enabled) {
          if (!checkPersonalization(block.personalization)) return false;
        }

        return true;
      });
    },
    [device, checkPersonalization]
  );

  if (layout.status !== 'published' && !previewMode) {
    return null;
  }

  return (
    <div className={cn('section-composer', className)}>
      <AnimatePresence mode="sync">
        {visibleSections.map((section, sectionIndex) => (
          <SectionRenderer
            key={section.id}
            section={section}
            blocks={getVisibleBlocks(section.blocks)}
            index={sectionIndex}
            previewMode={previewMode}
            onBlockClick={onBlockClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// SECTION RENDERER
// =============================================================================

interface SectionRendererProps {
  section: PageSection;
  blocks: BlockConfig[];
  index: number;
  previewMode?: boolean;
  onBlockClick?: (blockId: string, sectionId: string) => void;
}

function SectionRenderer({
  section,
  blocks,
  index,
  previewMode,
  onBlockClick,
}: SectionRendererProps) {
  const sectionStyles: React.CSSProperties = {
    backgroundColor: section.backgroundColor,
    backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
    paddingTop: section.padding?.top,
    paddingBottom: section.padding?.bottom,
  };

  // CSS classes for responsive visibility
  const visibilityClasses = cn(
    section.showOnMobile === false && 'hidden sm:block',
    section.showOnTablet === false && 'sm:hidden md:block',
    section.showOnDesktop === false && 'md:hidden'
  );

  return (
    <section
      id={`section-${section.id}`}
      className={cn(
        'section-wrapper',
        section.fullWidth ? 'w-full' : 'container-tenant',
        visibilityClasses,
        previewMode && 'relative outline-2 outline-dashed outline-transparent hover:outline-blue-500/50'
      )}
      style={sectionStyles}
      data-section-id={section.id}
      data-section-name={section.name}
    >
      {/* Preview mode label */}
      {previewMode && section.name && (
        <div className="absolute -top-6 left-0 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          {section.name}
        </div>
      )}

      {/* Render blocks */}
      <div className="section-blocks space-y-0">
        {blocks.map((block, blockIndex) => (
          <BlockWrapper
            key={block.id}
            block={block}
            index={blockIndex}
            sectionId={section.id}
            previewMode={previewMode}
            onBlockClick={onBlockClick}
          />
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// BLOCK WRAPPER
// =============================================================================

interface BlockWrapperProps {
  block: BlockConfig;
  index: number;
  sectionId: string;
  previewMode?: boolean;
  onBlockClick?: (blockId: string, sectionId: string) => void;
}

function BlockWrapper({
  block,
  index,
  sectionId,
  previewMode,
  onBlockClick,
}: BlockWrapperProps) {
  const animation = block.animation || 'fade';
  const variants = animationVariants[animation];

  const blockStyles: React.CSSProperties = {
    backgroundColor: block.backgroundColor,
    backgroundImage: block.backgroundImage ? `url(${block.backgroundImage})` : block.backgroundGradient,
    borderRadius: block.borderRadius,
    marginTop: block.margin?.top,
    marginBottom: block.margin?.bottom,
    paddingTop: block.padding?.top,
    paddingBottom: block.padding?.bottom,
    paddingLeft: block.padding?.left,
    paddingRight: block.padding?.right,
  };

  // Shadow classes
  const shadowClass = block.shadow && block.shadow !== 'none'
    ? `shadow-${block.shadow}`
    : '';

  // Container width classes
  const containerClass = block.fullWidth
    ? 'w-full'
    : block.containerWidth
      ? `max-w-${block.containerWidth} mx-auto`
      : '';

  // CSS classes for responsive visibility
  const visibilityClasses = cn(
    block.showOnMobile === false && 'hidden sm:block',
    block.showOnTablet === false && 'sm:hidden md:block',
    block.showOnDesktop === false && 'md:hidden'
  );

  const handleClick = () => {
    if (previewMode && onBlockClick) {
      onBlockClick(block.id, sectionId);
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={variants}
      transition={{
        duration: block.animationDuration ? block.animationDuration / 1000 : 0.5,
        delay: block.animationDelay ? block.animationDelay / 1000 : index * 0.1,
        ease: 'easeOut',
      }}
      className={cn(
        'block-wrapper',
        containerClass,
        shadowClass,
        visibilityClasses,
        previewMode && 'cursor-pointer outline-2 outline-dashed outline-transparent hover:outline-blue-400/50 transition-all'
      )}
      style={blockStyles}
      data-block-id={block.id}
      data-block-type={block.type}
      data-tracking-id={block.trackingId}
      onClick={handleClick}
    >
      {/* Preview mode label */}
      {previewMode && block.adminLabel && (
        <div className="absolute -top-5 left-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
          {block.adminLabel}
        </div>
      )}

      <BlockRenderer block={block} />
    </motion.div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default SectionComposer;
