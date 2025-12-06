import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantsApi } from '../services/participants.service';
import { useProject } from '../contexts/ProjectContext';

/**
 * Hook to fetch participants for the currently selected project
 * @returns {Object} Query result with participants data
 */
export function useParticipants() {
  const { selectedProjectId } = useProject();

  return useQuery({
    queryKey: ['participants', selectedProjectId],
    queryFn: () => participantsApi.getParticipants(selectedProjectId),
    enabled: !!selectedProjectId, // Only fetch if project is selected
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch a single participant
 * @param {string} participantId - ID of the participant
 * @returns {Object} Query result with participant data
 */
export function useParticipant(participantId) {
  const { selectedProjectId } = useProject();

  return useQuery({
    queryKey: ['participant', selectedProjectId, participantId],
    queryFn: () => participantsApi.getParticipant(selectedProjectId, participantId),
    enabled: !!selectedProjectId && !!participantId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to create a new participant
 * @returns {Object} Mutation object
 */
export function useCreateParticipant() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => participantsApi.createParticipant(selectedProjectId, data),
    onSuccess: () => {
      // Invalidate participants list to refetch
      queryClient.invalidateQueries({ queryKey: ['participants', selectedProjectId] });
    },
  });
}

/**
 * Hook to update a participant
 * @returns {Object} Mutation object
 */
export function useUpdateParticipant() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ participantId, data }) =>
      participantsApi.updateParticipant(selectedProjectId, participantId, data),
    onSuccess: (_, variables) => {
      // Invalidate both list and individual participant
      queryClient.invalidateQueries({ queryKey: ['participants', selectedProjectId] });
      queryClient.invalidateQueries({
        queryKey: ['participant', selectedProjectId, variables.participantId],
      });
    },
  });
}

/**
 * Hook to delete a participant
 * @returns {Object} Mutation object
 */
export function useDeleteParticipant() {
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId) => participantsApi.deleteParticipant(selectedProjectId, participantId),
    onSuccess: () => {
      // Invalidate participants list to refetch
      queryClient.invalidateQueries({ queryKey: ['participants', selectedProjectId] });
    },
  });
}

