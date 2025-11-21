'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import { clearAllUserData } from '@/lib/store';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  authenticate: () => Promise<void>; // Combined login/register attempt
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    setIsAuthenticated(data.authenticated);
    setUserId(data.userId || null);
  };

  const register = async () => {
    try {
      // Start registration
      const startRes = await fetch('/api/auth/register/start', {
        method: 'POST',
      });
      if (!startRes.ok) throw new Error('Failed to start registration');
      const options = await startRes.json();

      // Use WebAuthn
      const attResp = await startRegistration(options);

      // Finish registration
      const finishRes = await fetch('/api/auth/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });
      if (!finishRes.ok) throw new Error('Failed to finish registration');

      await checkAuth();
    } catch (e) {
      alert('Registration failed: ' + (e as Error).message);
      // Ensure any pending session state is cleared if registration aborted mid-flow
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
      try {
        await checkAuth();
      } catch {}
    }
  };

  const login = async () => {
    try {
      // Start authentication
      const startRes = await fetch('/api/auth/login/start', { method: 'POST' });
      if (!startRes.ok) throw new Error('Failed to start login');
      const options = await startRes.json();

      // Use WebAuthn
      const attResp = await startAuthentication(options);

      // Finish authentication
      const finishRes = await fetch('/api/auth/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });
      if (!finishRes.ok) throw new Error('Failed to finish login');

      await checkAuth();
    } catch (e) {
      alert('Login failed: ' + (e as Error).message);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUserId(null);
    // Clear all locally cached user data on logout
    clearAllUserData();
  };

  // Try login first; if still unauthenticated attempt registration
  const authenticate = async () => {
    if (isAuthenticated) return;
    const before = isAuthenticated;
    await login();
    if (!isAuthenticated && !before) {
      await register();
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userId, login, register, logout, authenticate }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
