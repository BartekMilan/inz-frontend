import apiClient from '../lib/api';

/**
 * Konwertuje literę kolumny na indeks (A=0, B=1, ..., Z=25, AA=26, etc.)
 * @param {string} letter - Litera kolumny (np. 'A', 'B', 'AA')
 * @returns {number} - Indeks kolumny (0-based)
 */
function columnLetterToIndex(letter) {
  let result = 0;
  const upperLetter = letter.toUpperCase();
  for (let i = 0; i < upperLetter.length; i++) {
    const charCode = upperLetter.charCodeAt(i) - 64; // A=1, B=2, etc.
    result = result * 26 + charCode;
  }
  return result - 1; // Convert to zero-based index
}

/**
 * Konwertuje indeks kolumny na literę (0=A, 1=B, ..., 25=Z, 26=AA, etc.)
 * @param {number} index - Indeks kolumny (0-based)
 * @returns {string} - Litera kolumny
 */
function indexToColumnLetter(index) {
  let result = '';
  let num = index + 1; // Convert to 1-based
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

/**
 * Pobiera mapowania pól dla projektu
 * @param {string} projectId - ID projektu
 * @returns {Promise<Array>} - Tablica mapowań
 */
async function getMappings(projectId) {
  const response = await apiClient.get(`/projects/${projectId}/mappings`);
  return response.data || [];
}

/**
 * Pobiera konfigurację arkusza Google Sheets dla projektu
 * @param {string} projectId - ID projektu
 * @returns {Promise<{sheetNames: string[], sheetTitle: string} | null>}
 */
async function getSheetConfiguration(projectId) {
  try {
    const response = await apiClient.get(`/google-sheets/projects/${projectId}/configuration`);
    return response.data?.config || null;
  } catch (error) {
    console.error('[getSheetConfiguration] Error:', error);
    return null;
  }
}

/**
 * Pobiera nazwę pierwszego arkusza (lub domyślną)
 * @param {string} projectId - ID projektu
 * @returns {Promise<string>} - Nazwa arkusza
 */
async function getFirstSheetName(projectId) {
  const config = await getSheetConfiguration(projectId);
  
  // Użyj pierwszej nazwy z listy arkuszy lub domyślnej
  if (config?.sheetNames && config.sheetNames.length > 0) {
    return config.sheetNames[0];
  }
  
  // Fallback - zwróć pustą nazwę (Google Sheets API użyje domyślnego arkusza)
  return '';
}

/**
 * Konwertuje dane formularza (klucze internal_key) na tablicę wartości w kolejności kolumn
 * @param {Object} formData - Dane z formularza (klucze = internal_key)
 * @param {Array} mappings - Mapowania pól
 * @returns {Array} - Tablica wartości w kolejności kolumn arkusza
 */
function convertFormDataToSheetValues(formData, mappings) {
  // Znajdź maksymalny indeks kolumny
  let maxColumnIndex = 0;
  mappings.forEach((mapping) => {
    const letter = mapping.sheetColumnLetter || mapping.sheet_column_letter;
    if (letter) {
      const index = columnLetterToIndex(letter);
      if (index > maxColumnIndex) {
        maxColumnIndex = index;
      }
    }
  });

  // Utwórz tablicę z pustymi wartościami
  const values = new Array(maxColumnIndex + 1).fill('');

  // Wypełnij wartości z formularza
  mappings.forEach((mapping) => {
    const internalKey = mapping.internalKey || mapping.internal_key;
    const letter = mapping.sheetColumnLetter || mapping.sheet_column_letter;

    if (internalKey && letter && formData[internalKey] !== undefined) {
      const columnIndex = columnLetterToIndex(letter);
      let value = formData[internalKey];

      // Konwersja boolean na string
      if (typeof value === 'boolean') {
        value = value ? 'Tak' : 'Nie';
      }
      // Konwersja null/undefined na pusty string
      if (value === null || value === undefined) {
        value = '';
      }

      values[columnIndex] = String(value);
    }
  });

  return values;
}

/**
 * Oblicza zakres (range) dla wiersza w arkuszu
 * @param {number} rowNumber - Numer wiersza (1-indexed, jak w arkuszu)
 * @param {number} columnCount - Liczba kolumn
 * @param {string} sheetName - Nazwa arkusza (opcjonalna)
 * @returns {string} - Zakres np. 'Sheet1!A2:Z2'
 */
function calculateRange(rowNumber, columnCount, sheetName = 'Sheet1') {
  const startColumn = 'A';
  const endColumn = indexToColumnLetter(columnCount - 1);
  return `${sheetName}!${startColumn}${rowNumber}:${endColumn}${rowNumber}`;
}

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
   * Używa endpointu listy uczestników i filtruje po ID
   * @param {string} projectId - ID projektu
   * @param {string|number} participantId - ID uczestnika (numer wiersza w arkuszu)
   * @returns {Promise<Object|null>}
   */
  getParticipant: async (projectId, participantId) => {
    // Pobierz listę uczestników i znajdź po ID
    const response = await apiClient.get(`/projects/${projectId}/participants`);
    const { data } = response.data || { data: [] };

    // ID uczestnika to numer wiersza w arkuszu
    const participant = data.find(
      (p) => String(p.id) === String(participantId)
    );

    return participant || null;
  },

  /**
   * Tworzy nowego uczestnika
   * Używa endpointu Google Sheets do dodania wiersza
   * @param {string} projectId - ID projektu
   * @param {Object} formData - Dane uczestnika (klucze = internal_key z mapowań)
   * @returns {Promise<Object>}
   */
  createParticipant: async (projectId, formData) => {
    // Pobierz mapowania pól i konfigurację arkusza równolegle
    const [mappings, sheetName] = await Promise.all([
      getMappings(projectId),
      getFirstSheetName(projectId),
    ]);

    if (!mappings || mappings.length === 0) {
      throw new Error('Brak skonfigurowanych mapowań pól dla projektu');
    }

    // Konwertuj dane formularza na tablicę wartości
    const values = convertFormDataToSheetValues(formData, mappings);

    console.log('[createParticipant] Using sheet name:', sheetName || '(default)');
    console.log('[createParticipant] Values:', values);

    // Wywołaj endpoint append
    const response = await apiClient.post(
      `/google-sheets/projects/${projectId}/data/append`,
      {
        sheetName: sheetName || 'Arkusz1', // Użyj rzeczywistej nazwy lub domyślnej polskiej
        values: values,
      }
    );

    return response.data;
  },

  /**
   * Aktualizuje uczestnika
   * Używa endpointu Google Sheets do aktualizacji wiersza
   * @param {string} projectId - ID projektu
   * @param {string|number} participantId - ID uczestnika (numer wiersza w arkuszu)
   * @param {Object} formData - Dane do aktualizacji (klucze = internal_key z mapowań)
   * @returns {Promise<Object>}
   */
  updateParticipant: async (projectId, participantId, formData) => {
    // Pobierz mapowania pól i konfigurację arkusza równolegle
    const [mappings, sheetName] = await Promise.all([
      getMappings(projectId),
      getFirstSheetName(projectId),
    ]);

    if (!mappings || mappings.length === 0) {
      throw new Error('Brak skonfigurowanych mapowań pól dla projektu');
    }

    // Konwertuj dane formularza na tablicę wartości
    const values = convertFormDataToSheetValues(formData, mappings);

    // participantId to numer wiersza w arkuszu (1-indexed)
    const rowNumber = Number(participantId);

    // Użyj rzeczywistej nazwy arkusza lub domyślnej polskiej
    const actualSheetName = sheetName || 'Arkusz1';

    // Oblicz zakres (range)
    const range = calculateRange(rowNumber, values.length, actualSheetName);

    console.log('[updateParticipant] Using sheet name:', actualSheetName);
    console.log('[updateParticipant] Range:', range);
    console.log('[updateParticipant] Values:', values);

    // Wywołaj endpoint update
    const response = await apiClient.post(
      `/google-sheets/projects/${projectId}/data/update`,
      {
        range: range,
        values: [values], // API oczekuje tablicy 2D
      }
    );

    return response.data;
  },

  /**
   * Usuwa uczestnika
   * UWAGA: Usuwanie wierszy z Google Sheets wymaga dodatkowej implementacji na backendzie
   * @param {string} projectId - ID projektu
   * @param {string} participantId - ID uczestnika
   * @returns {Promise<void>}
   */
  deleteParticipant: async (projectId, participantId) => {
    // TODO: Implementacja usuwania wymaga dodatkowego endpointu na backendzie
    // Google Sheets API nie pozwala na usunięcie wiersza przez values.update
    // Można tylko wyczyścić komórki lub użyć batchUpdate z deleteRow
    console.warn('Usuwanie uczestników nie jest jeszcze zaimplementowane');
    throw new Error('Funkcja usuwania uczestników jest w trakcie implementacji');
  },
};

