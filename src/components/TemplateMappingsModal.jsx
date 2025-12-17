import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTemplateMappings, useSetTemplateMappings } from '@/hooks/use-template-mappings';
import { useParticipants } from '@/hooks/use-participants';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Modal do zarządzania mapowaniami placeholderów dla szablonu
 * @param {Object} props
 * @param {boolean} props.open - Czy modal jest otwarty
 * @param {Function} props.onOpenChange - Callback przy zmianie stanu otwarcia
 * @param {string} props.templateId - ID szablonu
 * @param {string} props.templateName - Nazwa szablonu (do wyświetlenia)
 */
export default function TemplateMappingsModal({
  open,
  onOpenChange,
  templateId,
  templateName,
}) {
  const { toast } = useToast();
  const { data: mappingsData, isLoading, error } = useTemplateMappings(templateId);
  const setMappingsMutation = useSetTemplateMappings();
  const { data: participantsData } = useParticipants();

  // Stan lokalny dla mapowań (edytowalny)
  const [mappings, setMappings] = useState([]);

  // Pobierz listę kluczy uczestników
  const participantKeys = React.useMemo(() => {
    if (!participantsData?.data || participantsData.data.length === 0) {
      return [];
    }

    // Pobierz klucze z pierwszego uczestnika
    const firstParticipant = participantsData.data[0];
    const keys = Object.keys(firstParticipant || {});

    // Filtruj techniczne pola (opcjonalnie)
    return keys.filter((key) => {
      // Możesz dodać więcej filtrów jeśli potrzebujesz
      const technicalFields = ['id', '_id', '__v'];
      return !technicalFields.includes(key.toLowerCase());
    });
  }, [participantsData]);

  // Załaduj mapowania z API do stanu lokalnego
  useEffect(() => {
    if (mappingsData && Array.isArray(mappingsData)) {
      setMappings(mappingsData);
    } else {
      setMappings([]);
    }
  }, [mappingsData]);

  // Resetuj stan przy zamknięciu modala
  useEffect(() => {
    if (!open) {
      // Resetuj do danych z API po zamknięciu
      if (mappingsData && Array.isArray(mappingsData)) {
        setMappings(mappingsData);
      } else {
        setMappings([]);
      }
    }
  }, [open, mappingsData]);

  // Dodaj nowe mapowanie
  const handleAddMapping = () => {
    setMappings([...mappings, { placeholder: '', participantKey: '' }]);
  };

  // Usuń mapowanie
  const handleRemoveMapping = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  // Aktualizuj mapowanie
  const handleUpdateMapping = (index, field, value) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
  };

  // Walidacja przed zapisem
  const validateMappings = () => {
    // Sprawdź czy wszystkie mapowania mają wypełnione pola
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      if (!mapping.placeholder || !mapping.placeholder.trim()) {
        toast({
          variant: 'destructive',
          title: 'Błąd walidacji',
          description: `Wiersz ${i + 1}: Placeholder nie może być pusty`,
        });
        return false;
      }
      if (!mapping.participantKey || !mapping.participantKey.trim()) {
        toast({
          variant: 'destructive',
          title: 'Błąd walidacji',
          description: `Wiersz ${i + 1}: Klucz uczestnika nie może być pusty`,
        });
        return false;
      }
    }

    // Sprawdź duplikaty placeholderów (case-insensitive)
    const placeholders = mappings.map((m) => m.placeholder?.trim().toLowerCase()).filter(Boolean);
    const uniquePlaceholders = new Set(placeholders);
    if (placeholders.length !== uniquePlaceholders.size) {
      toast({
        variant: 'destructive',
        title: 'Błąd walidacji',
        description: 'Znaleziono duplikaty placeholderów. Każdy placeholder musi być unikalny.',
      });
      return false;
    }

    return true;
  };

  // Zapisz mapowania
  const handleSave = async () => {
    if (!validateMappings()) {
      return;
    }

    try {
      // Przygotuj dane do wysłania (bez nawiasów w placeholder)
      const mappingsToSave = mappings.map((m) => ({
        placeholder: m.placeholder.trim(),
        participantKey: m.participantKey.trim(),
      }));

      await setMappingsMutation.mutateAsync({
        templateId,
        mappings: mappingsToSave,
      });

      toast({
        title: 'Mapowania zapisane',
        description: 'Mapowania zostały pomyślnie zapisane',
      });

      // Zamknij modal
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Wystąpił błąd podczas zapisywania';
      toast({
        variant: 'destructive',
        title: 'Błąd zapisywania',
        description: errorMessage,
      });
    }
  };

  const isLoadingData = isLoading || setMappingsMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mapowania placeholderów - {templateName}</DialogTitle>
          <DialogDescription>
            Zarządzaj mapowaniami placeholderów dla tego szablonu. Placeholder wpisuj bez nawiasów,
            np. <code className="text-xs bg-muted px-1 py-0.5 rounded">Imię</code> (backend sam
            użyje <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{Imię}}'}</code>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Ładowanie mapowań...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nie udało się pobrać mapowań: {error.message || 'Nieznany błąd'}
              </AlertDescription>
            </Alert>
          )}

          {/* Brak uczestników - komunikat */}
          {!isLoading && !error && participantKeys.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Brak uczestników w projekcie. Dodaj uczestników, aby móc wykryć dostępne klucze.
              </AlertDescription>
            </Alert>
          )}

          {/* Lista mapowań */}
          {!isLoading && !error && (
            <div className="space-y-3">
              {mappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Brak mapowań. Kliknij "Dodaj mapowanie", aby rozpocząć.</p>
                </div>
              ) : (
                mappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      {/* Placeholder input */}
                      <div className="space-y-2">
                        <Label htmlFor={`placeholder-${index}`} className="text-xs">
                          Placeholder (bez nawiasów)
                        </Label>
                        <Input
                          id={`placeholder-${index}`}
                          placeholder="np. Imię"
                          value={mapping.placeholder || ''}
                          onChange={(e) =>
                            handleUpdateMapping(index, 'placeholder', e.target.value)
                          }
                          disabled={isLoadingData}
                        />
                      </div>

                      {/* Participant key select */}
                      <div className="space-y-2">
                        <Label htmlFor={`participantKey-${index}`} className="text-xs">
                          Klucz uczestnika
                        </Label>
                        <Select
                          value={mapping.participantKey || ''}
                          onValueChange={(value) =>
                            handleUpdateMapping(index, 'participantKey', value)
                          }
                          disabled={isLoadingData || participantKeys.length === 0}
                        >
                          <SelectTrigger id={`participantKey-${index}`}>
                            <SelectValue placeholder="Wybierz klucz..." />
                          </SelectTrigger>
                          <SelectContent>
                            {participantKeys.map((key) => (
                              <SelectItem key={key} value={key}>
                                {key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMapping(index)}
                      disabled={isLoadingData}
                      className="text-destructive hover:text-destructive mt-6"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}

              {/* Add mapping button */}
              <Button
                variant="outline"
                onClick={handleAddMapping}
                disabled={isLoadingData || participantKeys.length === 0}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Dodaj mapowanie
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoadingData}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isLoadingData || participantKeys.length === 0}>
            {setMappingsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              'Zapisz'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

