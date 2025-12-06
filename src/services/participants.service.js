import apiClient from '../lib/api';

export const participantsApi = {
  /**
   * Pobiera listę uczestników dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Array>}
   */
  getParticipants: async (projectId) => {
    // TODO: Replace with actual API endpoint when backend is ready
    // const response = await apiClient.get(`/projects/${projectId}/participants`);
    // return response.data;
    
    // For now, return empty array - this will be replaced when backend endpoint is available
    // The ParticipantsPage currently uses mock data, but this structure is ready for API integration
    return [];
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

