import apiClient from '../lib/api';

export const templateMappingsApi = {
  /**
   * Pobiera mapowania placeholderów dla szablonu
   * @param {string} projectId - ID projektu
   * @param {string} templateId - ID szablonu
   * @returns {Promise<Array<{placeholder: string, participantKey: string}>>}
   */
  getTemplateMappings: async (projectId, templateId) => {
    const response = await apiClient.get(
      `/projects/${projectId}/documents/templates/${templateId}/mappings`
    );
    return response.data;
  },

  /**
   * Zapisuje mapowania placeholderów dla szablonu
   * @param {string} projectId - ID projektu
   * @param {string} templateId - ID szablonu
   * @param {Array<{placeholder: string, participantKey: string}>} mappings - Lista mapowań
   * @returns {Promise<Array<{placeholder: string, participantKey: string}>>}
   */
  setTemplateMappings: async (projectId, templateId, mappings) => {
    const response = await apiClient.put(
      `/projects/${projectId}/documents/templates/${templateId}/mappings`,
      { mappings }
    );
    return response.data;
  },
};

export default templateMappingsApi;

