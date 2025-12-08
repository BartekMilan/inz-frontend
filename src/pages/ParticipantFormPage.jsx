"use client"

import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  User,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { useFieldDefinitions } from "@/hooks/use-field-definitions"
import { useCreateParticipant } from "@/hooks/use-participants"
import { useProject } from "@/contexts/ProjectContext"

/**
 * Generuje schemat zod na podstawie konfiguracji pól
 * @param {Array} fieldsConfig - Tablica konfiguracji pól
 * @returns {z.ZodObject} Schemat zod
 */
function generateZodSchema(fieldsConfig) {
  if (!fieldsConfig || fieldsConfig.length === 0) {
    console.log('[generateZodSchema] No fields config provided')
    return z.object({})
  }

  console.log('[generateZodSchema] Processing', fieldsConfig.length, 'fields')

  const schemaShape = {}

  fieldsConfig.forEach((field) => {
    // Normalize field data with fallbacks
    const fieldName = field.fieldName || field.field_name
    const fieldType = field.fieldType || field.field_type || 'text' // Fallback to 'text'
    const isRequired = field.isRequired !== undefined ? field.isRequired : (field.is_required !== undefined ? field.is_required : false)
    const options = field.options || null
    const validationRules = field.validationRules || field.validation_rules || null

    console.log('[generateZodSchema] Processing field:', {
      fieldName,
      fieldType,
      isRequired,
      hasOptions: !!options,
    })

    if (!fieldName) {
      console.warn('[generateZodSchema] Field without fieldName skipped:', field)
      return
    }

    let fieldSchema

    // Mapowanie typów pól na schematy zod
    switch (fieldType) {
      case "text":
      case "textarea":
        fieldSchema = z.string()
        // Dodaj walidację max_length jeśli jest w validationRules
        if (validationRules?.maxLength) {
          fieldSchema = fieldSchema.max(
            validationRules.maxLength,
            `Maksymalna długość to ${validationRules.maxLength} znaków`
          )
        }
        break

      case "email":
        fieldSchema = z.string().email("Nieprawidłowy format email")
        break

      case "number":
        // Używamy coerce, bo input HTML zwraca stringi
        fieldSchema = z.coerce.number({
          required_error: "To pole jest wymagane",
          invalid_type_error: "Musi być liczbą",
        })
        // Dodaj walidację min/max jeśli jest w validationRules
        if (validationRules?.min !== undefined) {
          fieldSchema = fieldSchema.min(
            validationRules.min,
            `Wartość musi być większa lub równa ${validationRules.min}`
          )
        }
        if (validationRules?.max !== undefined) {
          fieldSchema = fieldSchema.max(
            validationRules.max,
            `Wartość musi być mniejsza lub równa ${validationRules.max}`
          )
        }
        break

      case "date":
        fieldSchema = z.string()
        break

      case "select":
        // Dla select sprawdzamy czy wartość jest w opcjach
        if (options && options.length > 0) {
          fieldSchema = z.enum(options, {
            errorMap: () => ({ message: "Wybierz jedną z dostępnych opcji" }),
          })
        } else {
          fieldSchema = z.string()
        }
        break

      case "checkbox":
        fieldSchema = z.boolean().default(false)
        break

      case "phone":
        fieldSchema = z.string()
        // Można dodać walidację numeru telefonu jeśli potrzeba
        break

      default:
        fieldSchema = z.string()
    }

    // Obsługa wymagalności pola
    if (isRequired) {
      if (fieldType === "checkbox") {
        // Dla checkbox, jeśli jest wymagany, sprawdzamy czy jest true
        fieldSchema = z.boolean().refine((val) => val === true, {
          message: "To pole jest wymagane",
        })
      } else if (fieldType === "number") {
        // Dla number, już mamy required_error w coerce
        // Nie dodajemy dodatkowej walidacji, bo coerce.number() już obsługuje wymagalność
      } else if (fieldType === "select") {
        // Dla select (enum), nie możemy użyć .min(), więc używamy refine
        // Enum już sprawdza, czy wartość jest w opcjach
        if (options && options.length > 0) {
          // Enum już wymusza wybór jednej z opcji, więc nie potrzebujemy dodatkowej walidacji
          // Enum nie pozwala na undefined/null, więc jest już wymagany
        } else {
          // Jeśli nie ma opcji, traktujemy jak zwykły string
          fieldSchema = z.string().min(1, "To pole jest wymagane")
        }
      } else if (fieldType === "email") {
        // Dla email, używamy refine zamiast min(), bo email() zwraca ZodEffects
        fieldSchema = fieldSchema.refine((val) => val && val.trim().length > 0, {
          message: "To pole jest wymagane",
        })
      } else {
        // Dla innych typów string (text, textarea, phone, date) używamy min(1)
        // Sprawdzamy, czy fieldSchema jest ZodString (ma metodę min)
        if (fieldSchema && typeof fieldSchema.min === 'function') {
          fieldSchema = fieldSchema.min(1, "To pole jest wymagane")
        } else {
          // Fallback dla przypadków, gdy min() nie jest dostępne (np. ZodEffects)
          fieldSchema = fieldSchema.refine((val) => val && String(val).trim().length > 0, {
            message: "To pole jest wymagane",
          })
        }
      }
    } else {
      // Jeśli pole nie jest wymagane, pozwalamy na pustą wartość
      if (fieldType === "checkbox") {
        // Checkbox zawsze ma wartość boolean, więc nie zmieniamy
      } else if (fieldType === "number") {
        // Dla number, jeśli nie jest wymagany, pozwalamy na undefined
        fieldSchema = fieldSchema.optional()
      } else if (fieldType === "select") {
        // Dla select (enum), jeśli nie jest wymagany, musimy pozwolić na pustą wartość
        // Ale enum nie obsługuje optional() bezpośrednio, więc używamy union z pustym stringiem
        if (options && options.length > 0) {
          // Nie możemy łatwo zrobić enum optional, więc zostawiamy jak jest
          // Użytkownik musi wybrać opcję, ale może to być pusta opcja jeśli jest w liście
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal(""))
        }
      } else {
        // Dla stringów, pozwalamy na pusty string lub undefined
        if (fieldSchema && typeof fieldSchema.optional === 'function') {
          fieldSchema = fieldSchema.optional().or(z.literal(""))
        } else {
          // Fallback dla przypadków, gdy optional() nie jest dostępne
          fieldSchema = z.union([fieldSchema, z.literal("")])
        }
      }
    }

    schemaShape[fieldName] = fieldSchema
  })

  return z.object(schemaShape)
}

