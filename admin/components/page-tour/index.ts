/**
 * Page Tour System - Public Exports
 *
 * A comprehensive guided tour system that provides page-specific
 * tours to help users learn the interface.
 */

export { PageTourProvider, usePageTour } from './PageTourProvider';
export { PageTour } from './PageTour';

export type {
  TourPosition,
  TourStep,
  PageTourConfig,
  PageTourState,
  PageTourContextValue,
} from './types';

export {
  PAGE_TOUR_STORAGE_KEY,
} from './types';

export {
  ALL_PAGE_TOURS,
  getTourConfigById,
  getTourConfigByPath,
  dashboardTour,
  categoriesTour,
  productsTour,
  staffTour,
  settingsTour,
  ordersTour,
  inventoryTour,
} from './tourConfigs';
