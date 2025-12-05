import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOAuthCallback } from '../hooks/use-auth';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../lib/roles';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();
  const { mutate: exchangeCode, isPending } = useOAuthCallback();

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const defaultPath = userRole === Role.ADMIN ? '/users' : '/participants';
      navigate(defaultPath, { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Logowanie...</p>
      </div>
    </div>
  );
}
