import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../types';
import { authApi, getErrorMessage } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  isViewer: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  logout: () => Promise<void>;
  quickLoginAsRole: (role: Role) => Promise<void>;
}

const PRESEEDED_ACCOUNTS: Record<Role, { email: string; pass: string }> = {
  Admin: { email: 'admin@famt.dev', pass: 'Password123!' },
  Technician: { email: 'tech@famt.dev', pass: 'Password123!' },
  Viewer: { email: 'viewer@famt.dev', pass: 'Password123!' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('famt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('famt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();

  // Validate existing token on boot
  useEffect(() => {
    let mounted = true;
    const verifySession = async () => {
      const storedToken = localStorage.getItem('famt_token');
      if (!storedToken) {
        if (mounted) setIsLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        if (mounted) {
          setUser(res.user);
          localStorage.setItem('famt_user', JSON.stringify(res.user));
        }
      } catch {
        if (mounted) {
          localStorage.removeItem('famt_token');
          localStorage.removeItem('famt_user');
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    verifySession();

    const handleAutoLogout = () => {
      setUser(null);
      setToken(null);
      toastInfo('Session expired. Please log in again.');
    };

    window.addEventListener('famt_auth_logout', handleAutoLogout);
    return () => {
      mounted = false;
      window.removeEventListener('famt_auth_logout', handleAutoLogout);
    };
  }, [toastInfo]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        const data = await authApi.login(email, password);
        localStorage.setItem('famt_token', data.token);
        localStorage.setItem('famt_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        toastSuccess(`Welcome back, ${data.user.name}!`);
      } catch (err) {
        const msg = getErrorMessage(err);
        toastError(msg, 'Authentication Failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [toastError, toastSuccess]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role?: Role) => {
      try {
        setIsLoading(true);
        await authApi.register(name, email, password, role);
        toastSuccess('Account created successfully! Logging you in...');
        // Auto login after registration
        await login(email, password);
      } catch (err) {
        const msg = getErrorMessage(err);
        toastError(msg, 'Registration Failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login, toastError, toastSuccess]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // Ignore backend logout error
    } finally {
      localStorage.removeItem('famt_token');
      localStorage.removeItem('famt_user');
      setUser(null);
      setToken(null);
      toastInfo('Logged out successfully');
    }
  }, [token, toastInfo]);

  const quickLoginAsRole = useCallback(
    async (role: Role) => {
      const credentials = PRESEEDED_ACCOUNTS[role];
      if (credentials) {
        await login(credentials.email, credentials.pass);
      }
    },
    [login]
  );

  const isAdmin = user?.role === 'Admin';
  const isTechnician = user?.role === 'Technician';
  const isViewer = user?.role === 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isTechnician,
        isViewer,
        login,
        register,
        logout,
        quickLoginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
