'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  SetupWizardContextValue,
  SetupWizardState,
  WizardPhase,
  WizardStepId,
  CreatedCategory,
  CreatedProduct,
  InvitedStaff,
  STORAGE_PREFIX,
  WIZARD_STEPS,
} from './types';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';

// Routes where the wizard should NOT auto-open (edit pages, detail pages, etc.)
const SUPPRESSED_ROUTES = [
  '/edit',
  '/new',
  '/details',
  '/view',
  '/settings/',
];

// Check if current route should suppress wizard auto-open
function shouldSuppressWizard(pathname: string): boolean {
  return SUPPRESSED_ROUTES.some(route => pathname.includes(route));
}

const SetupWizardContext = createContext<SetupWizardContextValue | undefined>(undefined);

const INITIAL_STATE: SetupWizardState = {
  isOpen: false,
  isMinimized: false,
  phase: 'welcome',
  currentStep: 0,
  completedSteps: [],
  skippedSteps: [],
  createdCategory: null,
  createdProduct: null,
  invitedStaff: null,
  dismissedAt: null,
  completedAt: null,
  neverShowAgain: false,
};

interface SetupWizardProviderProps {
  children: ReactNode;
}

export function SetupWizardProvider({ children }: SetupWizardProviderProps) {
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const pathname = usePathname();
  const [state, setState] = useState<SetupWizardState>(INITIAL_STATE);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Generate storage key based on tenant ID and user ID for per-user tracking
  const getStorageKey = useCallback(() => {
    const tenantPart = currentTenant?.id || 'default';
    const userPart = user?.id || 'anonymous';
    return `${STORAGE_PREFIX}_${tenantPart}_${userPart}`;
  }, [currentTenant?.id, user?.id]);

  // Session storage key for tracking if wizard was shown this session
  const getSessionKey = useCallback(() => {
    return `${getStorageKey()}_session_shown`;
  }, [getStorageKey]);

  // Check if wizard was already shown this session (persists across page navigations)
  const hasShownThisSession = useCallback(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(getSessionKey()) === 'true';
    } catch {
      return false;
    }
  }, [getSessionKey]);

  // Mark wizard as shown this session
  const markShownThisSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(getSessionKey(), 'true');
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }, [getSessionKey]);

  // Load state from localStorage on mount
  useEffect(() => {
    // Wait for both tenant and user to be available
    if (!currentTenant?.id || !user?.id) return;

    const storageKey = getStorageKey();
    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setState((prev) => ({
          ...prev,
          ...parsed,
          // Don't restore isOpen - this should be fresh each session
          isOpen: false,
          // Restore isMinimized if wizard was minimized before
          isMinimized: parsed.isMinimized || false,
        }));

        // Check if wizard was already completed or dismissed permanently
        if (parsed.completedAt || parsed.neverShowAgain || parsed.dismissedAt) {
          setIsFirstTimeUser(false);
        }
      }
    } catch (error) {
      console.error('Failed to load wizard state from localStorage:', error);
    }
    setHasInitialized(true);
  }, [currentTenant?.id, user?.id, getStorageKey]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (!currentTenant?.id || !user?.id || !hasInitialized) return;

    const storageKey = getStorageKey();
    try {
      const stateToSave = {
        ...state,
        // Don't persist isOpen (should be fresh each session)
        isOpen: undefined,
        // DO persist isMinimized so it's restored on page refresh
        isMinimized: state.isMinimized,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save wizard state to localStorage:', error);
    }
  }, [state, currentTenant?.id, user?.id, hasInitialized, getStorageKey]);

  // Detect first-time user based on multiple heuristics
  // This runs after state is loaded from localStorage
  useEffect(() => {
    if (!hasInitialized || !currentTenant?.id || !user?.id) return;

    // If already completed or dismissed permanently, not a first-time user
    if (state.completedAt || state.neverShowAgain) {
      setIsFirstTimeUser(false);
      return;
    }

    // If wizard was dismissed (even temporarily), don't show again
    if (state.dismissedAt) {
      setIsFirstTimeUser(false);
      return;
    }

    // If we've already shown the wizard this session (using sessionStorage), don't show again
    if (hasShownThisSession()) {
      return;
    }

    // Don't auto-open on suppressed routes (edit pages, detail pages, etc.)
    if (pathname && shouldSuppressWizard(pathname)) {
      return;
    }

    // Check if user has any wizard progress (completed or skipped steps)
    const hasNoProgress =
      state.completedSteps.length === 0 && state.skippedSteps.length === 0;

    // Primary heuristic: No wizard progress means first-time user for this tenant
    // This works for:
    // - New tenants with new users
    // - New users joining existing tenants
    // - Users who haven't interacted with the wizard yet
    let shouldShowWizard = hasNoProgress;

    // Additional heuristic: Check if user account is recent (within 30 days)
    // This helps identify truly new users even if they somehow have no localStorage
    if (user.createdAt) {
      const userCreatedAt = new Date(user.createdAt);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const isNewUser = userCreatedAt > thirtyDaysAgo;

      // Show wizard if: no progress AND (new user OR no localStorage data existed)
      shouldShowWizard = hasNoProgress && isNewUser;
    }

    // Fallback: If we have no user.createdAt, rely solely on localStorage state
    // If there's no localStorage data and no progress, assume first-time user
    if (!user.createdAt && hasNoProgress) {
      shouldShowWizard = true;
    }

    setIsFirstTimeUser(shouldShowWizard);

    // Auto-open wizard for first-time users (only once per session)
    if (shouldShowWizard) {
      markShownThisSession();
      setState((prev) => ({ ...prev, isOpen: true }));
    }
  }, [
    hasInitialized,
    currentTenant?.id,
    user?.id,
    user?.createdAt,
    pathname,
    state.completedAt,
    state.neverShowAgain,
    state.dismissedAt,
    state.completedSteps.length,
    state.skippedSteps.length,
    hasShownThisSession,
    markShownThisSession,
  ]);

  // Actions
  const openWizard = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true, isMinimized: false }));
  }, []);

  const closeWizard = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const minimizeWizard = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: true }));
  }, []);

  const restoreWizard = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: false }));
  }, []);

  const dismissWizard = useCallback((neverShowAgain = false) => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
      dismissedAt: new Date().toISOString(),
      neverShowAgain,
    }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    setState((prev) => {
      const maxStep = WIZARD_STEPS.length - 1;
      const newStep = Math.min(prev.currentStep + 1, maxStep);
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => {
      const newStep = Math.max(prev.currentStep - 1, 0);
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => {
      const maxStep = WIZARD_STEPS.length - 1;
      const newStep = Math.max(0, Math.min(step, maxStep));
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const skipStep = useCallback(() => {
    const currentStepId = WIZARD_STEPS[state.currentStep]?.id;
    if (currentStepId) {
      setState((prev) => ({
        ...prev,
        skippedSteps: prev.skippedSteps.includes(currentStepId)
          ? prev.skippedSteps
          : [...prev.skippedSteps, currentStepId],
        currentStep: Math.min(prev.currentStep + 1, WIZARD_STEPS.length - 1),
      }));
    }
  }, [state.currentStep]);

  // Phase transitions
  const setPhase = useCallback((phase: WizardPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const startTour = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'tour' }));
  }, []);

  const skipTour = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'setup', currentStep: 0 }));
  }, []);

  const startSetup = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'setup', currentStep: 0 }));
  }, []);

  const completeWizard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'completed',
      completedAt: new Date().toISOString(),
      isOpen: false,
    }));
  }, []);

  // Resource tracking
  const setCreatedCategory = useCallback((category: CreatedCategory | null) => {
    setState((prev) => ({ ...prev, createdCategory: category }));
  }, []);

  const setCreatedProduct = useCallback((product: CreatedProduct | null) => {
    setState((prev) => ({ ...prev, createdProduct: product }));
  }, []);

  const setInvitedStaff = useCallback((staff: InvitedStaff | null) => {
    setState((prev) => ({ ...prev, invitedStaff: staff }));
  }, []);

  // Step completion
  const markStepComplete = useCallback((stepId: WizardStepId) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
      // Remove from skipped if it was marked as skipped before
      skippedSteps: prev.skippedSteps.filter((id) => id !== stepId),
    }));
  }, []);

  const markStepSkipped = useCallback((stepId: WizardStepId) => {
    setState((prev) => ({
      ...prev,
      skippedSteps: prev.skippedSteps.includes(stepId)
        ? prev.skippedSteps
        : [...prev.skippedSteps, stepId],
    }));
  }, []);

  // Reset
  const resetWizard = useCallback(() => {
    setState(INITIAL_STATE);
    if (currentTenant?.id && user?.id) {
      const storageKey = getStorageKey();
      const sessionKey = getSessionKey();
      try {
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(sessionKey);
      } catch (error) {
        console.error('Failed to remove wizard state from storage:', error);
      }
    }
    setIsFirstTimeUser(true);
  }, [currentTenant?.id, user?.id, getStorageKey, getSessionKey]);

  // Memoize context value
  const contextValue = useMemo<SetupWizardContextValue>(
    () => ({
      ...state,
      openWizard,
      closeWizard,
      minimizeWizard,
      restoreWizard,
      dismissWizard,
      nextStep,
      previousStep,
      goToStep,
      skipStep,
      setPhase,
      startTour,
      skipTour,
      startSetup,
      completeWizard,
      setCreatedCategory,
      setCreatedProduct,
      setInvitedStaff,
      markStepComplete,
      markStepSkipped,
      isFirstTimeUser,
      resetWizard,
    }),
    [
      state,
      openWizard,
      closeWizard,
      minimizeWizard,
      restoreWizard,
      dismissWizard,
      nextStep,
      previousStep,
      goToStep,
      skipStep,
      setPhase,
      startTour,
      skipTour,
      startSetup,
      completeWizard,
      setCreatedCategory,
      setCreatedProduct,
      setInvitedStaff,
      markStepComplete,
      markStepSkipped,
      isFirstTimeUser,
      resetWizard,
    ]
  );

  return (
    <SetupWizardContext.Provider value={contextValue}>
      {children}
    </SetupWizardContext.Provider>
  );
}

export function useSetupWizard() {
  const context = useContext(SetupWizardContext);
  if (context === undefined) {
    throw new Error('useSetupWizard must be used within a SetupWizardProvider');
  }
  return context;
}
