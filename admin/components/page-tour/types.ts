/**
 * Page Tour Types
 * Comprehensive guided tour system for each page/section
 */

export type TourPosition = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  description: string;
  position?: TourPosition;
  tip?: string; // Optional keyboard shortcut or pro tip
  action?: 'click' | 'hover' | 'none'; // What action triggers next step
  delay?: number; // Delay before showing (for animations)
}

export interface PageTourConfig {
  pageId: string;
  pagePath: string | RegExp; // URL path pattern
  title: string;
  description: string;
  steps: TourStep[];
}

export interface PageTourState {
  isActive: boolean;
  currentPageId: string | null;
  currentStepIndex: number;
  completedTours: string[]; // List of completed tour page IDs
  skippedTours: string[];
}

export interface PageTourContextValue extends PageTourState {
  startTour: (pageId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTours: () => void;
  isPageTourAvailable: (pageId: string) => boolean;
  getCurrentTourConfig: () => PageTourConfig | null;
  getCurrentStep: () => TourStep | null;
}

// Storage key for persisting tour state
export const PAGE_TOUR_STORAGE_KEY = 'tesserix_page_tours';
