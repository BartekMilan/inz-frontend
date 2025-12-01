"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function ParticipantFormPage({ mode = "add", initialData = null, onBack }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    organization: initialData?.organization || "",
    paymentStatus: initialData?.paymentStatus || "Nieopłacone",
    notes: initialData?.notes || "",
  })

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      toast({
        title: "Błąd walidacji",
        description: "Proszę wypełnić wszystkie wymagane pola.",
        variant: "destructive",
      })
      return
    }

    // Simulate API call to Google Sheets
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)

      toast({
        title: "Sukces!",
        description:
          mode === "add" ? "Uczestnik został dodany do Arkusza Google." : "Dane uczestnika zostały zaktualizowane.",
      })

      // Reset form if adding new participant
      if (mode === "add") {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          organization: "",
          paymentStatus: "Nieopłacone",
          notes: "",
        })
      }

      // Navigate back after short delay
      setTimeout(() => {
        if (onBack) onBack()
      }, 500)
    }, 1500)
  }

  // Handle cancel
  const handleCancel = () => {
    if (onBack) onBack()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Top Navigation */}
      <div className="max-w-[600px] mx-auto mb-6">
        <Button variant="ghost" onClick={handleCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Wróć do listy
        </Button>
      </div>

      {/* Main Form Container */}
      <div className="max-w-[600px] mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "add" ? "Dodaj nowego uczestnika" : "Edytuj dane uczestnika"}</CardTitle>
            <CardDescription>Wprowadź dane, aby zaktualizować listę w Arkuszu Google.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Imię <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jan"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Nazwisko <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Kowalski"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Adres Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jan.kowalski@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <Label htmlFor="organization">Organizacja / Firma</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Nazwa firmy"
                  value={formData.organization}
                  onChange={(e) => handleInputChange("organization", e.target.value)}
                />
              </div>

              {/* Payment Status */}
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Status Płatności</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => handleInputChange("paymentStatus", value)}
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="Wybierz status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nieopłacone">Nieopłacone</SelectItem>
                    <SelectItem value="Opłacone">Opłacone</SelectItem>
                    <SelectItem value="Oczekuje">Oczekuje</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notatki</Label>
                <Textarea
                  id="notes"
                  placeholder="Uwagi wewnętrzne dla zespołu..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              {/* Cancel Button */}
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Anuluj
              </Button>

              {/* Submit Button */}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zapisz uczestnika"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
