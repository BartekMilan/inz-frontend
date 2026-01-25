import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';

/**
 * ProtectedRoute - Komponent chroniący trasy
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Zawartość do wyrenderowania
 * @param {string[]} [props.allowedRoles] - Dozwolone role (opcjonalne)
 * @param {boolean} [props.requireApproval=true] - Czy wymagać zatwierdzenia użytkownika
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireApproval = true 
}) {
  const { 
    isAuthenticated, 
    loading, 
    isApproved,
    checkRole, 
    user, 
    userRole 
  } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('[ProtectedRoute] 🔒 Render:', { 
    loading, 
    isAuthenticated, 
    isApproved,
    user: user ? { id: user.id, email: user.email } : null, 
    userRole, 
    allowedRoles,
    requireApproval,
    checkRoleResult: allowedRoles ? checkRole(allowedRoles) : 'no roles specified',
    path: location.pathname
  });

  // === 1. LOADING STATE ===
  // KLUCZOWE: Pokaż loading dopóki AuthContext nie zakończy inicjalizacji (getSession)
  // To rozwiązuje race condition przy F5 - nie sprawdzamy isAuthenticated dopóki loading=true
  if (loading) {
    console.log('[ProtectedRoute] ⏳ Loading (waiting for auth init)...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // === 2. NOT AUTHENTICATED ===
  // Przekieruj do logowania, zachowując docelową lokalizację
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] 🚫 Brak autoryzacji -> /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // === 3. NOT APPROVED (jeśli wymagane) ===
  // Przekieruj do pending-approval jeśli user jest zalogowany ale niezatwierdzony
  // UWAGA: Nie przekierowujemy jeśli już jesteśmy na /pending-approval
  if (requireApproval && !isApproved && location.pathname !== '/pending-approval') {
    console.log('[ProtectedRoute] ⏸️ Użytkownik niezatwierdzony -> /pending-approval');
    return <Navigate to="/pending-approval" replace />;
  }

  // === 4. ROLE CHECK ===
  // Sprawdź role jeśli określone
  if (allowedRoles && allowedRoles.length > 0 && !checkRole(allowedRoles)) {
    console.log('[ProtectedRoute] 🛡️ Brak uprawnień dla roli:', userRole);
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

  // === 5. RENDER CHILDREN ===
  console.log('[ProtectedRoute] ✅ Dostęp przyznany');
  return children;
}
