import apiClient from '../lib/api';

export const participantsApi = {
  /**
   * Pobiera listę uczestników dla projektu z mapowaniem pól
   * @param {string} projectId - ID projektu
   * @returns {Promise<{config: Array, data: Array}>}
   */
  getParticipants: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/participants`);
    return response.data; // Returns { config: [...], data: [...] }
  },

  /**
   * Pobiera szczegóły pojedynczego uczestnika
   * @param {string} projectId - ID projektu
   * @param {string} participantId - ID uczestnika
   * @returns {Promise<Object>}
   */
  getParticipant: async (projectId, participantId) => {
    // TODO: Replace with actual API endpoint when backend is ready
    // const response = await apiClient.get(`/projects/${projectId}/participants/${participantId}`);
    // return response.data;
    return null;
  },

  /**
   * Tworzy nowego uczestnika
   * @param {string} projectId - ID projektu
   * @param {Object} data - Dane uczestnika
   * @returns {Promise<Object>}
   */
  createParticipant: async (projectId, data) => {
    // TODO: Replace with actual API endpoint when backend is ready
    // const response = await apiClient.post(`/projects/${projectId}/participants`, data);
    // return response.data;
    return null;
  },

  /**
   * Aktualizuje uczestnika
   * @param {string} projectId - ID projektu
   * @param {string} participantId - ID uczestnika
   * @param {Object} data - Dane do aktualizacji
   * @returns {Promise<Object>}
   */
  updateParticipant: async (projectId, participantId, data) => {
    // TODO: Replace with actual API endpoint when backend is ready
    // const response = await apiClient.put(`/projects/${projectId}/participants/${participantId}`, data);
    // return response.data;
    return null;
  },

  /**
   * Usuwa uczestnika
   * @param {string} projectId - ID projektu
   * @param {string} participantId - ID uczestnika
   * @returns {Promise<void>}
   */
  deleteParticipant: async (projectId, participantId) => {
    // TODO: Replace with actual API endpoint when backend is ready
    // await apiClient.delete(`/projects/${projectId}/participants/${participantId}`);
  },
};

