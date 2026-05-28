'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { authAPI } from '@/lib/api-client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial auth check

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('aadhaar_user');
      const storedToken = localStorage.getItem('aadhaar_token');
      if (storedUser && storedToken) {
        try {
          // Validate token against the server
          const response = await fetch('/api/auth/session', {
            headers: { 'Authorization': `Bearer ${storedToken}` },
          });
          const data = await response.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
            localStorage.setItem('aadhaar_user', JSON.stringify(data.data.user));
          } else {
            // Token expired or invalid — clear auth state instead of using stale cache
            setUser(null);
            localStorage.removeItem('aadhaar_user');
            localStorage.removeItem('aadhaar_token');
          }
        } catch (error) {
          // Network error — use cached user as offline fallback
          console.error('Session check failed, using cached user:', error);
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('aadhaar_user');
            localStorage.removeItem('aadhaar_token');
          }
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('aadhaar_user', JSON.stringify(response.data.user));
        localStorage.setItem('aadhaar_token', response.data.token);
        toast.success('Successfully logged in!');
      } else {
        toast.error(response.error || 'Login failed');
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(email, password, name);
      if (response.success && response.data) {
        const { user: newUser, token } = response.data;
        setUser(newUser);
        localStorage.setItem('aadhaar_user', JSON.stringify(newUser));
        if (token) localStorage.setItem('aadhaar_token', token);
        toast.success('Account created successfully!');
      } else {
        toast.error(response.error || 'Registration failed');
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
      setUser(null);
      localStorage.removeItem('aadhaar_user');
      localStorage.removeItem('aadhaar_token');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