/**
 * Renderuje pole formularza na podstawie jego typu
 */
function renderFormField(field, control) {
  // Normalize field data with fallbacks
  const fieldName = field.fieldName || field.field_name
  const fieldLabel = field.fieldLabel || field.field_label || fieldName
  const fieldType = field.fieldType || field.field_type || 'text' // Fallback to 'text'
  const isRequired = field.isRequired !== undefined ? field.isRequired : (field.is_required !== undefined ? field.is_required : false)
  const options = field.options || null
  const validationRules = field.validationRules || field.validation_rules || null

  console.log('[renderFormField] Rendering field:', {
    fieldName,
    fieldLabel,
    fieldType,
    isRequired,
  })

  return (
    <FormField
      key={fieldName}
      control={control}
      name={fieldName}
      render={({ field: formField }) => {
        switch (fieldType) {
          case "text":
          case "phone":
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={fieldType === "phone" ? "tel" : "text"}
                    placeholder={`Wprowadź ${fieldLabel.toLowerCase()}`}
                    maxLength={validationRules?.maxLength}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )

          case "email":
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="przykład@email.com"
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )

          case "number":
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={`Wprowadź ${fieldLabel.toLowerCase()}`}
                    min={validationRules?.min}
                    max={validationRules?.max}
                    {...formField}
                    value={formField.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                      formField.onChange(value === "" ? undefined : Number(value))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )

          case "date":
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input type="date" {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )

          case "select":
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                {options && options.length > 0 ? (
                  <Select
                    onValueChange={formField.onChange}
                    value={formField.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Wybierz ${fieldLabel.toLowerCase()}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Brak dostępnych opcji
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )

          case "checkbox":
            return (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value || false}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {fieldLabel}
                    {isRequired && <span className="text-destructive ml-1">*</span>}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )

          case "textarea":
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`Wprowadź ${fieldLabel.toLowerCase()}`}
                    maxLength={validationRules?.maxLength}
                    className="min-h-24"
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )

          default:
            return (
              <FormItem>
                <FormLabel>
                  {fieldLabel}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={`Wprowadź ${fieldLabel.toLowerCase()}`}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )
        }
      }}
    />
  )
}

