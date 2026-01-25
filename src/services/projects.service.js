import apiClient from '../lib/api';

export const projectsApi = {
  /**
   * Pobiera rolę systemową użytkownika (admin/registrar)
   * @returns {Promise<{role: string}>}
   */
  getUserRole: async () => {
    const response = await apiClient.get('/projects/me/role');
    return response.data;
  },

  /**
   * Pobiera listę wszystkich projektów użytkownika
   * @returns {Promise<{projects: Array, total: number}>}
   */
  getProjects: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  /**
   * Pobiera szczegóły pojedynczego projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Object>}
   */
  getProject: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * Tworzy nowy projekt
   * @param {Object} data - Dane projektu
   * @param {string} data.name - Nazwa projektu
   * @param {string} [data.description] - Opis projektu
   * @returns {Promise<Object>}
   */
  createProject: async (data) => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  /**
   * Aktualizuje projekt
   * @param {string} projectId - ID projektu
   * @param {Object} data - Dane do aktualizacji
   * @returns {Promise<Object>}
   */
  updateProject: async (projectId, data) => {
    const response = await apiClient.put(`/projects/${projectId}`, data);
    return response.data;
  },

  /**
   * Usuwa projekt
   * @param {string} projectId - ID projektu
   * @returns {Promise<void>}
   */
  deleteProject: async (projectId) => {
    await apiClient.delete(`/projects/${projectId}`);
  },

  /**
   * Pobiera statystyki projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Object|null>} - Statystyki lub null jeśli brak dostępu (403)
   */
  getProjectStats: async (projectId) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/stats`);
      return response.data;
    } catch (error) {
      // Jeśli 403 (Forbidden) - użytkownik nie ma uprawnień do statystyk
      // Zwróć null zamiast rzucać błąd (zapobiega crashowi React)
      if (error?.response?.status === 403) {
        console.warn('[projectsApi.getProjectStats] Brak uprawnień do statystyk (403)');
        return null;
      }
      // Inne błędy - rzuć dalej
      throw error;
    }
  },

  // =====================================================
  // PROJECT MEMBERS
  // =====================================================

  /**
   * Pobiera członków projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Array>}
   */
  getProjectMembers: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data;
  },

  /**
   * Dodaje członka do projektu
   * @param {string} projectId - ID projektu
   * @param {Object} data - Dane członka
   * @returns {Promise<Object>}
   */
  addProjectMember: async (projectId, data) => {
    const response = await apiClient.post(`/projects/${projectId}/members`, data);
    return response.data;
  },

  /**
   * Aktualizuje rolę członka
   * @param {string} projectId - ID projektu
   * @param {string} memberId - ID członkostwa
   * @param {Object} data - Nowa rola
   * @returns {Promise<Object>}
   */
  updateProjectMember: async (projectId, memberId, data) => {
    const response = await apiClient.put(`/projects/${projectId}/members/${memberId}`, data);
    return response.data;
  },

  /**
   * Usuwa członka z projektu
   * @param {string} projectId - ID projektu
   * @param {string} userId - ID użytkownika (nie memberId!)
   * @returns {Promise<void>}
   */
  removeProjectMember: async (projectId, userId) => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },

  // =====================================================
  // FIELD DEFINITIONS
  // =====================================================

  /**
   * Pobiera definicje pól dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Array>}
   */
  getFieldDefinitions: async (projectId) => {
    console.log('[projectsApi.getFieldDefinitions] Called with projectId:', projectId);
    console.log('[projectsApi.getFieldDefinitions] projectId type:', typeof projectId);
    console.log('[projectsApi.getFieldDefinitions] Full URL will be: /projects/' + projectId + '/fields');
    
    if (!projectId) {
      console.error('[projectsApi.getFieldDefinitions] ERROR: projectId is null/undefined!');
      throw new Error('Project ID is required for getFieldDefinitions');
    }
    
    try {
      const response = await apiClient.get(`/projects/${projectId}/fields`);
      console.log('[projectsApi.getFieldDefinitions] Response status:', response.status);
      console.log('[projectsApi.getFieldDefinitions] Response data:', response.data);
      console.log('[projectsApi.getFieldDefinitions] Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      console.log('[projectsApi.getFieldDefinitions] Response data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      return response.data;
    } catch (error) {
      console.error('[projectsApi.getFieldDefinitions] API Error:', error);
      console.error('[projectsApi.getFieldDefinitions] Error response:', error.response?.data);
      console.error('[projectsApi.getFieldDefinitions] Error status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Tworzy definicję pola
   * @param {string} projectId - ID projektu
   * @param {Object} data - Dane pola
   * @returns {Promise<Object>}
   */
  createFieldDefinition: async (projectId, data) => {
    const response = await apiClient.post(`/projects/${projectId}/fields`, data);
    return response.data;
  },

  /**
   * Tworzy wiele definicji pól naraz
   * @param {string} projectId - ID projektu
   * @param {Array} fields - Tablica definicji pól
   * @returns {Promise<Array>}
   */
  bulkCreateFieldDefinitions: async (projectId, fields) => {
    const response = await apiClient.post(`/projects/${projectId}/fields/bulk`, { fields });
    return response.data;
  },

  /**
   * Aktualizuje definicję pola
   * @param {string} projectId - ID projektu
   * @param {string} fieldId - ID pola
   * @param {Object} data - Dane do aktualizacji
   * @returns {Promise<Object>}
   */
  updateFieldDefinition: async (projectId, fieldId, data) => {
    const response = await apiClient.put(`/projects/${projectId}/fields/${fieldId}`, data);
    return response.data;
  },

  /**
   * Usuwa definicję pola
   * @param {string} projectId - ID projektu
   * @param {string} fieldId - ID pola
   * @returns {Promise<void>}
   */
  deleteFieldDefinition: async (projectId, fieldId) => {
    await apiClient.delete(`/projects/${projectId}/fields/${fieldId}`);
  },

  // =====================================================
  // FIELD MAPPING ENDPOINTS
  // =====================================================

  /**
   * Pobiera zapisane mapowania pól dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Array<{id: string, projectId: string, sheetColumnLetter: string, internalKey: string, displayName: string, isVisible: boolean, createdAt: string, updatedAt: string}>>}
   */
  getMappings: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/mappings`);
    return response.data;
  },

  /**
   * Skanuje nagłówki z arkusza Google Sheets
   * @param {string} projectId - ID projektu
   * @param {string} spreadsheetId - ID arkusza Google Sheets
   * @returns {Promise<{headers: Array<{letter: string, value: string}>}>}
   */
  scanHeaders: async (projectId, spreadsheetId) => {
    const response = await apiClient.post(`/projects/${projectId}/scan-headers`, {
      spreadsheetId,
    });
    return response.data;
  },

  /**
   * Aktualizuje mapowania pól dla projektu
   * @param {string} projectId - ID projektu
   * @param {Array} mappings - Tablica mapowań
   * @returns {Promise<Array>}
   */
  updateMappings: async (projectId, mappings) => {
    const response = await apiClient.put(`/projects/${projectId}/mappings`, {
      mappings,
    });
    return response.data;
  },
};

export default projectsApi;
