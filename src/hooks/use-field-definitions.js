import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../services/projects.service';
import { useProject } from '../contexts/ProjectContext';

/**
 * Hook to fetch field definitions for the currently selected project
 * Uses field mappings (project_field_mappings) instead of field_definitions
 * because mappings are what's actually configured in Settings
 * Returns array of field definitions with structure:
 * {
 *   id, projectId, fieldName, fieldLabel, fieldType, columnIndex,
 *   isRequired, options, validationRules, displayOrder, isVisible
 * }
 * @returns {Object} Query result with field definitions
 */
export function useFieldDefinitions() {
  const { selectedProjectId } = useProject();

  // Debug: log projectId
  console.log('[useFieldDefinitions] selectedProjectId from useProject:', selectedProjectId);
  console.log('[useFieldDefinitions] selectedProjectId type:', typeof selectedProjectId);
  console.log('[useFieldDefinitions] selectedProjectId truthy?', !!selectedProjectId);

  const queryResult = useQuery({
    queryKey: ['fieldMappings', selectedProjectId], // Use same key as SettingsPage
    queryFn: async () => {
      console.log('[useFieldDefinitions] queryFn called with projectId:', selectedProjectId);
      if (!selectedProjectId) {
        console.error('[useFieldDefinitions] ERROR: selectedProjectId is null/undefined!');
        throw new Error('Project ID is required');
      }
      console.log('[useFieldDefinitions] Calling API: /projects/' + selectedProjectId + '/mappings');
      const rawData = await projectsApi.getMappings(selectedProjectId);
      console.log('[useFieldDefinitions] Raw API response (mappings):', rawData);
      console.log('[useFieldDefinitions] Raw API response type:', Array.isArray(rawData) ? 'Array' : typeof rawData);
      console.log('[useFieldDefinitions] Raw API response length:', Array.isArray(rawData) ? rawData.length : 'N/A');
      return rawData;
    },
    enabled: !!selectedProjectId, // Only fetch if project is selected
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      console.log('[useFieldDefinitions] select function called with data:', data);
      console.log('[useFieldDefinitions] select - data type:', typeof data);
      console.log('[useFieldDefinitions] select - is array?', Array.isArray(data));
      
      // Filter only visible fields and sort by displayOrder
      if (!data || !Array.isArray(data)) {
        console.log('[useFieldDefinitions] No data or not an array:', data);
        return [];
      }

      console.log('[useFieldDefinitions] Raw data before processing:', data);
      console.log('[useFieldDefinitions] Raw data length:', data.length);
      if (data.length > 0) {
        console.log('[useFieldDefinitions] Sample field structure:', data[0]);
        console.log('[useFieldDefinitions] Sample field keys:', Object.keys(data[0]));
      } else {
        console.warn('[useFieldDefinitions] WARNING: Data array is empty!');
      }

      // Convert mappings to field definitions format
      // Mappings have: id, projectId, sheetColumnLetter, internalKey, displayName, 
      // fieldType, isRequired, maxLength, options, isVisible, etc.
      const processedFields = data
        .map((mapping) => {
          // Normalize field names (handle both snake_case and camelCase)
          const normalized = {
            id: mapping.id,
            projectId: mapping.projectId || mapping.project_id,
            // Use internalKey as fieldName (e.g., "imie", "status_platnosci")
            fieldName: mapping.internalKey || mapping.internal_key || mapping.fieldName || mapping.field_name,
            // Use displayName as fieldLabel
            fieldLabel: mapping.displayName || mapping.display_name || mapping.fieldLabel || mapping.field_label || mapping.internalKey || mapping.internal_key,
            // Fallback: if fieldType is null/undefined, default to 'text'
            fieldType: mapping.fieldType || mapping.field_type || 'text',
            // Use sheetColumnLetter to calculate columnIndex (A=0, B=1, etc.)
            columnIndex: mapping.columnIndex !== undefined ? mapping.columnIndex : 
                        (mapping.column_index !== undefined ? mapping.column_index :
                        (mapping.sheetColumnLetter ? mapping.sheetColumnLetter.charCodeAt(0) - 65 : 0)),
            // Fallback: if isRequired is null/undefined, default to false
            isRequired: mapping.isRequired !== undefined ? mapping.isRequired : 
                      (mapping.is_required !== undefined ? mapping.is_required : false),
            options: mapping.options || null,
            // Build validationRules from maxLength if present
            validationRules: mapping.validationRules || 
                            (mapping.validation_rules || 
                            (mapping.maxLength ? { maxLength: mapping.maxLength } : 
                            (mapping.max_length ? { maxLength: mapping.max_length } : null))),
            displayOrder: mapping.displayOrder || mapping.display_order || mapping.columnIndex || mapping.column_index || 0,
            // Filter: only show fields that are marked for import (isVisible !== false)
            // In mappings, isVisible determines if field should be imported
            isVisible: mapping.isVisible !== undefined ? mapping.isVisible : 
                     (mapping.is_visible !== undefined ? mapping.is_visible : true),
          };

          console.log('[useFieldDefinitions] Normalized field from mapping:', {
            fieldName: normalized.fieldName,
            fieldLabel: normalized.fieldLabel,
            fieldType: normalized.fieldType,
            isRequired: normalized.isRequired,
            isVisible: normalized.isVisible,
            originalMapping: mapping,
          });

          return normalized;
        })
        .filter((field) => {
          // Filter only visible fields
          const isVisible = field.isVisible !== false;
          if (!isVisible) {
            console.log('[useFieldDefinitions] Filtered out invisible field:', field.fieldName);
          }
          return isVisible;
        })
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      console.log('[useFieldDefinitions] Filtered fields count:', processedFields.length);
      console.log('[useFieldDefinitions] Filtered fields:', processedFields);

      return processedFields;
    },
  });

  // Debug: log query status
  console.log('[useFieldDefinitions] Query status:', {
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error,
    data: queryResult.data,
    enabled: !!selectedProjectId,
  });

  return queryResult;
}
