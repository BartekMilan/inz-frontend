import React, { useState } from 'react';
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
import { Link, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  // State for Source Sheet
  const [sheetId, setSheetId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

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

  // Handle Test Connection
  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setIsConnected(true);
    }, 1000);
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
              To jest główna baza danych uczestników.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheetId">Google Sheet ID lub URL</Label>
              <div className="flex gap-2">
                <Input
                  id="sheetId"
                  placeholder="1a2b3c4d5e6f7g8h9i0j lub https://docs.google.com/spreadsheets/d/..."
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleTestConnection}
                  disabled={!sheetId || isTesting}
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
                      Testuj połączenie
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Połączono pomyślnie
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                >
                  Połączono
                </Badge>
              </div>
            )}
          </CardContent>
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

        {/* Section 3: Help/Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Jak znaleźć ID dokumentu?</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              <strong>Google Sheet ID:</strong> Znajduje się w adresie URL
              arkusza: <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                https://docs.google.com/spreadsheets/d/
                <span className="text-primary font-semibold">
                  1a2b3c4d5e6f7g8h9i0j
                </span>
                /edit
              </code>
            </p>
            <p>
              <strong>Google Doc ID:</strong> Znajduje się w adresie URL
              dokumentu: <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                https://docs.google.com/document/d/
                <span className="text-primary font-semibold">
                  1a2b3c4d5e6f7g8h9i0j
                </span>
                /edit
              </code>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Możesz wkleić cały URL - system automatycznie wyodrębni ID.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}