import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../lib/roles';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ============================================================================
// AUTH CALLBACK PAGE
// 
// Ta strona jest bardzo prosta - renderuje tylko loader.
// 
// Po przekierowaniu z Google, Supabase automatycznie:
// 1. Parsuje tokeny z URL
// 2. Zapisuje sesję
// 3. Emituje event 'SIGNED_IN' do onAuthStateChange
// 
// AuthContext nasłuchuje na ten event i automatycznie:
// 1. Pobiera profil z backendu
// 2. Aktualizuje stan (isAuthenticated = true)
// 
// ProtectedRoute (lub logika poniżej) przekieruje użytkownika do /dashboard
// ============================================================================

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading, userRole } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  // Sprawdź błędy w URL (np. użytkownik anulował logowanie)
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.log('[AuthCallbackPage] ❌ Błąd z Google:', { error, errorDescription });
      setErrorMessage(errorDescription || 'Wystąpił błąd podczas logowania');
    }
  }, [searchParams]);

  // Przekieruj gdy użytkownik jest zalogowany
  useEffect(() => {
    // Czekaj aż AuthContext zakończy ładowanie
    if (loading) {
      console.log('[AuthCallbackPage] ⏳ Czekam na AuthContext...');
      return;
    }

    // Jeśli zalogowany - przekieruj
    if (isAuthenticated && user) {
      console.log('[AuthCallbackPage] ✅ Użytkownik zalogowany, przekierowuję...', { userRole });
      
      // Sprawdź czy użytkownik jest zatwierdzony
      if (user?.isApproved === false) {
        navigate('/pending-approval', { replace: true });
        return;
      }
      
      // Przekierowanie zależne od roli
      if (userRole === Role.REGISTRAR) {
        // REGISTRAR -> od razu do uczestników przypisanego projektu
        const projectId = user.assignedProjectId;
        if (projectId) {
          console.log('[AuthCallbackPage] REGISTRAR -> /participants (projekt:', projectId, ')');
          navigate('/participants', { replace: true });
        } else {
          // Brak przypisanego projektu - przekieruj na participants (ProjectContext obsłuży)
          console.log('[AuthCallbackPage] REGISTRAR bez przypisanego projektu -> /participants');
          navigate('/participants', { replace: true });
        }
      } else {
        // ADMIN i inni -> dashboard
        console.log('[AuthCallbackPage] ADMIN -> /dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
    
    // Jeśli nie ma błędu i nie jest zalogowany - poczekaj jeszcze chwilę
    // (Supabase może jeszcze przetwarzać tokeny z URL)
  }, [isAuthenticated, user, loading, navigate, userRole]);

  // Timeout - jeśli po 10 sekundach nie jesteśmy zalogowani, coś poszło nie tak
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated && !errorMessage) {
        console.warn('[AuthCallbackPage] ⏰ Timeout - przekierowuję do logowania');
        navigate('/login', { 
          state: { error: 'Nie udało się przetworzyć logowania. Spróbuj ponownie.' },
          replace: true,
        });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, errorMessage, navigate]);

  // Wyświetl błąd jeśli wystąpił
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="text-primary hover:underline"
            >
              Wróć do strony logowania
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Domyślnie - loader
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Logowanie...</p>
      </div>
    </div>
  );
}
