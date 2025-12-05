import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { toast } = useToast();
  const { checkIsAdmin } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = checkIsAdmin();

  // State for Source Sheet
  const [sheetUrl, setSheetUrl] = useState('');
  const [testResult, setTestResult] = useState(null); // null | 'success' | 'error'
  const [testInfo, setTestInfo] = useState(null);
  const [testError, setTestError] = useState(null);

  // State for Templates
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Identyfikator',
      docId: '1a2b3c4d5e6f7g8h9i0j',
    },
    {
      id: 2,
      name: 'Certyfikat uczestnictwa',
      docId: '9i8h7g6f5e4d3c2b1a0z',
    },
  ]);

  // State for New Template Form
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDocId, setNewTemplateDocId] = useState('');

  // Query: Get Service Account info
  const { data: serviceAccountData } = useQuery({
    queryKey: ['serviceAccountInfo'],
    queryFn: googleSheetsApi.getServiceAccountInfo,
    retry: 1,
    staleTime: 60000, // 1 minute
    enabled: isAdmin,
  });

  // Query: Get current sheet configuration
  const {
    data: configData,
    isLoading: isLoadingConfig,
    error: configError,
    refetch: refetchConfig,
  } = useQuery({
    queryKey: ['sheetConfiguration'],
    queryFn: googleSheetsApi.getConfiguration,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Populate sheetUrl from saved configuration
  useEffect(() => {
    if (configData?.configured && configData?.config?.sheetUrl) {
      setSheetUrl(configData.config.sheetUrl);
    }
  }, [configData]);

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

  // Mutation: Connect (save) sheet
  const connectSheetMutation = useMutation({
    mutationFn: (url) => googleSheetsApi.connectSheet(url),
    onSuccess: (data) => {
      toast({
        title: 'Arkusz podłączony',
        description: data.message || 'Konfiguracja została zapisana',
      });
      // Refresh configuration
      queryClient.invalidateQueries({ queryKey: ['sheetConfiguration'] });
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
    if (!sheetUrl.trim()) return;
    connectSheetMutation.mutate(sheetUrl.trim());
  };

  // Handle Add Template
  const handleAddTemplate = () => {
    if (newTemplateName.trim() && newTemplateDocId.trim()) {
      const newTemplate = {
        id: Date.now(),
        name: newTemplateName,
        docId: newTemplateDocId,
      };
      setTemplates([...templates, newTemplate]);
      setNewTemplateName('');
      setNewTemplateDocId('');
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = (id) => {
    setTemplates(templates.filter((template) => template.id !== id));
  };

  // Check if sheet URL has changed from saved config
  const hasUnsavedChanges =
    configData?.configured &&
    configData?.config?.sheetUrl &&
    sheetUrl.trim() !== configData.config.sheetUrl;

  // Determine connection status
  const isTesting = testConnectionMutation.isPending;
  const isSaving = connectSheetMutation.isPending;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
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

        {/* Section 2: Document Templates */}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa Szablonu</TableHead>
                  <TableHead>Google Doc ID</TableHead>
                  <TableHead className="w-[100px] text-right">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                disabled={!newTemplateName.trim() || !newTemplateDocId.trim()}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj szablon
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Section 3: Service Account Info (for admins) */}
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

        {/* Section 4: Help/Instructions */}
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
    </div>
  );
}