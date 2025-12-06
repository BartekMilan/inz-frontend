import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOAuthCallback } from '../hooks/use-auth';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../lib/roles';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const { mutate: exchangeCode, isPending, error: oauthError } = useOAuthCallback();
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect when authenticated
  // Note: For registrars, redirect is handled in useOAuthCallback hook to ensure
  // project context is initialized before navigation
  useEffect(() => {
    if (isAuthenticated) {
      // Only redirect if not already redirected by useOAuthCallback hook
      // Check if we're still on callback page (means useOAuthCallback didn't redirect)
      if (window.location.pathname === '/auth/callback') {
        const defaultPath = userRole === Role.ADMIN ? '/users' : '/participants';
        navigate(defaultPath, { replace: true });
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  // Handle OAuth callback errors
  useEffect(() => {
    if (oauthError) {
      const errorResponse = oauthError.response;
      if (errorResponse?.status === 403) {
        const errorCode = errorResponse.data?.code;
        if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
          setErrorMessage("Twoje konto zostało utworzone, ale oczekuje na zatwierdzenie przez administratora. Skontaktuj się z organizatorem wydarzenia.");
        } else if (errorCode === 'NO_PROJECT_ASSIGNED') {
          setErrorMessage("Twoje konto nie ma przypisanego projektu. Skontaktuj się z organizatorem wydarzenia.");
        } else {
          setErrorMessage(errorResponse.data?.message || "Brak dostępu do konta. Skontaktuj się z organizatorem wydarzenia.");
        }
      } else {
        setErrorMessage(oauthError.response?.data?.message || "Nie udało się zalogować");
      }
    }
  }, [oauthError]);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('OAuth error:', error, errorDescription);
      navigate('/login', { 
        state: { error: errorDescription || 'Wystąpił błąd podczas logowania' } 
      });
      return;
    }

    if (code) {
      exchangeCode(code);
    } else {
      navigate('/login');
    }
  }, [searchParams, exchangeCode, navigate]);

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
              onClick={() => navigate('/login')}
              className="text-primary hover:underline"
            >
              Wróć do strony logowania
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Logowanie...</p>
      </div>
    </div>
  );
}
