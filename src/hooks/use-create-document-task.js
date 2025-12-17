import { useMutation } from '@tanstack/react-query';
import { documentsApi } from '../services/documents.service';
import { useToast } from './use-toast';

/**
 * Hook do tworzenia zadania zbiorczego generowania dokumentów
 * @returns {Object} Mutation object z funkcją mutate
 */
export function useCreateDocumentTask() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, templateId, participantIds, outputDriveFolderId }) => {
      return await documentsApi.createDocumentTask(
        projectId,
        templateId,
        participantIds,
        outputDriveFolderId
      );
    },
    onSuccess: () => {
      toast({
        title: 'Zadanie zaplanowane',
        description: 'Zadanie generowania dokumentów zostało zaplanowane. Zostanie przetworzone w nocy.',
      });
    },
    onError: (error) => {
      let errorMessage = 'Wystąpił błąd podczas planowania zadania';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Błąd planowania zadania',
        description: errorMessage,
      });
    },
  });
}

