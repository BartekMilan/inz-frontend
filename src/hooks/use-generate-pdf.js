import { useMutation } from '@tanstack/react-query';
import { documentsApi } from '../services/documents.service';
import { useToast } from './use-toast';

/**
 * Hook do generowania PDF dla uczestnika
 * Obsługuje pobieranie pliku z Content-Disposition header
 * @returns {Object} Mutation object z funkcją mutate
 */
export function useGeneratePdf() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, templateId, participantId }) => {
      const response = await documentsApi.generateParticipantPdf(
        projectId,
        templateId,
        participantId
      );
      return { blob: response.blob, headers: response.headers, projectId, templateId, participantId };
    },
    onSuccess: (data, variables) => {
      const { blob, headers, participantId } = data;
      
      // Funkcja pomocnicza do parsowania Content-Disposition
      const getFileNameFromContentDisposition = (contentDisposition) => {
        if (!contentDisposition) return null;
        
        // Format: attachment; filename="nazwa.pdf" lub attachment; filename=nazwa.pdf
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          let filename = filenameMatch[1].replace(/['"]/g, '');
          // Dekoduj URL encoding jeśli jest
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // Jeśli dekodowanie się nie powiedzie, użyj oryginalnej nazwy
          }
          return filename;
        }
        return null;
      };
      
      // Pobierz nazwę pliku z nagłówka Content-Disposition
      const contentDisposition = headers['content-disposition'] || headers['Content-Disposition'];
      const fileName = getFileNameFromContentDisposition(contentDisposition) || `participant-${participantId}.pdf`;
      
      // Utwórz URL dla blob
      const url = window.URL.createObjectURL(blob);
      
      // Utwórz link do pobrania
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Posprzątaj
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF wygenerowany',
        description: 'Plik został pobrany.',
      });
    },
    onError: async (error) => {
      let errorMessage = 'Wystąpił błąd podczas generowania PDF';
      
      // Jeśli błąd ma response z blob (gdy backend zwróci błąd jako blob z JSON)
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.message || errorMessage;
        } catch (e) {
          // Jeśli nie uda się sparsować, użyj domyślnego komunikatu
          errorMessage = error.response?.statusText || errorMessage;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Błąd generowania PDF',
        description: errorMessage,
      });
    },
  });
}

