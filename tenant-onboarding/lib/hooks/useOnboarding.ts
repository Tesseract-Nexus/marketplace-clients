import { useState, useCallback } from 'react';
import { useOnboardingStore } from '../store/onboarding-store';
import { onboardingApi } from '../api/onboarding';
import type {
  SessionResponse,
  BusinessInfoRequest,
  ContactDetailsRequest,
  BusinessAddressRequest,
} from '../types/api-contracts';

export interface UseOnboardingOptions {
  autoSave?: boolean;
  validateOnSubmit?: boolean;
}

export const useOnboarding = (options: UseOnboardingOptions = {}) => {
  const {
    sessionId,
    currentStep,
    isLoading,
    error,
    businessInfo,
    contactDetails,
    businessAddress,
    emailVerified,
    phoneVerified,
    setSessionId,
    setCurrentStep,
    setLoading,
    setError,
    setBusinessInfo,
    setContactDetails,
    setBusinessAddress,
    setEmailVerified,
    setPhoneVerified,
    markStepCompleted,
    nextStep,
    resetOnboarding,
    getProgress,
  } = useOnboardingStore();

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize onboarding session
  const initializeOnboarding = useCallback(async (applicationType: string = 'ecommerce') => {
    try {
      setLoading(true);
      setError(null);

      const session = await onboardingApi.startOnboarding(applicationType);
      setSessionId(session.session_id!);

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize onboarding';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setSessionId, setLoading, setError]);

  // Submit business information
  const submitBusinessInfo = useCallback(async (data: BusinessInfoRequest) => {
    if (!sessionId) {
      throw new Error('No onboarding session found');
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const session = await onboardingApi.updateBusinessInformation(sessionId, data);
      setBusinessInfo(data);
      markStepCompleted(0);

      if (options.autoSave) {
        nextStep();
      }

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save business information';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, setBusinessInfo, markStepCompleted, nextStep, setLoading, setError, options.autoSave]);

  // Submit contact details
  const submitContactDetails = useCallback(async (data: ContactDetailsRequest) => {
    if (!sessionId) {
      throw new Error('No onboarding session found');
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const session = await onboardingApi.updateContactDetails(sessionId, data);
      setContactDetails(data);
      markStepCompleted(1);

      if (options.autoSave) {
        nextStep();
      }

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save contact details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, setContactDetails, markStepCompleted, nextStep, setLoading, setError, options.autoSave]);

  // Submit business address
  const submitBusinessAddress = useCallback(async (data: BusinessAddressRequest) => {
    if (!sessionId) {
      throw new Error('No onboarding session found');
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const session = await onboardingApi.updateBusinessAddress(sessionId, data);
      setBusinessAddress(data);
      markStepCompleted(2);

      if (options.autoSave) {
        nextStep();
      }

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save business address';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, setBusinessAddress, markStepCompleted, nextStep, setLoading, setError, options.autoSave]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!sessionId) {
      throw new Error('No onboarding session found');
    }

    try {
      setLoading(true);
      setError(null);

      const session = await onboardingApi.completeOnboarding(sessionId);
      markStepCompleted(3);

      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, markStepCompleted, setLoading, setError]);

  // Validation helpers
  const validateBusinessName = useCallback(async (businessName: string) => {
    try {
      const result = await onboardingApi.validateBusinessName(businessName);
      if (!result.available) {
        setValidationErrors(prev => ({ ...prev, businessName: result.message || 'Business name is not available' }));
      } else {
        setValidationErrors(prev => {
          const { businessName, ...rest } = prev;
          return rest;
        });
      }
      return result.available;
    } catch (err) {
      setValidationErrors(prev => ({ ...prev, businessName: 'Failed to validate business name' }));
      return false;
    }
  }, []);

  const validateEmail = useCallback(async (email: string) => {
    try {
      const result = await onboardingApi.validateEmail(email);
      if (!result.available) {
        setValidationErrors(prev => ({ ...prev, email: result.message || 'Email is not available' }));
      } else {
        setValidationErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
      return result.available;
    } catch (err) {
      setValidationErrors(prev => ({ ...prev, email: 'Failed to validate email' }));
      return false;
    }
  }, []);

  // Verification helpers
  const sendEmailVerification = useCallback(async () => {
    if (!sessionId || !contactDetails.email) {
      throw new Error('No onboarding session or email found');
    }

    try {
      setLoading(true);
      await onboardingApi.sendEmailVerification(sessionId, contactDetails.email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send email verification';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, contactDetails.email, setLoading, setError]);

  const verifyEmail = useCallback(async (code: string) => {
    if (!sessionId || !contactDetails.email) {
      throw new Error('No onboarding session or email found');
    }

    try {
      setLoading(true);
      const result = await onboardingApi.verifyEmail(sessionId, contactDetails.email, code);
      if (result.verified) {
        setEmailVerified(true);
      } else {
        throw new Error(result.message || 'Invalid verification code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, contactDetails.email, setEmailVerified, setLoading, setError]);

  // DISABLED: Phone verification feature is not implemented
  // The backend API for phone verification does not exist yet.
  // These functions throw errors to prevent usage until properly implemented.
  const sendPhoneVerification = useCallback(async () => {
    throw new Error('Phone verification is not available. This feature is coming soon.');
  }, []);

  const verifyPhone = useCallback(async (_code: string) => {
    throw new Error('Phone verification is not available. This feature is coming soon.');
  }, []);

  return {
    // State
    sessionId,
    currentStep,
    isLoading,
    error,
    validationErrors,
    businessInfo,
    contactDetails,
    businessAddress,
    emailVerified,
    phoneVerified,

    // Computed
    progress: getProgress(),

    // Actions
    initializeOnboarding,
    submitBusinessInfo,
    submitContactDetails,
    submitBusinessAddress,
    completeOnboarding,

    // Navigation
    setCurrentStep,
    nextStep,
    resetOnboarding,

    // Validation
    validateBusinessName,
    validateEmail,

    // Verification
    sendEmailVerification,
    verifyEmail,
    sendPhoneVerification,
    verifyPhone,

    // Error handling
    clearError: () => setError(null),
    clearValidationErrors: () => setValidationErrors({}),
  };
};
