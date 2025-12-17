import apiClient from '../lib/api';

export const documentsApi = {
  /**
   * Generuje PDF dla uczestnika
   * @param {string} projectId - ID projektu
   * @param {string} templateId - ID szablonu
   * @param {number} participantId - ID uczestnika
   * @returns {Promise<{blob: Blob, headers: Object}>} - PDF jako blob z headers
   */
  generateParticipantPdf: async (projectId, templateId, participantId) => {
    const response = await apiClient.post(
      `/projects/${projectId}/documents/generate`,
      {
        templateId,
        participantId,
      },
      {
        responseType: 'blob', // Ważne: axios musi zwrócić blob
      }
    );
    return {
      blob: response.data, // Blob z PDF
      headers: response.headers, // Headers (w tym Content-Disposition)
    };
  },

  /**
   * Tworzy zadanie zbiorczego generowania dokumentów
   * @param {string} projectId - ID projektu
   * @param {string} templateId - ID szablonu
   * @param {number[]} participantIds - Lista ID uczestników
   * @param {string} [outputDriveFolderId] - Opcjonalny ID folderu w Google Drive
   * @returns {Promise<{taskId: string}>} - ID utworzonego zadania
   */
  createDocumentTask: async (projectId, templateId, participantIds, outputDriveFolderId) => {
    const body = {
      templateId,
      participantIds,
    };
    
    if (outputDriveFolderId) {
      body.outputDriveFolderId = outputDriveFolderId;
    }
    
    const response = await apiClient.post(
      `/projects/${projectId}/documents/tasks`,
      body
    );
    return response.data;
  },
};

export default documentsApi;

