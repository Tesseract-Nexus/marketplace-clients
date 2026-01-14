import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

interface BiometricsState {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
  securityLevel: LocalAuthentication.SecurityLevel | null;
}

interface BiometricsOptions {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  fallbackLabel?: string;
}

/**
 * Hook to manage biometric authentication
 */
export function useBiometrics() {
  const [state, setState] = useState<BiometricsState>({
    isAvailable: false,
    isEnrolled: false,
    biometricTypes: [],
    securityLevel: null,
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = useCallback(async () => {
    try {
      const [hasHardware, isEnrolled, supportedTypes, securityLevel] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        LocalAuthentication.getEnrolledLevelAsync(),
      ]);

      setState({
        isAvailable: hasHardware,
        isEnrolled: isEnrolled,
        biometricTypes: supportedTypes,
        securityLevel,
      });
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  }, []);

  const authenticate = useCallback(
    async (options: BiometricsOptions = {}): Promise<boolean> => {
      const {
        promptMessage = 'Authenticate to continue',
        cancelLabel = 'Cancel',
        disableDeviceFallback = false,
        fallbackLabel = 'Use Passcode',
      } = options;

      if (!state.isAvailable || !state.isEnrolled) {
        Alert.alert(
          'Biometrics Unavailable',
          'Please set up biometric authentication in your device settings.'
        );
        return false;
      }

      setIsAuthenticating(true);

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          cancelLabel,
          disableDeviceFallback,
          fallbackLabel,
        });

        return result.success;
      } catch (error) {
        console.error('Biometric authentication error:', error);
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [state.isAvailable, state.isEnrolled]
  );

  const getBiometricTypeName = useCallback((): string => {
    if (state.biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (state.biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (state.biometricTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometrics';
  }, [state.biometricTypes]);

  const hasFaceId = state.biometricTypes.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
  );

  const hasTouchId = state.biometricTypes.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT
  );

  return {
    ...state,
    isAuthenticating,
    authenticate,
    getBiometricTypeName,
    hasFaceId,
    hasTouchId,
    refresh: checkBiometrics,
  };
}

/**
 * Hook for simple biometric gate
 */
export function useBiometricGate(enabled: boolean = true) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { authenticate, isAvailable, isEnrolled } = useBiometrics();

  const requestAuth = useCallback(async () => {
    if (!enabled || !isAvailable || !isEnrolled) {
      setIsAuthenticated(true);
      return true;
    }

    const success = await authenticate({
      promptMessage: 'Authenticate to access',
    });

    setIsAuthenticated(success);
    return success;
  }, [enabled, isAvailable, isEnrolled, authenticate]);

  const resetAuth = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    requestAuth,
    resetAuth,
    isRequired: enabled && isAvailable && isEnrolled,
  };
}
