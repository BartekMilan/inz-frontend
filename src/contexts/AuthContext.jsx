import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/auth.service';
import { Role, hasRole, isAdmin } from '../lib/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  // Get user role from user object
  const getUserRole = useCallback((userData) => {
    // Supabase user object has role in user_metadata (check this first!)
    if (userData?.user_metadata?.role) {
      return userData.user_metadata.role;
    }
    // Profile response from backend has role directly
    if (userData?.role && userData.role !== 'authenticated') {
      return userData.role;
    }
    // Default to registrar
    return Role.REGISTRAR;
  }, []);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (accessToken && storedUser) {
        try {
          // Verify token by fetching profile
          const profile = await authApi.getProfile();
          setUser(profile);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid - clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    const response = await authApi.login({ email, password });

    // Store tokens
    localStorage.setItem('accessToken', response.session.accessToken);
    localStorage.setItem('refreshToken', response.session.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Store assigned_project_id for registrars (if present)
    if (response.user?.assignedProjectId) {
      localStorage.setItem('assignedProjectId', response.user.assignedProjectId);
    }

    setUser(response.user);
    setIsAuthenticated(true);

    return response;
  }, []);

  // Register function
  const register = useCallback(async (data) => {
    const response = await authApi.register(data);
    return response;
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('assignedProjectId');
      setUser(null);
      setIsAuthenticated(false);
      // Clear all cached queries
      queryClient.clear();
    }
  }, [queryClient]);

  // Google login
  const loginWithGoogle = useCallback(async () => {
    const response = await authApi.getGoogleAuthUrl();
    window.location.href = response.url;
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (code) => {
    const response = await authApi.exchangeCode(code);

    // Store tokens
    localStorage.setItem('accessToken', response.session.accessToken);
    localStorage.setItem('refreshToken', response.session.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Store assigned_project_id for registrars (if present)
    if (response.user?.assignedProjectId) {
      localStorage.setItem('assignedProjectId', response.user.assignedProjectId);
    }

    setUser(response.user);
    setIsAuthenticated(true);

    return response;
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    const response = await authApi.resetPassword(email);
    return response;
  }, []);

  // Update password
  const updatePassword = useCallback(async (password) => {
    const response = await authApi.updatePassword(password);
    return response;
  }, []);

  // Get current user role
  const userRole = getUserRole(user);

  // Check if user has specific role(s)
  const checkRole = useCallback((allowedRoles) => {
    return hasRole(userRole, allowedRoles);
  }, [userRole]);

  // Check if current user is admin
  const checkIsAdmin = useCallback(() => {
    return isAdmin(userRole);
  }, [userRole]);

  const value = {
    user,
    userRole,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    loginWithGoogle,
    handleOAuthCallback,
    resetPassword,
    updatePassword,
    checkRole,
    checkIsAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
