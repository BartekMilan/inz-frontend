import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateMappingsApi } from '../services/template-mappings.service';
import { useProject } from '../contexts/ProjectContext';

/**
 * Hook do pobierania mapowań placeholderów dla szablonu
 * @param {string} templateId - ID szablonu
 * @returns {Object} Query result z mapowaniami
 */
export function useTemplateMappings(templateId) {
  const { selectedProjectId } = useProject();

  return useQuery({
    queryKey: ['templateMappings', selectedProjectId, templateId],
    queryFn: () => templateMappingsApi.getTemplateMappings(selectedProjectId, templateId),
    enabled: !!selectedProjectId && !!templateId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook do zapisywania mapowań placeholderów dla szablonu
 * @returns {Object} Mutation object
 */
export function useSetTemplateMappings() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, mappings }) =>
      templateMappingsApi.setTemplateMappings(selectedProjectId, templateId, mappings),
    onSuccess: (_, variables) => {
      // Odśwież query dla tego szablonu
      queryClient.invalidateQueries({
        queryKey: ['templateMappings', selectedProjectId, variables.templateId],
      });
    },
  });
}

