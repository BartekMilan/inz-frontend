import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';

/**
 * Hook do zarządzania uprawnieniami użytkownika w projekcie
 * @returns {Object} Obiekt z flagami uprawnień
 */
export function useProjectPermissions() {
  const { myRole } = useProject();

  const permissions = useMemo(() => {
    // Domyślnie brak uprawnień (jeśli brak roli)
    if (!myRole) {
      return {
        canManageProject: false,
        canEditData: false,
        isAuditor: false,
        role: null,
      };
    }

    const role = myRole.toLowerCase();

    return {
      // Owner: pełny dostęp (Ustawienia, Zespół, edycja danych)
      canManageProject: role === 'owner',
      
      // Owner i Editor: mogą edytować dane (Generowanie, Sync, edycja uczestników)
      canEditData: role === 'owner' || role === 'editor',
      
      // Viewer: tylko podgląd
      isAuditor: role === 'viewer',
      
      // Rola użytkownika w projekcie
      role,
    };
  }, [myRole]);

  return permissions;
}

export default useProjectPermissions;