export default function ParticipantFormPage() {
  const { selectedProjectId } = useProject()
  
  // Debug: log projectId
  console.log('[ParticipantFormPage] selectedProjectId:', selectedProjectId)
  console.log('[ParticipantFormPage] selectedProjectId type:', typeof selectedProjectId)
  console.log('[ParticipantFormPage] selectedProjectId truthy?', !!selectedProjectId)
  
  const { data: fieldsConfig = [], isLoading: isLoadingFields, error: fieldsError } = useFieldDefinitions()
  const createParticipantMutation = useCreateParticipant()

  // Debug: log fieldsConfig
  console.log('[ParticipantFormPage] fieldsConfig:', fieldsConfig)
  console.log('[ParticipantFormPage] fieldsConfig length:', fieldsConfig.length)
  console.log('[ParticipantFormPage] isLoadingFields:', isLoadingFields)
  console.log('[ParticipantFormPage] fieldsError:', fieldsError)
  if (fieldsConfig.length > 0) {
    console.log('[ParticipantFormPage] Sample field:', fieldsConfig[0])
    console.log('[ParticipantFormPage] Field keys:', Object.keys(fieldsConfig[0]))
  }

  // Generuj schemat zod na podstawie konfiguracji pól
  const zodSchema = useMemo(() => {
    console.log('[ParticipantFormPage] Generating zod schema for fields:', fieldsConfig)
    return generateZodSchema(fieldsConfig)
  }, [fieldsConfig])

  // Inicjalizuj wartości domyślne formularza
  const defaultValues = useMemo(() => {
    const values = {}
    fieldsConfig.forEach((field) => {
      const fieldName = field.fieldName || field.field_name
      const fieldType = field.fieldType || field.field_type || 'text'
      
      if (!fieldName) {
        console.warn('[defaultValues] Field without fieldName skipped:', field)
        return
      }

      if (fieldType === "checkbox") {
        values[fieldName] = false
      } else if (fieldType === "number") {
        values[fieldName] = undefined
      } else {
        values[fieldName] = ""
      }
    })
    console.log('[defaultValues] Generated default values:', values)
    return values
  }, [fieldsConfig])

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: "onBlur", // Walidacja przy blur
  })

  const onSubmit = async (data) => {
    try {
      await createParticipantMutation.mutateAsync(data)
      // Reset formularza po udanym zapisie
      form.reset(defaultValues)
      // Można dodać toast notification tutaj
      alert("Dane zostały zapisane pomyślnie!")
    } catch (error) {
      console.error("Błąd podczas zapisywania:", error)
      alert("Wystąpił błąd podczas zapisywania danych.")
    }
  }

  const handleCancel = () => {
    form.reset(defaultValues)
  }

  if (!selectedProjectId) {
    return (
      <div className="max-w-5xl mx-auto pb-32 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Nie wybrano projektu.
              </p>
              <p className="text-sm text-muted-foreground">
                Wybierz projekt, aby móc dodawać uczestników.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingFields) {
    return (
      <div className="max-w-5xl mx-auto pb-32 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Ładowanie konfiguracji formularza...</span>
        </div>
      </div>
    )
  }

  if (fieldsError) {
    return (
      <div className="max-w-5xl mx-auto pb-32 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">
                Wystąpił błąd podczas ładowania konfiguracji formularza.
              </p>
              <p className="text-sm text-muted-foreground">
                {fieldsError.message || "Spróbuj odświeżyć stronę."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (fieldsConfig.length === 0) {
    return (
      <div className="max-w-5xl mx-auto pb-32 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Brak skonfigurowanych pól dla tego projektu.
              </p>
              <p className="text-sm text-muted-foreground">
                Skonfiguruj pola w ustawieniach projektu, aby móc dodawać uczestników.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b z-10 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dane Uczestnika</h1>
            <p className="text-sm text-muted-foreground mt-1">Wypełnij formularz rejestracyjny</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Dane Uczestnika
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fieldsConfig.map((field) => {
                  const fieldName = field.fieldName || field.field_name || field.id
                  return (
                    <div key={fieldName}>
                      {renderFormField(field, form.control)}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sticky Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t px-6 py-5 z-20">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="text-destructive">*</span> Pola wymagane
              </div>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createParticipantMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  disabled={createParticipantMutation.isPending}
                >
                  {createParticipantMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Zapisywanie...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Zapisz
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
