import apiClient from '../lib/api';

export const googleSheetsApi = {
  /**
   * Pobiera informacje o Service Account
   * @returns {Promise<{configured: boolean, email: string|null, message: string}>}
   */
  getServiceAccountInfo: async () => {
    const response = await apiClient.get('/google-sheets/service-account');
    return response.data;
  },

  /**
   * Testuje połączenie z arkuszem Google Sheets (bez zapisywania)
   * @param {string} sheetUrl - URL arkusza Google Sheets
   * @returns {Promise<{connected: boolean, message: string, sheetInfo?: object}>}
   */
  testConnection: async (sheetUrl) => {
    const response = await apiClient.post('/google-sheets/test-connection', {
      sheetUrl,
    });
    return response.data;
  },

  // =====================================================
  // PROJECT-BASED ENDPOINTS (NEW)
  // =====================================================

  /**
   * Podłącza arkusz Google Sheets do projektu
   * @param {string} projectId - ID projektu
   * @param {string} sheetUrl - URL arkusza Google Sheets
   * @returns {Promise<{success: boolean, message: string, sheetId?: string, sheetTitle?: string}>}
   */
  connectProjectSheet: async (projectId, sheetUrl) => {
    const response = await apiClient.post(`/google-sheets/projects/${projectId}/connect`, {
      sheetUrl,
    });
    return response.data;
  },

  /**
   * Pobiera konfigurację arkusza dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<{configured: boolean, projectId?: string, config?: object}>}
   */
  getProjectConfiguration: async (projectId) => {
    const response = await apiClient.get(`/google-sheets/projects/${projectId}/configuration`);
    return response.data;
  },

  /**
   * Sprawdza status połączenia dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<{connected: boolean, message: string, projectId: string}>}
   */
  getProjectStatus: async (projectId) => {
    const response = await apiClient.get(`/google-sheets/projects/${projectId}/status`);
    return response.data;
  },

  /**
   * Usuwa konfigurację arkusza dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<void>}
   */
  deleteProjectConfiguration: async (projectId) => {
    await apiClient.delete(`/google-sheets/projects/${projectId}/configuration`);
  },

  /**
   * Pobiera dane z arkusza projektu
   * @param {string} projectId - ID projektu
   * @param {string} range - Zakres danych (np. 'Sheet1!A1:Z100')
   * @returns {Promise<{data: any[][]}>}
   */
  getProjectSheetData: async (projectId, range) => {
    const response = await apiClient.post(`/google-sheets/projects/${projectId}/data`, {
      range,
    });
    return response.data;
  },

  /**
   * Aktualizuje dane w arkuszu projektu
   * @param {string} projectId - ID projektu
   * @param {string} range - Zakres danych
   * @param {any[][]} values - Dane do zapisania
   * @returns {Promise<{success: boolean, message: string}>}
   */
  updateProjectSheetData: async (projectId, range, values) => {
    const response = await apiClient.post(`/google-sheets/projects/${projectId}/data/update`, {
      range,
      values,
    });
    return response.data;
  },

  /**
   * Dodaje wiersz do arkusza projektu
   * @param {string} projectId - ID projektu
   * @param {string} sheetName - Nazwa arkusza/zakładki
   * @param {any[]} values - Dane wiersza
   * @returns {Promise<{success: boolean, message: string}>}
   */
  appendProjectRow: async (projectId, sheetName, values) => {
    const response = await apiClient.post(`/google-sheets/projects/${projectId}/data/append`, {
      sheetName,
      values,
    });
    return response.data;
  },

  // =====================================================
  // LEGACY ENDPOINTS (deprecated - for backward compatibility)
  // =====================================================

  /**
   * @deprecated Use connectProjectSheet instead
   * Podłącza arkusz Google Sheets do aplikacji (zapisuje konfigurację)
   * Wymaga roli Admin
   * @param {string} sheetUrl - URL arkusza Google Sheets
   * @returns {Promise<{success: boolean, message: string, sheetId?: string, sheetTitle?: string}>}
   */
  connectSheet: async (sheetUrl) => {
    const response = await apiClient.post('/google-sheets/connect', {
      sheetUrl,
    });
    return response.data;
  },

  /**
   * @deprecated Use getProjectConfiguration instead
   * Pobiera aktualną konfigurację połączonego arkusza
   * @returns {Promise<{configured: boolean, config?: object}>}
   */
  getConfiguration: async () => {
    const response = await apiClient.get('/google-sheets/configuration');
    return response.data;
  },

  /**
   * @deprecated Use getProjectStatus instead
   * Sprawdza status połączenia z aktualnie skonfigurowanym arkuszem
   * @returns {Promise<{connected: boolean, message: string}>}
   */
  getStatus: async () => {
    const response = await apiClient.get('/google-sheets/status');
    return response.data;
  },

  // =====================================================
  // DOCUMENT TEMPLATE ENDPOINTS
  // =====================================================

  /**
   * Pobiera wszystkie szablony dokumentów dla projektu
   * @param {string} projectId - ID projektu
   * @returns {Promise<Array<{id: string, name: string, docId: string}>>}
   */
  getProjectTemplates: async (projectId) => {
    const response = await apiClient.get(`/google-sheets/projects/${projectId}/templates`);
    return response.data;
  },

  /**
   * Tworzy nowy szablon dokumentu dla projektu
   * @param {string} projectId - ID projektu
   * @param {string} name - Nazwa szablonu
   * @param {string} docId - Google Doc ID
   * @returns {Promise<{id: string, name: string, docId: string}>}
   */
  createProjectTemplate: async (projectId, name, docId) => {
    const response = await apiClient.post(`/google-sheets/projects/${projectId}/templates`, {
      name,
      docId,
    });
    return response.data;
  },

  /**
   * Usuwa szablon dokumentu
   * @param {string} projectId - ID projektu
   * @param {string} templateId - ID szablonu
   * @returns {Promise<void>}
   */
  deleteProjectTemplate: async (projectId, templateId) => {
    await apiClient.delete(`/google-sheets/projects/${projectId}/templates/${templateId}`);
  },
};

/**
 * Helper do parsowania błędów z API Google Sheets
 * @param {Error} error - Błąd z axios
 * @returns {string} - Czytelny komunikat błędu
 */
export const parseGoogleSheetsError = (error) => {
  // Błąd z odpowiedzi API
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Błąd sieciowy
  if (error.code === 'ERR_NETWORK') {
    return 'Błąd połączenia z serwerem. Sprawdź czy backend jest uruchomiony.';
  }
  
  // Błąd timeout
  if (error.code === 'ECONNABORTED') {
    return 'Przekroczono czas oczekiwania na odpowiedź serwera.';
  }
  
  // Domyślny komunikat
  return error.message || 'Wystąpił nieoczekiwany błąd';
};

export default googleSheetsApi;
