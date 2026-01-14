import { useState, useEffect, useCallback } from 'react';
import { Linking, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface PermissionState {
  camera: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
  location: PermissionStatus;
}

/**
 * Hook to manage app permissions
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'undetermined',
    mediaLibrary: 'undetermined',
    notifications: 'undetermined',
    location: 'undetermined',
  });

  const checkAllPermissions = useCallback(async () => {
    const [camera, mediaLibrary, notifications, location] = await Promise.all([
      ImagePicker.getCameraPermissionsAsync(),
      ImagePicker.getMediaLibraryPermissionsAsync(),
      Notifications.getPermissionsAsync(),
      Location.getForegroundPermissionsAsync(),
    ]);

    setPermissions({
      camera: camera.status as PermissionStatus,
      mediaLibrary: mediaLibrary.status as PermissionStatus,
      notifications: notifications.status as PermissionStatus,
      location: location.status as PermissionStatus,
    });
  }, []);

  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return {
    permissions,
    checkAllPermissions,
    openSettings,
  };
}

/**
 * Hook for camera permission
 */
export function useCameraPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  const checkPermission = useCallback(async () => {
    const result = await ImagePicker.getCameraPermissionsAsync();
    setStatus(result.status as PermissionStatus);
    return result.status === 'granted';
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    setStatus(result.status as PermissionStatus);

    if (result.status === 'denied') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in Settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return result.status === 'granted';
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    checkPermission,
    requestPermission,
  };
}

/**
 * Hook for media library permission
 */
export function useMediaLibraryPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  const checkPermission = useCallback(async () => {
    const result = await ImagePicker.getMediaLibraryPermissionsAsync();
    setStatus(result.status as PermissionStatus);
    return result.status === 'granted';
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setStatus(result.status as PermissionStatus);

    if (result.status === 'denied') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in Settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return result.status === 'granted';
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    checkPermission,
    requestPermission,
  };
}

/**
 * Hook for push notification permission
 */
export function useNotificationPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  const checkPermission = useCallback(async () => {
    const result = await Notifications.getPermissionsAsync();
    setStatus(result.status as PermissionStatus);
    return result.status === 'granted';
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Notifications.requestPermissionsAsync();
    setStatus(result.status as PermissionStatus);

    if (result.status === 'denied') {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications in Settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return result.status === 'granted';
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    checkPermission,
    requestPermission,
  };
}

/**
 * Hook for location permission
 */
export function useLocationPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  const checkPermission = useCallback(async () => {
    const result = await Location.getForegroundPermissionsAsync();
    setStatus(result.status as PermissionStatus);
    return result.status === 'granted';
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    setStatus(result.status as PermissionStatus);

    if (result.status === 'denied') {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access in Settings for location-based features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return result.status === 'granted';
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    checkPermission,
    requestPermission,
  };
}

/**
 * Hook to pick image with permission handling
 */
export function useImagePicker() {
  const cameraPermission = useCameraPermission();
  const mediaLibraryPermission = useMediaLibraryPermission();

  const pickFromCamera = useCallback(async (options?: ImagePicker.ImagePickerOptions) => {
    const hasPermission = await cameraPermission.requestPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      ...options,
    });

    if (result.canceled) return null;
    return result.assets[0];
  }, [cameraPermission]);

  const pickFromLibrary = useCallback(async (options?: ImagePicker.ImagePickerOptions) => {
    const hasPermission = await mediaLibraryPermission.requestPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      ...options,
    });

    if (result.canceled) return null;
    return result.assets[0];
  }, [mediaLibraryPermission]);

  return {
    pickFromCamera,
    pickFromLibrary,
    cameraPermission,
    mediaLibraryPermission,
  };
}
