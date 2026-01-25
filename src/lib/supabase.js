import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT
// Centralny klient Supabase do autoryzacji i komunikacji z API
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Walidacja zmiennych środowiskowych
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Brak zmiennych środowiskowych VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY'
  );
}

// Tworzymy singleton klienta Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatyczne odświeżanie tokenów
    autoRefreshToken: true,
    // Persystencja sesji w localStorage
    persistSession: true,
    // Wykrywanie sesji z URL (dla OAuth callback)
    detectSessionInUrl: true,
    // Klucz w localStorage
    storageKey: 'eventsync-auth',
  },
});

export default supabase;
