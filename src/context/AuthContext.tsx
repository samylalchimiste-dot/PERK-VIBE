import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { subscribeAuthState, loginAdmin, registerAdmin, logoutAdmin } from '../services/firebase/auth';

export const MASTER_ADMIN_PASSCODE = 'OMERTA2026';
const SESSION_STORAGE_KEY = 'pvf_admin_master_session';

const MASTER_USER_RECORD: AdminUser = {
  uid: 'master-admin-omerta',
  email: 'admin@perkvibesfarmz.com',
  displayName: 'Admin Perk Vibes Farmz (OMERTA2026)',
  role: 'owner',
  active: true,
};

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<AdminUser>;
  unlockWithPasscode: (passcode: string) => boolean;
  register: (email: string, pass: string, displayName?: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored === MASTER_ADMIN_PASSCODE) {
        return MASTER_USER_RECORD;
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If master passcode is already active from storage, keep it
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored === MASTER_ADMIN_PASSCODE) {
        setUser(MASTER_USER_RECORD);
        setIsLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    const unsubscribe = subscribeAuthState((adminUser, loading) => {
      // Don't overwrite master session if present
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored === MASTER_ADMIN_PASSCODE) {
        setUser(MASTER_USER_RECORD);
        setIsLoading(false);
        return;
      }

      setUser(adminUser);
      setIsLoading(loading);
    });

    return () => unsubscribe();
  }, []);

  const handleUnlockWithPasscode = (passcode: string): boolean => {
    const clean = passcode.trim();
    if (clean === MASTER_ADMIN_PASSCODE || clean.toUpperCase() === MASTER_ADMIN_PASSCODE) {
      setUser(MASTER_USER_RECORD);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, MASTER_ADMIN_PASSCODE);
        localStorage.setItem(SESSION_STORAGE_KEY, MASTER_ADMIN_PASSCODE);
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  };

  const handleLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      // Check if user entered master password in password field
      const cleanPass = pass.trim();
      if (cleanPass === MASTER_ADMIN_PASSCODE || cleanPass.toUpperCase() === MASTER_ADMIN_PASSCODE) {
        handleUnlockWithPasscode(MASTER_ADMIN_PASSCODE);
        return MASTER_USER_RECORD;
      }

      const loggedUser = await loginAdmin(email, pass);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, pass: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const regUser = await registerAdmin(email, pass, displayName);
      setUser(regUser);
      return regUser;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      await logoutAdmin();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user && user.active),
        login: handleLogin,
        unlockWithPasscode: handleUnlockWithPasscode,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
