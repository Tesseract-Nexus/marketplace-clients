import React, { useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Toast, subscribeToFallbackToast } from '@/components/ui/Toast';

interface ToastProviderProps {
  children: ReactNode;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  title: string;
  message?: string;
  type?: ToastType;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toastState, setToastState] = useState<ToastState>({
    visible: false,
    title: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeToFallbackToast((visible, title, message, type) => {
      setToastState({ visible, title, message, type });
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      {children}
      {toastState.visible ? (
        <View pointerEvents="box-none" style={styles.toastContainer}>
          <Toast
            message={toastState.message}
            title={toastState.title}
            type={toastState.type}
            onDismiss={() => setToastState({ ...toastState, visible: false })}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
