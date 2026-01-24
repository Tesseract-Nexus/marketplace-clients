/**
 * Setup Wizard - Public Exports
 *
 * An intuitive setup wizard for new admin users that guides them through
 * initial store setup with a step-by-step approach combining a modal wizard
 * for actions and a spotlight tour for UI familiarization.
 *
 * @example
 * // In your layout:
 * import { SetupWizardProvider, SetupWizard } from '@/components/setup-wizard';
 *
 * function Layout({ children }) {
 *   return (
 *     <SetupWizardProvider>
 *       {children}
 *       <SetupWizard />
 *     </SetupWizardProvider>
 *   );
 * }
 *
 * @example
 * // To manually trigger the wizard:
 * import { useSetupWizard } from '@/components/setup-wizard';
 *
 * function Component() {
 *   const { openWizard, resetWizard } = useSetupWizard();
 *
 *   return (
 *     <button onClick={openWizard}>Open Setup Wizard</button>
 *   );
 * }
 */

// Provider and main component
export { SetupWizardProvider, useSetupWizard } from './SetupWizardProvider';
export { SetupWizard } from './SetupWizard';

// Sub-components (for advanced customization)
export { WizardModal } from './WizardModal';
export { SpotlightOverlay } from './SpotlightOverlay';
export { SpotlightTooltip } from './SpotlightTooltip';
export { MinimizedBadge } from './MinimizedBadge';

// Step components
export { WelcomeStep } from './steps/WelcomeStep';
export { CategoryStep } from './steps/CategoryStep';
export { ProductStep } from './steps/ProductStep';
export { StaffStep } from './steps/StaffStep';
export { SettingsStep } from './steps/SettingsStep';
export { CompletionStep } from './steps/CompletionStep';

// Hooks
export { useSpotlight, useSpotlightTarget } from './hooks/useSpotlight';

// Types
export type {
  WizardPhase,
  WizardStepId,
  WizardStep,
  SetupWizardState,
  SetupWizardContextValue,
  SpotlightStep,
  SpotlightState,
  CreatedCategory,
  CreatedProduct,
  InvitedStaff,
} from './types';

// Constants
export { WIZARD_STEPS, TOUR_STEPS, STORAGE_PREFIX, STORAGE_KEYS, WIZARD_DESTINATIONS } from './types';
