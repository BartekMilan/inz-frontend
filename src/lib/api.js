import axios from 'axios';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ============================================================================
// REQUEST INTERCEPTOR - Pobiera token z Supabase
// ============================================================================
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Pobierz aktualną sesję z Supabase (zawsze świeży token)
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('[API] ⚠️ Błąd pobierania sesji Supabase:', error.message);
      }
      
      const token = data.session?.access_token;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API] ⚠️ Błąd w interceptorze:', error.message);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR - Obsługa błędów 401
// ============================================================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jeśli 401 i nie próbowaliśmy jeszcze refreshować
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Supabase automatycznie odświeża token, więc spróbujmy ponownie
        const { data, error: refreshError } = await supabase.auth.getSession();
        
        if (refreshError || !data.session) {
          // Token nieważny - wyloguj użytkownika
          console.warn('[API] ⚠️ Sesja wygasła - wylogowanie');
          await supabase.auth.signOut();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Mamy nowy token - ponów request
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Refresh się nie powiódł - wyloguj
        console.error('[API] ❌ Błąd odświeżania tokena:', refreshError);
        await supabase.auth.signOut();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
