import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { authApi } from '../services/auth.service';
import { Role, hasRole, isAdmin } from '../lib/roles';

// ============================================================================
// AUTH CONTEXT - Supabase Auth Integration
// Używa onAuthStateChange do śledzenia sesji i automatycznego odświeżania
// ============================================================================

// Timeout dla inicjalizacji (5 sekund)
const AUTH_INIT_TIMEOUT = 5000;

/**
 * @typedef {Object} AuthContextValue
 * @property {Object|null} user - Zalogowany użytkownik (dane z backendu + Supabase)
 * @property {Object|null} session - Sesja Supabase (tokeny)
 * @property {boolean} loading - Czy trwa ładowanie stanu auth
 * @property {boolean} isApproved - Czy użytkownik jest zatwierdzony
 * @property {boolean} isAuthenticated - Czy użytkownik jest zalogowany
 * @property {string} userRole - Rola użytkownika
 * @property {Function} loginWithGoogle - Funkcja logowania przez Google
 * @property {Function} signOut - Funkcja wylogowania
 * @property {Function} checkRole - Sprawdzenie roli
 * @property {Function} checkIsAdmin - Czy admin
 */

// Tworzymy context
export const AuthContext = createContext(null);

// ============================================================================
// AUTH PROVIDER
// ============================================================================
export function AuthProvider({ children }) {
  // === STAN ===
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Ref do śledzenia czy init już się zakończył (żeby uniknąć podwójnego setLoading)
  const initCompletedRef = useRef(false);

  const queryClient = useQueryClient();

  // === HELPER: Pobierz rolę użytkownika ===
  const getUserRole = useCallback((userData) => {
    if (userData?.user_metadata?.role) {
      return userData.user_metadata.role;
    }
    if (userData?.role && userData.role !== 'authenticated') {
      return userData.role;
    }
    return Role.REGISTRAR;
  }, []);

  // === HELPER: Normalizuj dane użytkownika ===
  const normalizeUser = useCallback((userData) => {
    if (!userData) return null;
    
    return {
      ...userData,
      isApproved:
        userData?.isApproved ??
        userData?.is_approved ??
        userData?.user_metadata?.is_approved ??
        false,
      // Mapowanie assigned_project_id -> assignedProjectId (dla REGISTRAR)
      assignedProjectId:
        userData?.assignedProjectId ??
        userData?.assigned_project_id ??
        null,
    };
  }, []);

  // === HELPER: Wyczyść stan auth ===
  const clearAuthState = useCallback(() => {
    console.log('Auth: Clearing auth state');
    setSession(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsApproved(false);
  }, []);

  // ============================================================================
  // FETCH PROFILE - Pobierz profil z backendu (zawiera isApproved, rolę, etc.)
  // ============================================================================
  const fetchUserProfile = useCallback(async () => {
    console.log('Auth: Fetching profile...');
    
    try {
      const profile = await authApi.getProfile();
      const normalizedUser = normalizeUser(profile);
      
      console.log('Auth: Profile fetched successfully', {
        id: normalizedUser?.id,
        email: normalizedUser?.email,
        isApproved: normalizedUser?.isApproved,
        role: getUserRole(normalizedUser),
      });

      setUser(normalizedUser);
      setIsApproved(normalizedUser?.isApproved ?? false);
      
      return normalizedUser;
    } catch (error) {
      console.error('Auth: Profile error', error?.response?.status, error?.message);
      
      // Resetuj stan usera (ale sesja Supabase może być nadal aktywna)
      setUser(null);
      setIsApproved(false);
      
      throw error;
    }
  }, [normalizeUser, getUserRole]);

  // ============================================================================
  // HANDLE SESSION CHANGE - Reaguj na zmiany sesji Supabase
  // ============================================================================
  const handleSessionChange = useCallback(async (newSession) => {
    console.log('Auth: Session change', newSession ? 'ACTIVE' : 'NONE');
    
    if (newSession) {
      console.log('Auth: Session found', { 
        userId: newSession.user?.id,
        email: newSession.user?.email,
        expiresAt: newSession.expires_at,
      });
      
      setSession(newSession);
      setIsAuthenticated(true);
      
      // Pobierz profil z backendu (zawiera isApproved, rolę, assignedProjectId)
      try {
        await fetchUserProfile();
      } catch (error) {
        const status = error?.response?.status;
        
        // Jeśli backend zwraca 401/403 - sesja jest nieważna, wyloguj
        if (status === 401 || status === 403) {
          console.error('Auth: Backend rejected session (401/403), signing out...');
          
          // Wyloguj z Supabase
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.warn('Auth: SignOut error (ignored)', signOutError?.message);
          }
          
          clearAuthState();
        } else {
          // Inny błąd (np. 500, network) - użytkownik jest zalogowany, ale nie mamy profilu
          // Zostawiamy isAuthenticated = true, ale user = null
          console.warn('Auth: Profile fetch failed, but keeping session');
        }
      }
    } else {
      // Brak sesji - wyczyść stan
      clearAuthState();
    }
  }, [fetchUserProfile, clearAuthState]);

  // ============================================================================
  // INICJALIZACJA - Sprawdź sesję i ustaw nasłuchiwanie
  // ============================================================================
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    console.log('Auth: Start init');
    
    // TIMEOUT SAFETY - jeśli init trwa za długo, wymuś zakończenie
    timeoutId = setTimeout(() => {
      if (isMounted && !initCompletedRef.current) {
        console.error('Auth: TIMEOUT - forcing init complete after', AUTH_INIT_TIMEOUT, 'ms');
        clearAuthState();
        initCompletedRef.current = true;
        setLoading(false);
      }
    }, AUTH_INIT_TIMEOUT);
    
    const initAuth = async () => {
      try {
        // 1. Sprawdź czy jest istniejąca sesja (np. po odświeżeniu strony)
        console.log('Auth: Checking existing session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth: getSession error', error.message);
          throw error;
        }
        
        const existingSession = data?.session;
        
        if (!isMounted) {
          console.log('Auth: Component unmounted, aborting');
          return;
        }
        
        if (existingSession) {
          console.log('Auth: Existing session found');
          await handleSessionChange(existingSession);
        } else {
          console.log('Auth: No existing session');
          clearAuthState();
        }
        
      } catch (error) {
        console.error('Auth: Init error', error?.message);
        
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        // KLUCZOWE: Dopiero tutaj kończymy loading - po całym procesie inicjalizacji
        if (isMounted && !initCompletedRef.current) {
          console.log('Auth: INIT COMPLETE (finally block)');
          initCompletedRef.current = true;
          setLoading(false);
        }
      }
    };

    // 2. Ustaw nasłuchiwanie na zmiany stanu autoryzacji
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth: Event received', event);
        
        if (!isMounted) {
          console.log('Auth: Component unmounted, ignoring event');
          return;
        }
        
        // Ignoruj eventy podczas inicjalizacji - getSession() już to obsługuje
        if (!initCompletedRef.current && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          console.log('Auth: Ignoring event during init (handled by getSession):', event);
          return;
        }
        
        switch (event) {
          case 'SIGNED_IN':
            // SIGNED_IN po zakończeniu init (np. po przekierowaniu z OAuth)
            console.log('Auth: SIGNED_IN event (post-init)');
            await handleSessionChange(newSession);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Auth: TOKEN_REFRESHED event');
            // Tylko aktualizuj sesję, nie zmieniaj loading
            setSession(newSession);
            break;
            
          case 'USER_UPDATED':
            console.log('Auth: USER_UPDATED event');
            await handleSessionChange(newSession);
            break;
            
          case 'SIGNED_OUT':
            console.log('Auth: SIGNED_OUT event');
            clearAuthState();
            queryClient.clear();
            break;
            
          case 'INITIAL_SESSION':
            // Już obsłużone przez getSession() lub ignorowane powyżej
            console.log('Auth: INITIAL_SESSION event (ignored)');
            break;
            
          default:
            console.log('Auth: Unhandled event', event);
        }
      }
    );

    initAuth();

    // Cleanup
    return () => {
      console.log('Auth: Cleanup');
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
    };
  }, [handleSessionChange, clearAuthState, queryClient]);

  // === DEBUG: Loguj zmiany stanu ===
  useEffect(() => {
    console.log('Auth: State updated', {
      user: user ? { id: user.id, email: user.email } : null,
      isAuthenticated,
      isApproved,
      loading,
      userRole: user ? getUserRole(user) : null,
      hasSession: !!session,
    });
  }, [user, isAuthenticated, isApproved, loading, getUserRole, session]);

  // ============================================================================
  // AKCJE AUTORYZACJI
  // ============================================================================

  // === GOOGLE LOGIN - Przekierowanie do Google OAuth przez Supabase ===
  const loginWithGoogle = useCallback(async () => {
    console.log('Auth: Starting Google OAuth...');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Dodatkowe scopes jeśli potrzebne (np. do Google Sheets)
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('Auth: Google OAuth error', error.message);
        throw error;
      }
      
      // Supabase automatycznie przekieruje do Google
    } catch (error) {
      console.error('Auth: Google OAuth failed', error?.message);
      throw error;
    }
  }, []);

  // === SIGN OUT - Wylogowanie przez Supabase ===
  const signOut = useCallback(async () => {
    console.log('Auth: Signing out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Auth: SignOut Supabase error', error.message);
      }
    } catch (error) {
      console.warn('Auth: SignOut error (ignored)', error?.message);
    } finally {
      // Zawsze wyczyść stan lokalnie (nawet jeśli Supabase zwróci błąd)
      clearAuthState();
      
      // Wyczyść cache React Query
      queryClient.clear();
      
      console.log('Auth: Signed out');
    }
  }, [queryClient, clearAuthState]);

  // ============================================================================
  // POMOCNICZE - ROLE
  // ============================================================================
  const userRole = getUserRole(user);

  const checkRole = useCallback((allowedRoles) => {
    return hasRole(userRole, allowedRoles);
  }, [userRole]);

  const checkIsAdmin = useCallback(() => {
    return isAdmin(userRole);
  }, [userRole]);

  // ============================================================================
  // WARTOŚĆ KONTEKSTU
  // ============================================================================
  const value = {
    // Stan
    user,
    session,
    loading,
    isLoading: loading, // Alias dla kompatybilności wstecznej
    isApproved,
    isAuthenticated,
    userRole,
    
    // Akcje
    loginWithGoogle,
    signOut,
    logout: signOut, // Alias dla kompatybilności wstecznej
    
    // Helpers
    checkRole,
    checkIsAdmin,
    
    // Funkcja do odświeżenia profilu (przydatna po zmianach w backendzie)
    refreshProfile: fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// useAuth HOOK - Prosty hook do używania kontekstu
// ============================================================================
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined || context === null) {
    throw new Error(
      '[useAuth] Hook musi być użyty wewnątrz <AuthProvider>. ' +
      'Upewnij się, że komponent jest opakowany w AuthProvider.'
    );
  }
  
  return context;
}

// WAŻNE: Brak export default - tylko named exports dla Vite Fast Refresh
