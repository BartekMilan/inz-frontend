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

  /**
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
   * Pobiera aktualną konfigurację połączonego arkusza
   * @returns {Promise<{configured: boolean, config?: object}>}
   */
  getConfiguration: async () => {
    const response = await apiClient.get('/google-sheets/configuration');
    return response.data;
  },

  /**
   * Sprawdza status połączenia z aktualnie skonfigurowanym arkuszem
   * @returns {Promise<{connected: boolean, message: string}>}
   */
  getStatus: async () => {
    const response = await apiClient.get('/google-sheets/status');
    return response.data;
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
