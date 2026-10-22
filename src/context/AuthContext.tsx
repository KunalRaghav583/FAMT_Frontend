import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../types';
import { authApi, getErrorMessage } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  realUser: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  isViewer: boolean;
  isRealAdmin: boolean;
  previewRole: Role | null;
  setRolePreview: (role: Role | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realUser, setRealUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('famt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('famt_token'));
  const [previewRole, setPreviewRole] = useState<Role | null>(() => {
    return (sessionStorage.getItem('famt_role_preview') as Role) || null;
  });
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
          setRealUser(res.user);
          localStorage.setItem('famt_user', JSON.stringify(res.user));
        }
      } catch {
        if (mounted) {
          localStorage.removeItem('famt_token');
          localStorage.removeItem('famt_user');
          setRealUser(null);
          setToken(null);
          setPreviewRole(null);
          sessionStorage.removeItem('famt_role_preview');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    verifySession();

    const handleAutoLogout = () => {
      setRealUser(null);
      setToken(null);
      setPreviewRole(null);
      sessionStorage.removeItem('famt_role_preview');
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
        setRealUser(data.user);
        setPreviewRole(null);
        sessionStorage.removeItem('famt_role_preview');
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
      sessionStorage.removeItem('famt_role_preview');
      setRealUser(null);
      setToken(null);
      setPreviewRole(null);
      toastInfo('Logged out successfully');
    }
  }, [token, toastInfo]);

  // Pure role simulation for Admin:
  // Admin stays 100% authenticated as Admin, but UI components render the simulated role
  const isRealAdmin = realUser?.role === 'Admin';
  const effectiveRole: Role | undefined = (isRealAdmin && previewRole) ? previewRole : realUser?.role;

  const user: User | null = realUser
    ? { ...realUser, role: effectiveRole || realUser.role }
    : null;

  const isAdmin = effectiveRole === 'Admin';
  const isTechnician = effectiveRole === 'Technician';
  const isViewer = effectiveRole === 'Viewer';

  const setRolePreview = useCallback(
    (role: Role | null) => {
      if (!isRealAdmin) return;
      if (!role || role === 'Admin') {
        setPreviewRole(null);
        sessionStorage.removeItem('famt_role_preview');
        toastSuccess('Returned to full Admin view');
      } else {
        setPreviewRole(role);
        sessionStorage.setItem('famt_role_preview', role);
        toastInfo(`Viewing UI as ${role === 'Technician' ? 'Technician (Tech)' : role}. Your Admin session remains active.`);
      }
    },
    [isRealAdmin, toastSuccess, toastInfo]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        realUser,
        token,
        isLoading,
        isAdmin,
        isTechnician,
        isViewer,
        isRealAdmin,
        previewRole,
        setRolePreview,
        login,
        register,
        logout,
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
