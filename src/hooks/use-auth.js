import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/auth.service';
import { useToast } from './use-toast';
import { Role } from '../lib/roles';

// Login mutation hook
export function useLogin() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (response) => {
      // Get user role from response
      const userRole = response.user?.user_metadata?.role || response.user?.role;
      
      // For registrars, redirect to participants page
      // The assignedProjectId is already stored in localStorage by AuthContext
      // ProjectContext will automatically initialize from localStorage when it mounts
      if (userRole === Role.REGISTRAR && response.user?.assignedProjectId) {
        // Redirect to participants page immediately
        // ProjectContext will be available there and will initialize from localStorage
        navigate('/participants', { replace: true });
      }

      toast({
        title: 'Zalogowano pomyślnie',
        description: 'Witaj ponownie!',
      });
      
      // For non-registrars, navigation is handled by useEffect in LoginPage
      // based on isAuthenticated state change
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd logowania',
        description: error.response?.data?.message || 'Nieprawidłowy email lub hasło',
      });
    },
  });
}

// Register mutation hook
export function useRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data) => authApi.register(data),
    onSuccess: () => {
      toast({
        title: 'Rejestracja pomyślna',
        description: 'Sprawdź swoją skrzynkę email, aby potwierdzić konto.',
      });
      navigate('/login');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd rejestracji',
        description: error.response?.data?.message || 'Nie udało się utworzyć konta',
      });
    },
  });
}

// Logout mutation hook
export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      toast({
        title: 'Wylogowano',
        description: 'Do zobaczenia!',
      });
      navigate('/login');
    },
    onError: () => {
      // Even on error, we want to redirect
      navigate('/login');
    },
  });
}

// Reset password mutation hook
export function useResetPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (email) => authApi.resetPassword(email),
    onSuccess: () => {
      toast({
        title: 'Email wysłany',
        description: 'Sprawdź swoją skrzynkę email, aby zresetować hasło.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się wysłać emaila',
      });
    },
  });
}

// Update password mutation hook
export function useUpdatePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (password) => authApi.updatePassword(password),
    onSuccess: () => {
      toast({
        title: 'Hasło zmienione',
        description: 'Twoje hasło zostało pomyślnie zmienione.',
      });
      navigate('/login');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się zmienić hasła',
      });
    },
  });
}

// Google OAuth hook
export function useGoogleLogin() {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: loginWithGoogle,
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się połączyć z Google',
      });
    },
  });
}

// OAuth callback hook
export function useOAuthCallback() {
  const { handleOAuthCallback } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (code) => handleOAuthCallback(code),
    onSuccess: (response) => {
      // Get user role from response
      const userRole = response.user?.user_metadata?.role || response.user?.role;
      
      // For registrars, redirect to participants page
      // The assignedProjectId is already stored in localStorage by AuthContext
      // ProjectContext will automatically initialize from localStorage when it mounts
      if (userRole === Role.REGISTRAR && response.user?.assignedProjectId) {
        // Redirect to participants page immediately
        // ProjectContext will be available there and will initialize from localStorage
        navigate('/participants', { replace: true });
      }

      toast({
        title: 'Zalogowano pomyślnie',
        description: 'Witaj!',
      });
      
      // For non-registrars, navigation will be handled by AuthCallbackPage
      // based on isAuthenticated state change
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd logowania',
        description: error.response?.data?.message || 'Nie udało się zalogować',
      });
      navigate('/login');
    },
  });
}

// Get user profile query hook
export function useProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
