'use client';

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 */
export function initializeFirebase(): FirebaseApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if Firebase is configured
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.warn('Firebase configuration missing. Push notifications disabled.');
    return null;
  }

  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0] ?? null;
  }

  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if messaging is supported in this browser
  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser.');
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      return null;
    }
  }

  if (!messaging) {
    messaging = getMessaging(firebaseApp);
  }

  return messaging;
}

/**
 * Request permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return null;
  }

  // Request permission
  const permission = await Notification.requestPermission();

  if (permission !== 'granted') {
    console.log('Notification permission denied.');
    return null;
  }

  const messagingInstance = await getFirebaseMessaging();
  if (!messagingInstance) {
    return null;
  }

  try {
    // Get the VAPID key from environment
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.warn('VAPID key not configured. Push notifications may not work.');
    }

    // Get the FCM token
    const token = await getToken(messagingInstance, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    }

    console.warn('No FCM token available.');
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Set up foreground message handler
 */
export async function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): Promise<(() => void) | null> {
  const messagingInstance = await getFirebaseMessaging();
  if (!messagingInstance) {
    return null;
  }

  return onMessage(messagingInstance, (payload) => {
    callback(payload);
  });
}

/**
 * Check if push notifications are supported
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('Notification' in window)) {
    return false;
  }

  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const supported = await isSupported();
  return supported;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): 'default' | 'granted' | 'denied' | 'unsupported' {
  if (typeof window === 'undefined') {
    return 'unsupported';
  }

  if (!('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
}
