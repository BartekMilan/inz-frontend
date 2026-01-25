import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/auth.service';
import { useToast } from './use-toast';

// ============================================================================
// AUTH HOOKS - Zrefaktoryzowane dla Supabase Auth
// ============================================================================

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
      navigate('/login', { replace: true });
    },
    onError: () => {
      // Nawet przy błędzie chcemy przekierować
      navigate('/login', { replace: true });
    },
  });
}

// Google OAuth hook - teraz używa Supabase
export function useGoogleLogin() {
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: loginWithGoogle,
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd logowania',
        description: error.message || 'Nie udało się połączyć z Google',
      });
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

// ============================================================================
// DEPRECATED HOOKS - Zachowane dla kompatybilności wstecznej
// Nie są już używane z nowym flow Supabase Auth
// ============================================================================

/**
 * @deprecated Nie używane z Supabase Auth - logowanie email/password obsługiwane przez Supabase
 */
export function useLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => {
      throw new Error('useLogin jest deprecated - użyj useGoogleLogin lub Supabase Auth');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.message,
      });
    },
  });
}

/**
 * @deprecated Nie używane z Supabase Auth - rejestracja obsługiwana przez Supabase
 */
export function useRegister() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      throw new Error('useRegister jest deprecated - użyj Supabase Auth');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.message,
      });
    },
  });
}

/**
 * @deprecated Nie używane z nowym flow - onAuthStateChange obsługuje callback automatycznie
 */
export function useOAuthCallback() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      // Ten hook nie jest już potrzebny - Supabase obsługuje callback automatycznie
      console.warn('[useOAuthCallback] Ten hook jest deprecated - Supabase obsługuje callback automatycznie');
      return Promise.resolve();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.message || 'Nie udało się przetworzyć logowania',
      });
    },
  });
}

/**
 * @deprecated Reset hasła przez Supabase
 */
export function useResetPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      throw new Error('useResetPassword jest deprecated - użyj Supabase Auth');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.message,
      });
    },
  });
}

/**
 * @deprecated Update hasła przez Supabase
 */
export function useUpdatePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => {
      throw new Error('useUpdatePassword jest deprecated - użyj Supabase Auth');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.message,
      });
    },
  });
}
