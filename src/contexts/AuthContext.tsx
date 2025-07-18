import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignupCredentials, ForgotPasswordData } from '../types/auth';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<{ needsVerification: boolean; email: string }>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [logoutTimer, setLogoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [sessionRefreshTimer, setSessionRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  const scheduleAutoLogout = () => {
    if (logoutTimer) clearTimeout(logoutTimer);
    const timer = setTimeout(() => {
      logout();
      console.log('🔒 Auto-logged out after 24 hours');
    }, 24 * 60 * 60 * 1000); // 24 hours
    setLogoutTimer(timer);
  };

  const scheduleSessionRefresh = () => {
    if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
    // Refresh session every 45 minutes to prevent expiration during long operations
    const timer = setTimeout(async () => {
      try {
        await refreshSession();
        scheduleSessionRefresh(); // Schedule next refresh
      } catch (error) {
        console.error('Scheduled session refresh failed:', error);
      }
    }, 45 * 60 * 1000); // 45 minutes
    setSessionRefreshTimer(timer);
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        throw error;
      }
      console.log('✅ Session refreshed successfully');
      return data;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    const getInitialSession = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initial load timeout')), 8000)
        );

        const userPromise = authService.getCurrentUser();
        const user = await Promise.race([userPromise, timeoutPromise]) as User | null;

        if (mounted && !initialLoadComplete) {
          setAuthState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
          if (user) {
            scheduleAutoLogout();
            scheduleSessionRefresh();
          }
          initialLoadComplete = true;
        }
      } catch (error) {
        console.error('Initial session error:', error);
        if (mounted && !initialLoadComplete) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          initialLoadComplete = true;
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        console.log('Auth state changed:', event);

        if (initialLoadComplete) {
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const user = await authService.getCurrentUser();
              setAuthState({
                user,
                isAuthenticated: !!user,
                isLoading: false,
              });
              scheduleAutoLogout();
              scheduleSessionRefresh();
            } catch (error) {
              console.error('Error getting user after sign in:', error);
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else if (event === 'SIGNED_OUT') {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            if (logoutTimer) clearTimeout(logoutTimer);
            if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Don't change loading state on token refresh, just log it
            console.log('✅ Token refreshed automatically');
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
            }));
          }
        }
      }
    );

    const fallbackTimeout = setTimeout(() => {
      if (mounted && !initialLoadComplete) {
        console.log('Fallback: Setting loading to false');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
        initialLoadComplete = true;
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      if (logoutTimer) clearTimeout(logoutTimer);
      if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      await authService.login(credentials);
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      const result = await authService.signup(credentials);
      if (!result.needsVerification) {
        // auto-logged in
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      return result;
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (logoutTimer) clearTimeout(logoutTimer);
      if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    await authService.forgotPassword(data);
  };

  const resetPassword = async (newPassword: string) => {
    await authService.resetPassword(newPassword);
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};