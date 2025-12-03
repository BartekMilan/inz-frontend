"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  User,
  Mail,
  Calendar,
  Globe,
  Users,
  Bed,
  UtensilsCrossed,
  Info,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegistrarForm() {
  const [formData, setFormData] = useState({
    imie: "",
    nazwisko: "",
    kraj: "",
    email: "",
    dataUrodzenia: "",
    konwencja: false,
    chor: false,
    seminarium: false,
    dzien6: false,
    dzien7: false,
    dzien8: false,
    dzien9: false,
    dzien10: false,
    dzien11: false,
    noc6_7: false,
    noc7_8: false,
    noc8_9: false,
    noc9_10: false,
    noc10_11: false,
    noc11_12: false,
    rodzajNoclegu: "",
    wspolokatorzy: "",
    przypisanyPokoj: "",
    rezygnacjaNoclegi: false,
    posilki: "",
    wegetarianskie: false,
    innaDieta: false,
    innaDietaUwagi: "",
    ulatwiony: false,
    dodatkowyObiad: false,
    dodatkowaKolacja: false,
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (field, value) => {
    switch (field) {
      case "imie":
        return !value.trim() ? "Imie jest wymagane" : null
      case "nazwisko":
        return !value.trim() ? "Nazwisko jest wymagane" : null
      case "kraj":
        return !value.trim() ? "Kraj jest wymagany" : null
      case "email":
        if (!value.trim()) return "Email jest wymagany"
        if (!EMAIL_REGEX.test(value)) return "Nieprawidlowy format email"
        return null
      case "dataUrodzenia":
        return !value ? "Data urodzenia jest wymagana" : null
      default:
        return null
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Section 1: Validate all basic data fields
    const requiredFields = ["imie", "nazwisko", "kraj", "email", "dataUrodzenia"]
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })

    // Section 2: Validate participation - at least one must be selected
    const hasParticipation = formData.konwencja || formData.chor || formData.seminarium
    if (!hasParticipation) {
      newErrors.uczestnictwo = "Wybierz co najmniej jedna forme uczestnictwa"
    }

    // Section 3: Validate convention days - at least one must be selected
    const hasConventionDay =
      formData.dzien6 || formData.dzien7 || formData.dzien8 || formData.dzien9 || formData.dzien10 || formData.dzien11
    if (!hasConventionDay) {
      newErrors.dniKonwencji = "Wybierz co najmniej jeden dzien konwencji"
    }

    // Section 4: Validate accommodation - conditional logic
    // If rezygnacjaNoclegi is NOT checked, at least one night must be selected
    if (!formData.rezygnacjaNoclegi) {
      const hasAccommodationNight =
        formData.noc6_7 ||
        formData.noc7_8 ||
        formData.noc8_9 ||
        formData.noc9_10 ||
        formData.noc10_11 ||
        formData.noc11_12
      if (!hasAccommodationNight) {
        newErrors.zakwaterowanie = "Wybierz co najmniej jedna noc lub zaznacz rezygnacje z noclegow"
      }
    }
    // If rezygnacjaNoclegi IS checked, no validation needed for nights

    // Section 5: Validate meals - REQUIRED, must select one option
    if (!formData.posilki) {
      newErrors.posilki = "Wybierz opcje wyzywienia"
    }

    return newErrors
  }

  const isFormValid = useMemo(() => {
    const formErrors = validateForm()
    return Object.keys(formErrors).length === 0
  }, [
    formData.imie,
    formData.nazwisko,
    formData.kraj,
    formData.email,
    formData.dataUrodzenia,
    formData.konwencja,
    formData.chor,
    formData.seminarium,
    formData.dzien6,
    formData.dzien7,
    formData.dzien8,
    formData.dzien9,
    formData.dzien10,
    formData.dzien11,
    formData.noc6_7,
    formData.noc7_8,
    formData.noc8_9,
    formData.noc9_10,
    formData.noc10_11,
    formData.noc11_12,
    formData.rezygnacjaNoclegi,
    formData.posilki,
  ])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
    // Clear posilki error when user selects an option
    if (field === "posilki" && value) {
      setErrors((prev) => ({ ...prev, posilki: null }))
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field])
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleCheckboxChange = (field, checked) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: checked }

      // If rezygnacjaNoclegi is checked, clear all accommodation nights
      if (field === "rezygnacjaNoclegi" && checked) {
        newData.noc6_7 = false
        newData.noc7_8 = false
        newData.noc8_9 = false
        newData.noc9_10 = false
        newData.noc10_11 = false
        newData.noc11_12 = false
      }

      return newData
    })

    // Clear section errors when user interacts
    if (["konwencja", "chor", "seminarium"].includes(field)) {
      setErrors((prev) => ({ ...prev, uczestnictwo: null }))
    }
    if (["dzien6", "dzien7", "dzien8", "dzien9", "dzien10", "dzien11"].includes(field)) {
      setErrors((prev) => ({ ...prev, dniKonwencji: null }))
    }
    if (["noc6_7", "noc7_8", "noc8_9", "noc9_10", "noc10_11", "noc11_12", "rezygnacjaNoclegi"].includes(field)) {
      setErrors((prev) => ({ ...prev, zakwaterowanie: null }))
    }
  }

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allTouched = {
      imie: true,
      nazwisko: true,
      kraj: true,
      email: true,
      dataUrodzenia: true,
      uczestnictwo: true,
      dniKonwencji: true,
      zakwaterowanie: true,
      posilki: true,
    }
    setTouched(allTouched)

    const newErrors = validateForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log("Form submitted:", formData)
    alert("Dane zostaly zapisane pomyslnie!")
    setIsSubmitting(false)
  }

  const handleCancel = () => {
    console.log("Form cancelled")
  }

  const dniKonwencji = [
    { id: "dzien6", label: "6 sierpnia", sublabel: "wtorek" },
    { id: "dzien7", label: "7 sierpnia", sublabel: "sroda" },
    { id: "dzien8", label: "8 sierpnia", sublabel: "czwartek" },
    { id: "dzien9", label: "9 sierpnia", sublabel: "piatek" },
    { id: "dzien10", label: "10 sierpnia", sublabel: "sobota" },
    { id: "dzien11", label: "11 sierpnia", sublabel: "niedziela" },
  ]

  const noceZakwaterowania = [
    { id: "noc6_7", label: "06.08 / 07.08", sublabel: "wt/sr" },
    { id: "noc7_8", label: "07.08 / 08.08", sublabel: "sr/czw" },
    { id: "noc8_9", label: "08.08 / 09.08", sublabel: "czw/pt" },
    { id: "noc9_10", label: "09.08 / 10.08", sublabel: "pt/sob" },
    { id: "noc10_11", label: "10.08 / 11.08", sublabel: "sob/nie" },
    { id: "noc11_12", label: "11.08 / 12.08", sublabel: "nie/pon" },
  ]

  // Check if accommodation nights are disabled
  const accommodationDisabled = formData.rezygnacjaNoclegi

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
            <p className="text-sm text-muted-foreground mt-1">Wypelnij formularz rejestracyjny</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* SECTION 1: Dane Podstawowe */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Dane Podstawowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="imie" className="text-sm font-medium">
                  Imie <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="imie"
                  placeholder="Wprowadz imie"
                  value={formData.imie}
                  onChange={(e) => handleInputChange("imie", e.target.value)}
                  onBlur={() => handleBlur("imie")}
                  className={errors.imie && touched.imie ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.imie && touched.imie && (
                  <div className="flex items-center gap-2 text-destructive mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.imie}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nazwisko" className="text-sm font-medium">
                  Nazwisko <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nazwisko"
                  placeholder="Wprowadz nazwisko"
                  value={formData.nazwisko}
                  onChange={(e) => handleInputChange("nazwisko", e.target.value)}
                  onBlur={() => handleBlur("nazwisko")}
                  className={
                    errors.nazwisko && touched.nazwisko ? "border-destructive focus-visible:ring-destructive" : ""
                  }
                />
                {errors.nazwisko && touched.nazwisko && (
                  <div className="flex items-center gap-2 text-destructive mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.nazwisko}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kraj" className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  Kraj <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kraj"
                  placeholder="Wprowadz kraj"
                  value={formData.kraj}
                  onChange={(e) => handleInputChange("kraj", e.target.value)}
                  onBlur={() => handleBlur("kraj")}
                  className={errors.kraj && touched.kraj ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.kraj && touched.kraj && (
                  <div className="flex items-center gap-2 text-destructive mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.kraj}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="przyklad@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={errors.email && touched.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && touched.email && (
                  <div className="flex items-center gap-2 text-destructive mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataUrodzenia" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Data urodzenia <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dataUrodzenia"
                  type="date"
                  value={formData.dataUrodzenia}
                  onChange={(e) => handleInputChange("dataUrodzenia", e.target.value)}
                  onBlur={() => handleBlur("dataUrodzenia")}
                  className={
                    errors.dataUrodzenia && touched.dataUrodzenia
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.dataUrodzenia && touched.dataUrodzenia && (
                  <div className="flex items-center gap-2 text-destructive mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.dataUrodzenia}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Uczestnictwo */}
        <Card className={errors.uczestnictwo && touched.uczestnictwo ? "border-destructive" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Uczestnictwo - Rodzaj wydarzenia <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {[
                { id: "konwencja", label: "Konwencja" },
                { id: "chor", label: "Chor" },
                { id: "seminarium", label: "Seminarium" },
              ].map((item) => (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-lg border cursor-pointer transition-colors ${
                    formData[item.id] ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={formData[item.id]}
                    onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
            {errors.uczestnictwo && touched.uczestnictwo && (
              <div className="flex items-center gap-2 text-destructive mt-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.uczestnictwo}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: Dni konwencji */}
        <Card className={errors.dniKonwencji && touched.dniKonwencji ? "border-destructive" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Udzial w konwencji w dniach <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dniKonwencji.map((day) => (
                <label
                  key={day.id}
                  htmlFor={day.id}
                  className={`flex flex-col items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData[day.id] ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    id={day.id}
                    checked={formData[day.id]}
                    onCheckedChange={(checked) => handleCheckboxChange(day.id, checked)}
                  />
                  <div className="text-center">
                    <div className="text-sm font-medium">{day.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{day.sublabel}</div>
                  </div>
                </label>
              ))}
            </div>
            {errors.dniKonwencji && touched.dniKonwencji && (
              <div className="flex items-center gap-2 text-destructive mt-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.dniKonwencji}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 4: Zakwaterowanie */}
        <Card className={errors.zakwaterowanie && touched.zakwaterowanie ? "border-destructive" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bed className="w-4 h-4 text-primary" />
              Zakwaterowanie podczas konwencji <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {noceZakwaterowania.map((night) => (
                <label
                  key={night.id}
                  htmlFor={night.id}
                  className={`flex flex-col items-center gap-3 p-4 rounded-lg border transition-colors ${
                    accommodationDisabled
                      ? "cursor-not-allowed opacity-50 bg-muted"
                      : formData[night.id]
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border bg-background hover:bg-muted/50 cursor-pointer"
                  }`}
                >
                  <Checkbox
                    id={night.id}
                    checked={formData[night.id]}
                    onCheckedChange={(checked) => handleCheckboxChange(night.id, checked)}
                    disabled={accommodationDisabled}
                  />
                  <div className="text-center">
                    <div className="text-sm font-medium">{night.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{night.sublabel}</div>
                  </div>
                </label>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="rodzajNoclegu" className="text-sm font-medium">
                  Rodzaj noclegu
                </Label>
                <Input
                  id="rodzajNoclegu"
                  placeholder="Np. pokoj 2-osobowy"
                  value={formData.rodzajNoclegu}
                  onChange={(e) => handleInputChange("rodzajNoclegu", e.target.value)}
                  disabled={accommodationDisabled}
                  className={accommodationDisabled ? "opacity-50" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wspolokatorzy" className="text-sm font-medium">
                  Wspollokatorzy
                </Label>
                <Input
                  id="wspolokatorzy"
                  placeholder="Imiona wspollokatorow"
                  value={formData.wspolokatorzy}
                  onChange={(e) => handleInputChange("wspolokatorzy", e.target.value)}
                  disabled={accommodationDisabled}
                  className={accommodationDisabled ? "opacity-50" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="przypisanyPokoj" className="text-sm font-medium">
                  Przypisany pokoj
                </Label>
                <Input
                  id="przypisanyPokoj"
                  placeholder="Numer pokoju"
                  value={formData.przypisanyPokoj}
                  onChange={(e) => handleInputChange("przypisanyPokoj", e.target.value)}
                  disabled={accommodationDisabled}
                  className={accommodationDisabled ? "opacity-50" : ""}
                />
              </div>
            </div>

            <label
              htmlFor="rezygnacjaNoclegi"
              className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
            >
              <Checkbox
                id="rezygnacjaNoclegi"
                checked={formData.rezygnacjaNoclegi}
                onCheckedChange={(checked) => handleCheckboxChange("rezygnacjaNoclegi", checked)}
              />
              <span className="text-sm font-medium text-destructive">Rezygnuje z noclegow podczas konwencji</span>
            </label>

            {errors.zakwaterowanie && touched.zakwaterowanie && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.zakwaterowanie}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 5: Posilki - REQUIRED */}
        <Card className={errors.posilki && touched.posilki ? "border-destructive" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              Posilki w czasie konwencji <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.posilki}
              onValueChange={(value) => handleInputChange("posilki", value)}
              className="space-y-4"
            >
              {[
                {
                  value: "pelny",
                  label: "Pelen pakiet",
                  description: "nocleg oraz wyzywienie (sniadanie, obiad, kolacja)",
                },
                { value: "obiad-kolacja", label: "Obiad oraz kolacja", description: "dotyczy wlasnego zakwaterowania" },
                { value: "obiad", label: "Tylko obiad", description: "dotyczy wlasnego zakwaterowania" },
              ].map((option) => (
                <label
                  key={option.value}
                  htmlFor={option.value}
                  className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.posilki === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div>
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
            {errors.posilki && touched.posilki && (
              <div className="flex items-center gap-2 text-destructive mt-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{errors.posilki}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 6: Informacje dodatkowe */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Informacje dodatkowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: "wegetarianskie", label: "Zamawiam posilki wegetarianskie" },
              {
                id: "ulatwiony",
                label: "Potrzebuje ulatwionego dostepu do pokoju - mam ograniczenia w swobodnym poruszaniu sie",
              },
              { id: "dodatkowyObiad", label: "Zamawiam dodatkowy posilek (obiad) 11.08 niedziela" },
              {
                id: "dodatkowaKolacja",
                label: "Zamawiam dodatkowy posilek (kolacje) 11.08 niedziela po zakonczeniu konwencji",
              },
            ].map((item) => (
              <label
                key={item.id}
                htmlFor={item.id}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData[item.id] ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  id={item.id}
                  checked={formData[item.id]}
                  onCheckedChange={(checked) => handleCheckboxChange(item.id, checked)}
                  className="shrink-0"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}

            {/* Special diet section */}
            <div className="space-y-4">
              <label
                htmlFor="innaDieta"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.innaDieta ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  id="innaDieta"
                  checked={formData.innaDieta}
                  onCheckedChange={(checked) => handleCheckboxChange("innaDieta", checked)}
                />
                <span className="text-sm">Inna dieta (informacja w uwagach ponizej)</span>
              </label>

              {formData.innaDieta && (
                <div className="pl-4">
                  <Textarea
                    placeholder="Opisz swoje wymagania dietetyczne..."
                    value={formData.innaDietaUwagi}
                    onChange={(e) => handleInputChange("innaDietaUwagi", e.target.value)}
                    className="min-h-24"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t px-6 py-5 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Pola wymagane
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Anuluj
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
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
    </div>
  )
}
