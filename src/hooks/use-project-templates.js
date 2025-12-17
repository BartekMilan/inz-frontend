import { useQuery } from '@tanstack/react-query';
import { googleSheetsApi } from '../services/google-sheets.service';
import { useProject } from '../contexts/ProjectContext';

/**
 * Hook do pobierania szablonów dokumentów dla bieżącego projektu
 * @returns {Object} Query result z listą szablonów
 */
export function useProjectTemplates() {
  const { selectedProjectId } = useProject();

  return useQuery({
    queryKey: ['project-templates', selectedProjectId],
    queryFn: () => googleSheetsApi.getProjectTemplates(selectedProjectId),
    enabled: !!selectedProjectId, // Tylko jeśli projekt jest wybrany
    staleTime: 5 * 60 * 1000, // 5 minut (szablony rzadko się zmieniają)
  });
}

