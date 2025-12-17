import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Link,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { googleSheetsApi, parseGoogleSheetsError } from '@/services/google-sheets.service';
import { projectsApi } from '@/services/projects.service';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import TemplateMappingsModal from '@/components/TemplateMappingsModal';

export default function SettingsPage() {
  const { toast } = useToast();
  const { checkIsAdmin } = useAuth();
  const { selectedProjectId } = useProject();
  const queryClient = useQueryClient();
  const isAdmin = checkIsAdmin();

  // State for Source Sheet
  const [sheetUrl, setSheetUrl] = useState('');
  const [testResult, setTestResult] = useState(null); // null | 'success' | 'error'
  const [testInfo, setTestInfo] = useState(null);
  const [testError, setTestError] = useState(null);

  // State for Templates - will be populated from API
  const [templates, setTemplates] = useState([]);

  // State for New Template Form
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDocId, setNewTemplateDocId] = useState('');

  // State for Template Mappings Modal
  const [mappingsModalOpen, setMappingsModalOpen] = useState(false);
  const [selectedTemplateForMappings, setSelectedTemplateForMappings] = useState(null);

  // State for Mapping Wizard
  const [scannedHeaders, setScannedHeaders] = useState([]);
  // Mappings: keyed by column letter, value is "import" or "ignore"
  // e.g., { "A": "import", "B": "import", "C": "ignore" }
  const [mappings, setMappings] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [isSavingMappings, setIsSavingMappings] = useState(false);
  
  // Field configuration details: keyed by column letter
  // e.g., { "A": { fieldType: "text", isRequired: false, maxLength: 100, options: [] } }
  const [fieldConfigs, setFieldConfigs] = useState({});
  
  // Track original saved mappings for dirty state comparison
  const [originalSavedMappings, setOriginalSavedMappings] = useState(null);
  // Track if there are unsaved changes
  const [hasUnsavedMappingChanges, setHasUnsavedMappingChanges] = useState(false);

  /**
   * Generates a safe internal key from header text using slugify logic
   * - Converts to lowercase
   * - Removes Polish diacritics (ą->a, ł->l, ó->o, etc.)
   * - Replaces spaces and symbols with underscores
   * @param {string} headerText - The header text from Google Sheets
   * @returns {string} - The generated internal key (e.g., "imie", "status_platnosci")
   */
  const generateInternalKey = (headerText) => {
    if (!headerText || !headerText.trim()) {
      return '';
    }

    let result = headerText.trim();

    // Convert to lowercase
    result = result.toLowerCase();

    // Remove Polish diacritics and special characters
    const diacriticsMap = {
      ą: 'a',
      ć: 'c',
      ę: 'e',
      ł: 'l',
      ń: 'n',
      ó: 'o',
      ś: 's',
      ź: 'z',
      ż: 'z',
      Ą: 'a',
      Ć: 'c',
      Ę: 'e',
      Ł: 'l',
      Ń: 'n',
      Ó: 'o',
      Ś: 's',
      Ź: 'z',
      Ż: 'z',
    };

    result = result.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => diacriticsMap[char] || char);

    // Replace spaces, hyphens, and other symbols with underscores
    result = result.replace(/[^a-z0-9]+/g, '_');

    // Remove leading/trailing underscores
    result = result.replace(/^_+|_+$/g, '');

    // If empty after processing, use a fallback
    if (!result) {
      result = 'column';
    }

    return result;
  };

  // Role options for the dropdown (simplified to Import/Ignore)
  const roleOptions = [
    { value: 'import', label: 'Import', description: 'Zaimportuj tę kolumnę' },
    { value: 'ignore', label: 'Ignorowane / Do not import', description: 'Pomiń tę kolumnę' },
  ];

  // Field type options
  const fieldTypeOptions = [
    { value: 'text', label: 'Tekst' },
    { value: 'number', label: 'Liczba' },
    { value: 'date', label: 'Data' },
    { value: 'select', label: 'Select' },
    { value: 'email', label: 'E-mail' },
    { value: 'checkbox', label: 'Checkbox' },
  ];

  // Query: Get Service Account info
  const { data: serviceAccountData } = useQuery({
    queryKey: ['serviceAccountInfo'],
    queryFn: googleSheetsApi.getServiceAccountInfo,
    retry: 1,
    staleTime: 60000, // 1 minute
    enabled: isAdmin,
  });

  // Query: Get current sheet configuration for selected project
  const {
    data: configData,
    isLoading: isLoadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['sheetConfiguration', selectedProjectId],
    queryFn: () => googleSheetsApi.getProjectConfiguration(selectedProjectId),
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: !!selectedProjectId, // Only fetch if project is selected
  });

  // Query: Get document templates for selected project
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['documentTemplates', selectedProjectId],
    queryFn: () => googleSheetsApi.getProjectTemplates(selectedProjectId),
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: !!selectedProjectId, // Only fetch if project is selected
  });

  // Query: Get saved mappings for selected project
  const {
    data: savedMappingsData,
    isLoading: isLoadingMappings,
    refetch: refetchMappings,
  } = useQuery({
    queryKey: ['fieldMappings', selectedProjectId],
    queryFn: () => projectsApi.getMappings(selectedProjectId),
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: !!selectedProjectId, // Only fetch if project is selected
  });

  // Detect uninitialized mapping state
  // True if: spreadsheet is connected BUT no mappings have been saved to DB yet
  const isMappingUninitialized = useMemo(() => {
    // Check if spreadsheet is connected
    const hasSpreadsheet = configData?.configured && configData?.config?.sheetId;
    
    // Check if mappings query has completed (not loading)
    const mappingsQueryComplete = !isLoadingMappings;
    
    // Check if saved mappings are empty (no mappings in DB)
    const hasNoSavedMappings = 
      savedMappingsData === undefined || 
      (Array.isArray(savedMappingsData) && savedMappingsData.length === 0);
    
    // Uninitialized if: spreadsheet exists, query is complete, and no saved mappings
    return hasSpreadsheet && mappingsQueryComplete && hasNoSavedMappings;
  }, [configData?.configured, configData?.config?.sheetId, isLoadingMappings, savedMappingsData]);

  // Populate sheetUrl from saved configuration
  useEffect(() => {
    if (configData?.configured && configData?.config?.sheetUrl) {
      setSheetUrl(configData.config.sheetUrl);
    } else if (configData?.configured === false) {
      // No configuration exists for this project, clear the field
      setSheetUrl('');
    }
  }, [configData, selectedProjectId]);

  // Populate templates from API
  useEffect(() => {
    if (templatesData) {
      setTemplates(templatesData);
    } else {
      setTemplates([]);
    }
  }, [templatesData, selectedProjectId]);

  // Clear form fields when project changes
  useEffect(() => {
    setNewTemplateName('');
    setNewTemplateDocId('');
    setTestResult(null);
    setTestInfo(null);
    setTestError(null);
    setScannedHeaders([]);
    setMappings({});
    setFieldConfigs({});
    setOriginalSavedMappings(null);
    setHasUnsavedMappingChanges(false);
  }, [selectedProjectId]);

  // Auto-initialize: Auto-scan headers when component mounts and spreadsheetId exists
  useEffect(() => {
    const spreadsheetId = configData?.config?.sheetId;
    const hasHeaders = scannedHeaders && scannedHeaders.length > 0;
    const isConfigLoaded = !isLoadingConfig && configData !== undefined;
    
    // Auto-scan if:
    // 1. Config is loaded (not still loading)
    // 2. SpreadsheetId exists
    // 3. Headers haven't been scanned yet
    // 4. Not currently scanning
    // 5. Project is selected
    if (
      isConfigLoaded &&
      spreadsheetId &&
      !hasHeaders &&
      !isScanning &&
      selectedProjectId
    ) {
      // Silently scan headers in the background
      handleScanHeaders(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configData?.config?.sheetId, isLoadingConfig, selectedProjectId, scannedHeaders.length, isScanning]);

  // Load saved mappings into form state when data is available and headers are scanned
  // This effect ensures the dropdowns are populated with saved values from the database
  useEffect(() => {
    // Only load if we have both saved mappings data and scanned headers
    const hasSavedMappings = savedMappingsData && Array.isArray(savedMappingsData) && savedMappingsData.length > 0;
    const hasScannedHeaders = scannedHeaders && Array.isArray(scannedHeaders) && scannedHeaders.length > 0;
    
    if (hasSavedMappings && hasScannedHeaders) {
      const loadedMappings = {};
      const loadedFieldConfigs = {};
      
      // Create a map of saved mappings by column letter for easy lookup
      const mappingsByLetter = {};
      savedMappingsData.forEach((m) => {
        if (m && m.sheetColumnLetter) {
          mappingsByLetter[m.sheetColumnLetter] = m;
        }
      });
      
      // Get set of column letters that have saved mappings (these were imported)
      const savedColumnLetters = new Set(
        savedMappingsData
          .filter((m) => m && m.sheetColumnLetter)
          .map((m) => m.sheetColumnLetter)
      );
      
      // Mark all scanned headers
      scannedHeaders.forEach((header) => {
        if (header && header.letter) {
          // If column has a saved mapping, it was imported
          // If column doesn't have a saved mapping, it was likely ignored
          // But with new default behavior, we'll import everything by default
          // So mark all as "import" (user can change to "ignore" if needed)
          if (savedColumnLetters.has(header.letter)) {
            loadedMappings[header.letter] = 'import';
            
            // Load field configuration from saved mapping
            const savedMapping = mappingsByLetter[header.letter];
            if (savedMapping) {
              loadedFieldConfigs[header.letter] = {
                fieldType: savedMapping.fieldType || 'text',
                isRequired: savedMapping.isRequired || false,
                maxLength: savedMapping.maxLength || null,
                options: savedMapping.options || null,
              };
            }
          } else {
            // Column exists in headers but not in saved mappings - it was ignored
            loadedMappings[header.letter] = 'ignore';
          }
        }
      });
      
      // Update form state with loaded mappings and field configs
      setMappings(loadedMappings);
      setFieldConfigs(loadedFieldConfigs);
      // Store original state for dirty comparison
      setOriginalSavedMappings(JSON.stringify(loadedMappings));
      // Reset dirty state when loading saved data
      setHasUnsavedMappingChanges(false);
    }
  }, [savedMappingsData, scannedHeaders]);



  // Auto-generate mappings for ALL headers when they are scanned
  // Import everything by default - only skip if saved mappings exist
  useEffect(() => {
    if (scannedHeaders.length > 0) {
      // Check if we have saved mappings - if so, don't apply auto-generation
      // (saved mappings are loaded by the previous useEffect and take priority)
      const hasSavedMappings = savedMappingsData && savedMappingsData.length > 0;
      
      // Only apply auto-generation if no saved mappings exist
      if (!hasSavedMappings) {
        const hasCurrentMappings = Object.keys(mappings).length > 0;

        // Only apply auto-generation if no current mappings exist
        if (!hasCurrentMappings) {
          const newMappings = {};
          const newFieldConfigs = {};

          scannedHeaders.forEach((header) => {
            if (header && header.letter) {
              // Import everything by default
              // Empty headers are also imported (they'll get a generated key)
              newMappings[header.letter] = 'import';
              // Initialize field configs with defaults
              newFieldConfigs[header.letter] = {
                fieldType: 'text',
                isRequired: false,
                maxLength: null,
                options: null,
              };
            }
          });

          setMappings(newMappings);
          setFieldConfigs(newFieldConfigs);
          // Store as original state for dirty comparison
          setOriginalSavedMappings(JSON.stringify(newMappings));
          // Mark as dirty since new headers were scanned (not saved yet)
          setHasUnsavedMappingChanges(true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedHeaders, savedMappingsData]);

  // Helper function to get field config with defaults
  const getFieldConfig = (columnLetter) => {
    return fieldConfigs[columnLetter] || {
      fieldType: 'text',
      isRequired: false,
      maxLength: null,
      options: null,
    };
  };

  // Helper function to update field config
  const updateFieldConfig = (columnLetter, updates) => {
    setFieldConfigs((prev) => ({
      ...prev,
      [columnLetter]: {
        ...getFieldConfig(columnLetter),
        ...updates,
      },
    }));
    // Mark as dirty when field config changes
    if (originalSavedMappings !== null) {
      setHasUnsavedMappingChanges(true);
    }
  };

  // Track changes to mappings for dirty state
  useEffect(() => {
    if (originalSavedMappings !== null && scannedHeaders.length > 0) {
      const currentMappingsStr = JSON.stringify(mappings);
      const isDirty = currentMappingsStr !== originalSavedMappings;
      setHasUnsavedMappingChanges(isDirty);
    }
    // Note: Field config changes are tracked through updateFieldConfig which sets hasUnsavedMappingChanges
    // when originalSavedMappings is not null, so we don't need a separate effect for fieldConfigs
  }, [mappings, originalSavedMappings, scannedHeaders.length]);

  // Copy Service Account email to clipboard
  const copyServiceAccountEmail = () => {
    if (serviceAccountData?.email) {
      navigator.clipboard.writeText(serviceAccountData.email);
      toast({
        title: 'Skopiowano',
        description: 'Adres email został skopiowany do schowka',
      });
    }
  };

  // Mutation: Test connection
  const testConnectionMutation = useMutation({
    mutationFn: (url) => googleSheetsApi.testConnection(url),
    onSuccess: (data) => {
      setTestResult('success');
      setTestInfo(data.sheetInfo);
      setTestError(null);
      toast({
        title: 'Połączenie udane',
        description: `Połączono z arkuszem: ${data.sheetInfo?.title}`,
      });
    },
    onError: (error) => {
      setTestResult('error');
      setTestInfo(null);
      const errorMessage = parseGoogleSheetsError(error);
      setTestError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Błąd połączenia',
        description: errorMessage,
      });
    },
  });

  // Mutation: Connect (save) sheet for project
  const connectSheetMutation = useMutation({
    mutationFn: (url) => googleSheetsApi.connectProjectSheet(selectedProjectId, url),
    onSuccess: (data) => {
      toast({
        title: 'Arkusz podłączony',
        description: data.message || 'Konfiguracja została zapisana',
      });
      // Refresh configuration for current project
      queryClient.invalidateQueries({ queryKey: ['sheetConfiguration', selectedProjectId] });
      setTestResult('success');
      setTestInfo({
        sheetId: data.sheetId,
        title: data.sheetTitle,
        sheetsCount: data.sheetsCount,
        sheetNames: data.sheetNames,
      });
    },
    onError: (error) => {
      const errorMessage = parseGoogleSheetsError(error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: errorMessage,
      });
    },
  });

  // Handle Test Connection
  const handleTestConnection = () => {
    if (!sheetUrl.trim()) return;
    setTestResult(null);
    setTestInfo(null);
    setTestError(null);
    testConnectionMutation.mutate(sheetUrl.trim());
  };

  // Handle Save/Connect Sheet
  const handleConnectSheet = () => {
    if (!sheetUrl.trim() || !selectedProjectId) return;
    connectSheetMutation.mutate(sheetUrl.trim());
  };

  // Mutation: Create template
  const createTemplateMutation = useMutation({
    mutationFn: ({ name, docId }) =>
      googleSheetsApi.createProjectTemplate(selectedProjectId, name, docId),
    onSuccess: () => {
      toast({
        title: 'Szablon dodany',
        description: 'Szablon został pomyślnie dodany',
      });
      queryClient.invalidateQueries({ queryKey: ['documentTemplates', selectedProjectId] });
      setNewTemplateName('');
      setNewTemplateDocId('');
    },
    onError: (error) => {
      const errorMessage = parseGoogleSheetsError(error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: errorMessage,
      });
    },
  });

  // Mutation: Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId) =>
      googleSheetsApi.deleteProjectTemplate(selectedProjectId, templateId),
    onSuccess: () => {
      toast({
        title: 'Szablon usunięty',
        description: 'Szablon został pomyślnie usunięty',
      });
      queryClient.invalidateQueries({ queryKey: ['documentTemplates', selectedProjectId] });
    },
    onError: (error) => {
      const errorMessage = parseGoogleSheetsError(error);
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: errorMessage,
      });
    },
  });

  // Handle Add Template
  const handleAddTemplate = () => {
    if (newTemplateName.trim() && newTemplateDocId.trim() && selectedProjectId) {
      createTemplateMutation.mutate({
        name: newTemplateName.trim(),
        docId: newTemplateDocId.trim(),
      });
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = (id) => {
    if (selectedProjectId) {
      deleteTemplateMutation.mutate(id);
    }
  };

  // Handle Scan Headers (with optional silent mode for auto-initialization)
  const handleScanHeaders = async (silent = false) => {
    // Get spreadsheetId from saved configuration
    const spreadsheetId = configData?.config?.sheetId;
    if (!spreadsheetId || !selectedProjectId) {
      if (!silent) {
        toast({
          variant: 'destructive',
          title: 'Brak konfiguracji',
          description: 'Najpierw podłącz arkusz Google Sheets w sekcji "Arkusz Źródłowy"',
        });
      }
      return;
    }

    setIsScanning(true);
    // Don't clear headers if we're doing a silent auto-scan (preserve any existing data)
    if (!silent) {
      setScannedHeaders([]);
    }

    try {
      const data = await projectsApi.scanHeaders(selectedProjectId, spreadsheetId);
      setScannedHeaders(data.headers || []);
      // Mark as dirty after scanning (new headers need to be saved)
      if (!silent) {
        setHasUnsavedMappingChanges(true);
        toast({
          title: 'Nagłówki przeskanowane',
          description: `Znaleziono ${data.headers?.length || 0} kolumn`,
        });
      }
    } catch (error) {
      const errorMessage = parseGoogleSheetsError(error);
      if (!silent) {
        toast({
          variant: 'destructive',
          title: 'Błąd skanowania',
          description: errorMessage,
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Save Mappings
  const handleSaveMappings = async () => {
    if (!selectedProjectId) return;

    setIsSavingMappings(true);

    try {
      // Build mappings array - only include columns marked as "import"
      const mappingsArray = [];

      scannedHeaders.forEach((header) => {
        const columnLetter = header.letter;
        const role = mappings[columnLetter];

        // Skip if role is 'ignore' or not set
        if (!role || role === 'ignore') {
          return;
        }

        // Generate internal key from header text
        const headerText = header.value || `Column ${columnLetter}`;
        const internalKey = generateInternalKey(headerText);
        const displayName = headerText; // Use original header text as display name

        // Only add if we have a valid internal key
        if (internalKey) {
          // Get field configuration for this column
          const fieldConfig = getFieldConfig(columnLetter);
          
          // Build mapping object with field details
          const mappingData = {
            sheetColumnLetter: columnLetter,
            internalKey: internalKey,
            displayName: displayName,
            isVisible: true,
            fieldType: fieldConfig.fieldType || 'text',
            isRequired: fieldConfig.isRequired || false,
          };

          // Add optional fields only if they have values
          if (fieldConfig.maxLength && fieldConfig.maxLength > 0) {
            mappingData.maxLength = fieldConfig.maxLength;
          }

          if (fieldConfig.options && Array.isArray(fieldConfig.options) && fieldConfig.options.length > 0) {
            mappingData.options = fieldConfig.options;
          }

          mappingsArray.push(mappingData);
        }
      });

      await projectsApi.updateMappings(selectedProjectId, mappingsArray);
      
      toast({
        title: 'Mapowania zapisane',
        description: `Zapisano ${mappingsArray.length} kolumn`,
      });

      // Update original saved mappings to current state
      setOriginalSavedMappings(JSON.stringify(mappings));
      // Clear dirty state after saving
      setHasUnsavedMappingChanges(false);

      // Refresh mappings and participants data
      queryClient.invalidateQueries({ queryKey: ['fieldMappings', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['participants', selectedProjectId] });
    } catch (error) {
      const errorMessage = parseGoogleSheetsError(error);
      toast({
        variant: 'destructive',
        title: 'Błąd zapisywania',
        description: errorMessage,
      });
    } finally {
      setIsSavingMappings(false);
    }
  };

  // Check if sheet URL has changed from saved config
  const hasUnsavedChanges =
    configData?.configured &&
    configData?.config?.sheetUrl &&
    sheetUrl.trim() !== configData.config.sheetUrl;

  // Determine connection status
  const isTesting = testConnectionMutation.isPending;
  const isSaving = connectSheetMutation.isPending;
  const isCreatingTemplate = createTemplateMutation.isPending;
  const isDeletingTemplate = deleteTemplateMutation.isPending;

  // Add bottom padding when action bar is visible to prevent content from being hidden
  const hasActionBar = hasUnsavedMappingChanges || isMappingUninitialized;

  return (
    <div className={`container mx-auto py-8 px-4 max-w-5xl ${hasActionBar ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Konfiguracja Wydarzenia
        </h1>
        <p className="text-muted-foreground">
          Zarządzaj połączeniem z Google Workspace i szablonami dokumentów.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Source Sheet */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <CardTitle>Arkusz Źródłowy</CardTitle>
            </div>
            <CardDescription>
              To jest główna baza danych uczestników. Podaj link do arkusza
              Google Sheets, który zawiera listę uczestników wydarzenia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current configuration info */}
            {isLoadingConfig && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Ładowanie konfiguracji...</span>
              </div>
            )}

            {configError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Błąd</AlertTitle>
                <AlertDescription>
                  Nie udało się pobrać konfiguracji. Spróbuj odświeżyć stronę.
                </AlertDescription>
              </Alert>
            )}

            {/* Sheet URL input */}
            <div className="space-y-2">
              <Label htmlFor="sheetUrl">Link do arkusza Google Sheets</Label>
              <div className="flex gap-2">
                <Input
                  id="sheetUrl"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => {
                    setSheetUrl(e.target.value);
                    // Reset test result when URL changes
                    if (testResult) {
                      setTestResult(null);
                      setTestInfo(null);
                      setTestError(null);
                    }
                  }}
                  className="font-mono text-sm"
                  disabled={isTesting || isSaving}
                />
                <Button
                  onClick={handleTestConnection}
                  disabled={!sheetUrl.trim() || isTesting || isSaving}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testowanie...
                    </>
                  ) : (
                    <>
                      <Link className="h-4 w-4 mr-2" />
                      Testuj
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Test Result - Success */}
            {testResult === 'success' && testInfo && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Połączenie udane
                    </span>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Arkusz: <strong>{testInfo.title}</strong>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                  >
                    {testInfo.sheetsCount} zakładek
                  </Badge>
                </div>

                {/* Sheet details */}
                {testInfo.sheetNames && testInfo.sheetNames.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Zakładki:</span>{' '}
                    {testInfo.sheetNames.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Test Result - Error */}
            {testResult === 'error' && testError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Nie udało się połączyć
                  </span>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                    {testError}
                  </p>
                </div>
              </div>
            )}

            {/* Current saved configuration */}
            {configData?.configured && configData?.config && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Aktualnie podłączony arkusz
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {configData.config.sheetTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {configData.config.connected ? (
                      <Badge
                        variant="outline"
                        className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Połączony
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Brak połączenia
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchConfig()}
                      disabled={isLoadingConfig}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoadingConfig ? 'animate-spin' : ''}`}
                      />
                    </Button>
                    {configData.config.sheetUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={configData.config.sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Save button - only for admins */}
          {isAdmin && (
            <CardFooter className="border-t pt-4">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-muted-foreground">
                  {hasUnsavedChanges
                    ? 'Masz niezapisane zmiany'
                    : testResult === 'success' && !configData?.configured
                      ? 'Kliknij "Zapisz", aby podłączyć arkusz'
                      : 'Tylko administratorzy mogą zmieniać konfigurację'}
                </p>
                <Button
                  onClick={handleConnectSheet}
                  disabled={
                    !sheetUrl.trim() ||
                    !selectedProjectId ||
                    isTesting ||
                    isSaving ||
                    testResult !== 'success'
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Zapisz konfigurację
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Section 2: Data Source Mapping */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" />
              <CardTitle>Mapowanie Kolumn</CardTitle>
            </div>
            <CardDescription>
              Skanuj nagłówki z arkusza Google Sheets i mapuj kolumny do pól systemowych.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info about using saved configuration */}
            {configData?.configured && configData?.config?.sheetId ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Używanie zapisanego arkusza</AlertTitle>
                <AlertDescription>
                  Skanowanie będzie używać arkusza z sekcji "Arkusz Źródłowy":{' '}
                  <strong>{configData.config.sheetTitle}</strong>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Brak konfiguracji arkusza</AlertTitle>
                <AlertDescription>
                  Najpierw podłącz arkusz Google Sheets w sekcji "Arkusz Źródłowy" powyżej.
                </AlertDescription>
              </Alert>
            )}

            {/* Scan Headers Button */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleScanHeaders}
                  disabled={
                    !configData?.config?.sheetId ||
                    !selectedProjectId ||
                    isScanning ||
                    isLoadingConfig
                  }
                  variant="outline"
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Skanowanie...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Skanuj nagłówki
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Skanuje nagłówki z zapisanego arkusza i automatycznie sugeruje mapowania.
              </p>
            </div>

            {/* Loading State: Show when auto-initializing (scanning headers or loading mappings) */}
            {(isScanning || isLoadingMappings) && scannedHeaders.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {isScanning
                    ? 'Ładowanie konfiguracji...'
                    : 'Ładowanie zapisanych mapowań...'}
                </span>
              </div>
            )}

            {/* Mapping Interface - Show when headers are loaded */}
            {scannedHeaders.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Mapowanie kolumn</h4>
                  <p className="text-xs text-muted-foreground">
                    Przypisz rolę każdej kolumnie z arkusza
                  </p>
                </div>
                
                <div className="space-y-3">
                  {scannedHeaders.map((header) => {
                    // Explicitly set to 'ignore' if not 'import' - ensure value is always set
                    const currentRole = mappings[header.letter] === 'ignore' ? 'ignore' : (mappings[header.letter] || 'import');
                    const headerText = header.value || `Column ${header.letter}`;
                    const generatedKey = generateInternalKey(headerText);
                    const isIgnored = currentRole === 'ignore';
                    const fieldConfig = getFieldConfig(header.letter);
                    const showFieldDetails = currentRole === 'import';
                    
                    return (
                      <div 
                        key={header.letter} 
                        className={`space-y-3 transition-opacity ${
                          isIgnored ? 'opacity-50' : 'opacity-100'
                        }`}
                      >
                        {/* Header row with Label and Select */}
                        <div className="flex items-center gap-3">
                          <Label 
                            htmlFor={`mapping-${header.letter}`} 
                            className={`w-48 text-sm font-medium ${isIgnored ? 'text-muted-foreground' : ''}`}
                          >
                            <span className="text-muted-foreground">Kolumna {header.letter}:</span>{' '}
                            <span className="font-semibold">{header.value || '(Pusta)'}</span>
                          </Label>
                          <div className="flex-1 flex flex-col gap-1">
                            <Select
                              value={currentRole}
                              onValueChange={(value) => {
                                setMappings((prev) => {
                                  const updated = { ...prev };
                                  // Explicitly set the value - ensure 'ignore' is properly stored
                                  updated[header.letter] = value === 'ignore' ? 'ignore' : 'import';
                                  return updated;
                                });
                                // Initialize field config when switching to import
                                if (value === 'import' && !fieldConfigs[header.letter]) {
                                  updateFieldConfig(header.letter, {
                                    fieldType: 'text',
                                    isRequired: false,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger 
                                id={`mapping-${header.letter}`}
                                className={isIgnored ? 'opacity-75' : ''}
                              >
                                <SelectValue placeholder="Wybierz..." />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                    {' — '}
                                    <span className="text-muted-foreground text-xs">
                                      {role.description}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {/* Show generated key when importing */}
                            {currentRole === 'import' && generatedKey && (
                              <p className="text-xs text-muted-foreground ml-1">
                                Key: <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{generatedKey}</code>
                              </p>
                            )}
                            {/* Show ignored status */}
                            {isIgnored && (
                              <p className="text-xs text-muted-foreground ml-1 italic">
                                Ta kolumna nie będzie importowana
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Field Details Panel - Conditional rendering when Import is selected */}
                        {showFieldDetails && (
                          <div 
                            className="bg-muted/50 p-4 rounded-md mt-4 animate-in fade-in slide-in-from-top-2 duration-200"
                            style={{ animationFillMode: 'both' }}
                          >
                            <h5 className="text-sm font-semibold mb-4">Szczegóły Pola</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Field Type Select */}
                              <div className="space-y-2">
                                <Label htmlFor={`field-type-${header.letter}`} className="text-sm">
                                  Typ Pola
                                </Label>
                                <Select
                                  value={fieldConfig.fieldType}
                                  onValueChange={(value) => {
                                    updateFieldConfig(header.letter, {
                                      fieldType: value,
                                      // Clear conditional fields when type changes
                                      maxLength: value === 'text' || value === 'email' ? fieldConfig.maxLength : null,
                                      options: value === 'select' ? fieldConfig.options : null,
                                    });
                                  }}
                                >
                                  <SelectTrigger id={`field-type-${header.letter}`}>
                                    <SelectValue placeholder="Wybierz typ pola..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fieldTypeOptions.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Required Switch */}
                              <div className="space-y-2">
                                <Label htmlFor={`required-${header.letter}`} className="text-sm">
                                  Pole wymagane
                                </Label>
                                <div className="flex items-center space-x-2 pt-2">
                                  <Switch
                                    id={`required-${header.letter}`}
                                    checked={fieldConfig.isRequired}
                                    onCheckedChange={(checked) => {
                                      updateFieldConfig(header.letter, {
                                        isRequired: checked,
                                      });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`required-${header.letter}`} 
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {fieldConfig.isRequired ? 'Tak' : 'Nie'}
                                  </Label>
                                </div>
                              </div>

                              {/* Max Length - for Text and Email fields */}
                              {(fieldConfig.fieldType === 'text' || fieldConfig.fieldType === 'email') && (
                                <div className="space-y-2">
                                  <Label htmlFor={`max-length-${header.letter}`} className="text-sm">
                                    Max długość
                                  </Label>
                                  <Input
                                    id={`max-length-${header.letter}`}
                                    type="number"
                                    min="1"
                                    placeholder="np. 100"
                                    value={fieldConfig.maxLength || ''}
                                    onChange={(e) => {
                                      const value = e.target.value ? parseInt(e.target.value, 10) : null;
                                      updateFieldConfig(header.letter, {
                                        maxLength: value && value > 0 ? value : null,
                                      });
                                    }}
                                  />
                                </div>
                              )}

                              {/* Options - for Select fields */}
                              {fieldConfig.fieldType === 'select' && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label htmlFor={`options-${header.letter}`} className="text-sm">
                                    Opcje (oddzielone przecinkiem)
                                  </Label>
                                  <Textarea
                                    id={`options-${header.letter}`}
                                    placeholder="np. opcja1, opcja2, opcja3"
                                    value={
                                      fieldConfig.options && Array.isArray(fieldConfig.options)
                                        ? fieldConfig.options.join(', ')
                                        : (fieldConfig.options || '')
                                    }
                                    onChange={(e) => {
                                      const value = e.target.value.trim();
                                      const options = value
                                        ? value.split(',').map((opt) => opt.trim()).filter((opt) => opt.length > 0)
                                        : null;
                                      updateFieldConfig(header.letter, {
                                        options: options && options.length > 0 ? options : null,
                                      });
                                    }}
                                    rows={3}
                                  />
                                  {fieldConfig.options && Array.isArray(fieldConfig.options) && fieldConfig.options.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {fieldConfig.options.length} opcja/opcje zdefiniowana/e
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Info about auto-import */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Automatyczne importowanie</AlertTitle>
                  <AlertDescription>
                    Wszystkie kolumny są automatycznie importowane. Klucze wewnętrzne są generowane z nazw nagłówków.
                    Możesz wyłączyć import dla konkretnych kolumn, wybierając "Ignorowane / Do not import".
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Info when no headers scanned and not loading */}
            {scannedHeaders.length === 0 &&
              configData?.config?.sheetId &&
              !isScanning &&
              !isLoadingMappings &&
              !isLoadingConfig && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Gotowy do skanowania</AlertTitle>
                  <AlertDescription>
                    Kliknij "Skanuj nagłówki", aby pobrać nagłówki z arkusza i rozpocząć mapowanie.
                    {savedMappingsData && savedMappingsData.length > 0 && (
                      <span className="block mt-1">
                        Zapisane mapowania zostały załadowane i wyświetlone poniżej.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
          </CardContent>
        </Card>

        {/* Sticky Bottom Action Bar - Shows when there are unsaved changes or uninitialized state */}
        {(hasUnsavedMappingChanges || isMappingUninitialized) && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg transition-all duration-300 ease-in-out">
            <div className="container mx-auto max-w-5xl px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Message */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isMappingUninitialized ? (
                    <>
                      <div className="flex-shrink-0 w-1 h-8 bg-amber-500 rounded-full" />
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            Konfiguracja mapowania nie została jeszcze zapisana
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Zatwierdź zmiany, aby aktywować import danych
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-1 h-8 bg-primary rounded-full" />
                      <div className="flex items-center gap-2 min-w-0">
                        <Info className="h-5 w-5 text-primary flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground">
                          Masz niezapisane zmiany w mapowaniu
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Save Button */}
                <Button
                  onClick={handleSaveMappings}
                  disabled={isSavingMappings || !selectedProjectId}
                  className={`flex-shrink-0 ${
                    isMappingUninitialized
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  {isSavingMappings ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      {isMappingUninitialized ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Zapisz konfigurację
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Zapisz zmiany
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Document Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Szablony Dokumentów</CardTitle>
            </div>
            <CardDescription>
              Zdefiniuj szablony Google Docs używane do generowania PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTemplates && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Ładowanie szablonów...</span>
              </div>
            )}
            {!isLoadingTemplates && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa Szablonu</TableHead>
                    <TableHead>Google Doc ID</TableHead>
                    <TableHead className="w-[150px] text-right">
                      Akcje
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        Brak zdefiniowanych szablonów
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {template.docId}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplateForMappings(template);
                                setMappingsModalOpen(true);
                              }}
                              disabled={!isAdmin}
                            >
                              Mapowania
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              disabled={isDeletingTemplate || !isAdmin}
                              className="text-destructive hover:text-destructive"
                            >
                              {isDeletingTemplate ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>

          <Separator />

          <CardFooter className="pt-6">
            <div className="w-full space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Dodaj nowy szablon
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="templateName" className="text-xs">
                    Nazwa szablonu
                  </Label>
                  <Input
                    id="templateName"
                    placeholder="np. Certyfikat uczestnictwa"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDocId" className="text-xs">
                    Google Doc ID
                  </Label>
                  <Input
                    id="templateDocId"
                    placeholder="1a2b3c4d5e6f7g8h9i0j"
                    value={newTemplateDocId}
                    onChange={(e) => setNewTemplateDocId(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddTemplate}
                disabled={
                  !newTemplateName.trim() ||
                  !newTemplateDocId.trim() ||
                  !selectedProjectId ||
                  isCreatingTemplate ||
                  !isAdmin
                }
                className="w-full md:w-auto"
              >
                {isCreatingTemplate ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Dodawanie...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj szablon
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Section 4: Service Account Info (for admins) */}
        {isAdmin && serviceAccountData && (
          <Alert variant={serviceAccountData.configured ? 'default' : 'destructive'}>
            <Info className="h-4 w-4" />
            <AlertTitle>
              {serviceAccountData.configured 
                ? 'Konto serwisowe Google' 
                : 'Brak konfiguracji Google API'}
            </AlertTitle>
            <AlertDescription className="mt-2">
              {serviceAccountData.configured ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    Aby połączyć arkusz, musisz go udostępnić dla poniższego adresu email
                    (z uprawnieniami <strong>Edytor</strong>):
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <code className="text-xs font-mono flex-1 break-all">
                      {serviceAccountData.email}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyServiceAccountEmail}
                      className="shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{serviceAccountData.message}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Section 5: Help/Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Jak skonfigurować połączenie?</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <div>
              <p className="font-medium text-sm mb-1">
                1. Skopiuj link do arkusza Google Sheets
              </p>
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono block overflow-x-auto">
                https://docs.google.com/spreadsheets/d/
                <span className="text-primary font-semibold">
                  1a2b3c4d5e6f7g8h9i0j
                </span>
                /edit
              </code>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">
                2. Udostępnij arkusz dla konta serwisowego
              </p>
              <p className="text-xs text-muted-foreground">
                Kliknij przycisk "Udostępnij" w arkuszu Google i dodaj adres email
                konta serwisowego (widoczny powyżej) z uprawnieniami "Edytor".
              </p>
            </div>
            <div>
              <p className="font-medium text-sm mb-1">
                3. Przetestuj i zapisz połączenie
              </p>
              <p className="text-xs text-muted-foreground">
                Wklej link do arkusza, kliknij "Testuj" aby sprawdzić połączenie,
                a następnie "Zapisz konfigurację".
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>

      {/* Template Mappings Modal */}
      {selectedTemplateForMappings && (
        <TemplateMappingsModal
          open={mappingsModalOpen}
          onOpenChange={setMappingsModalOpen}
          templateId={selectedTemplateForMappings.id}
          templateName={selectedTemplateForMappings.name}
        />
      )}
    </div>
  );
}