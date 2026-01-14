'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { enhancedApiClient } from '@/lib/api/enhanced-client';
import { useAuth } from '@/lib/auth/auth-context';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  avatar?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  createdAt?: string;
  lastLoginAt?: string;
  vendorId?: string; // Vendor ID for marketplace isolation (Tenant -> Vendor -> Staff hierarchy)
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Partial<User>>({});

  // Track last synced user ID to prevent infinite re-renders
  // authUser object reference changes on every session check, but we only
  // want to update when the actual user ID changes
  const lastSyncedUserId = useRef<string | null>(null);

  // Sync user from AuthContext (BFF session) instead of localStorage
  // This ensures we use the correct Keycloak user ID for all API calls
  useEffect(() => {
    const authUserId = authUser?.id || null;

    // Only update if the user ID actually changed
    if (authUserId === lastSyncedUserId.current && authUserId !== null) {
      return;
    }

    lastSyncedUserId.current = authUserId;

    if (authUser) {
      // Map SessionUser from AuthContext to User interface
      const mappedUser: User = {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        displayName: authUser.displayName || authUser.name ||
          `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() ||
          authUser.email?.split('@')[0] || 'User',
        role: authUser.roles?.[0] || 'user',
        avatar: authUser.avatar || '',
        // Apply any local overrides (e.g., from profile updates)
        ...localOverrides,
      };
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  }, [authUser, localOverrides]);

  // Sync user with API client
  useEffect(() => {
    if (user) {
      enhancedApiClient.setUserInfo(user.id, user.displayName || null, user.role || 'user', user.email || null);
    } else {
      enhancedApiClient.setUserInfo(null, null, null, null);
    }
  }, [user]);

  const updateUser = useCallback((data: Partial<User>) => {
    // Store local overrides (e.g., for profile updates before next session refresh)
    setLocalOverrides(prev => ({ ...prev, ...data }));
  }, []);

  const refreshUser = useCallback(() => {
    // Clear local overrides to get fresh data from AuthContext
    setLocalOverrides({});
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    user,
    isLoading: authLoading,
    updateUser,
    refreshUser,
  }), [user, authLoading, updateUser, refreshUser]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
