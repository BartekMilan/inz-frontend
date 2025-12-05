import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, checkRole, user, userRole } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute render:', { 
    isLoading, 
    isAuthenticated, 
    user: !!user, 
    userRole, 
    allowedRoles,
    checkRoleResult: allowedRoles ? checkRole(allowedRoles) : 'no roles specified',
    path: location.pathname
  });

  // Show loading while auth is initializing OR when authenticated but user data not yet available
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles are specified
  if (allowedRoles && allowedRoles.length > 0 && !checkRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <ShieldX className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Brak dostępu</h1>
          <p className="text-muted-foreground max-w-md">
            Nie masz uprawnień do wyświetlenia tej strony. 
            Skontaktuj się z administratorem, jeśli uważasz, że to błąd.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
