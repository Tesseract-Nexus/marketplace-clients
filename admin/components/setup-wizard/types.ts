/**
 * Setup Wizard Types
 * TypeScript interfaces for the setup wizard system
 */

export type WizardPhase = 'welcome' | 'tour' | 'setup' | 'completed';

export type WizardStepId = 'category' | 'product' | 'staff' | 'settings' | 'completion';

export interface WizardStep {
  id: WizardStepId;
  title: string;
  description: string;
  icon?: React.ReactNode;
  isOptional?: boolean;
  canSkip?: boolean;
}

export interface CreatedCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CreatedProduct {
  id: string;
  name: string;
  sku: string;
}

export interface InvitedStaff {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface SetupWizardState {
  // Visibility
  isOpen: boolean;
  isMinimized: boolean;
  phase: WizardPhase;

  // Progress
  currentStep: number;
  completedSteps: WizardStepId[];
  skippedSteps: WizardStepId[];

  // Created resources
  createdCategory: CreatedCategory | null;
  createdProduct: CreatedProduct | null;
  invitedStaff: InvitedStaff | null;

  // Persistence flags
  dismissedAt: string | null;
  completedAt: string | null;
  neverShowAgain: boolean;
}

export interface SetupWizardContextValue extends SetupWizardState {
  // Actions
  openWizard: () => void;
  closeWizard: () => void;
  minimizeWizard: () => void;
  restoreWizard: () => void;
  dismissWizard: (neverShowAgain?: boolean) => void;

  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  skipStep: () => void;

  // Phase transitions
  setPhase: (phase: WizardPhase) => void;
  startTour: () => void;
  skipTour: () => void;
  startSetup: () => void;
  completeWizard: () => void;

  // Resource tracking
  setCreatedCategory: (category: CreatedCategory | null) => void;
  setCreatedProduct: (product: CreatedProduct | null) => void;
  setInvitedStaff: (staff: InvitedStaff | null) => void;

  // Step completion
  markStepComplete: (stepId: WizardStepId) => void;
  markStepSkipped: (stepId: WizardStepId) => void;

  // First-time user detection
  isFirstTimeUser: boolean;

  // Reset
  resetWizard: () => void;
}

export interface SpotlightStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
}

export interface SpotlightState {
  isActive: boolean;
  currentStepIndex: number;
  steps: SpotlightStep[];
}

// localStorage keys
export const STORAGE_PREFIX = 'tesserix_setup_wizard';
export const STORAGE_KEYS = {
  STATE: `${STORAGE_PREFIX}_state`,
  DISMISSED: `${STORAGE_PREFIX}_dismissed`,
  COMPLETED: `${STORAGE_PREFIX}_completed`,
} as const;

// Wizard steps configuration
export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'category',
    title: 'Create Category',
    description: 'Organize your products with categories',
    canSkip: true,
  },
  {
    id: 'product',
    title: 'Add Product',
    description: 'Add your first product to the catalog',
    canSkip: true,
  },
  {
    id: 'staff',
    title: 'Invite Staff',
    description: 'Add team members to help manage your store',
    isOptional: true,
    canSkip: true,
  },
  {
    id: 'settings',
    title: 'Store Settings',
    description: 'Configure essential store settings',
    canSkip: false,
  },
  {
    id: 'completion',
    title: 'All Done!',
    description: 'Your store is ready to go',
    canSkip: false,
  },
];

// Tour steps configuration
export const TOUR_STEPS: SpotlightStep[] = [
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    description: 'Access all areas of your store - Catalog, Orders, Customers, and more.',
    position: 'right',
  },
  {
    id: 'search',
    target: '[data-tour="command-palette"]',
    title: 'Quick Search',
    description: 'Press Cmd+K (Mac) or Ctrl+K (Windows) to quickly find anything.',
    position: 'bottom',
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    description: 'Stay updated with order alerts, stock warnings, and more.',
    position: 'bottom',
  },
];

// Navigation destinations for wizard steps
// Re-exported from centralized routes for backward compatibility
export { WIZARD_ROUTES as WIZARD_DESTINATIONS } from '@/lib/routes';
