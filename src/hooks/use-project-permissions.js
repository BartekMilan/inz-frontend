import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/lib/roles';

/**
 * Hook do zarządzania uprawnieniami użytkownika w projekcie
 * Uwzględnia zarówno role projektowe (owner/editor/viewer) jak i systemowe (ADMIN/REGISTRAR)
 * @returns {Object} Obiekt z flagami uprawnień
 */
export function useProjectPermissions() {
  const { myRole } = useProject();
  const { userRole } = useAuth();

  const permissions = useMemo(() => {
    // REGISTRAR (rola systemowa) - zawsze ma prawo edycji danych uczestników
    const isRegistrar = userRole === Role.REGISTRAR;
    
    // Domyślnie brak uprawnień (jeśli brak roli projektowej i nie jest REGISTRAR)
    if (!myRole && !isRegistrar) {
      return {
        canManageProject: false,
        canEditData: false,
        isAuditor: false,
        role: null,
      };
    }

    const projectRole = myRole?.toLowerCase() || null;

    return {
      // Owner: pełny dostęp (Ustawienia, Zespół, edycja danych)
      canManageProject: projectRole === 'owner',
      
      // Owner, Editor LUB REGISTRAR (systemowy): mogą edytować dane uczestników
      // REGISTRAR to specjalna rola systemowa do szybkiej obsługi uczestników
      canEditData: projectRole === 'owner' || projectRole === 'editor' || isRegistrar,
      
      // Viewer: tylko podgląd
      isAuditor: projectRole === 'viewer',
      
      // Rola użytkownika w projekcie
      role: projectRole,
    };
  }, [myRole, userRole]);

  return permissions;
}

export default useProjectPermissions;

