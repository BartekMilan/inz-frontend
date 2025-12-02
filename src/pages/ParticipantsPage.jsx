"use client"

import { useState } from "react"
import { Search, MoreVertical, Plus, FileText, Edit, Mail, Trash2, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// Mock data - Polish participants
const initialParticipants = [
  {
    id: 1,
    firstName: "Leszek",
    lastName: "Szarkowicz",
    email: "leszek.szarkowicz@example.pl",
    eventType: "choir",
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 2,
    firstName: "Dorota",
    lastName: "Szarkowicz",
    email: "dorota.szarkowicz@example.pl",
    eventType: "seminar",
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 3,
    firstName: "Stanisław",
    lastName: "Sławiński",
    email: "stanley.slawinski@example.pl",
    eventType: "convention",
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 4,
    firstName: "Sławomir",
    lastName: "Stasziński",
    email: "slawomir.staszinski@example.pl",
    eventType: "choir",
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 5,
    firstName: "Krzysztof",
    lastName: "Nawrot",
    email: "krzysztof.nawrot@example.pl",
    eventType: "seminar",
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 6,
    firstName: "Mati",
    lastName: "Zabój",
    email: "matthew.zaboj@example.pl",
    eventType: "convention",
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
  {
    id: 7,
    firstName: "Miriam",
    lastName: "Szarkowicz",
    email: "miriam.sz@example.pl",
    eventType: "choir",
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 8,
    firstName: "Kesja",
    lastName: "Szarkowicz",
    email: "kellie.szarkowicz@example.pl",
    eventType: "seminar",
    paymentStatus: "Oczekuje",
    documentStatus: "-",
  },
  {
    id: 9,
    firstName: "Daniel",
    lastName: "Szarkowicz",
    email: "danek.szarkowicz@example.pl",
    eventType: "convention",
    paymentStatus: "Opłacone",
    documentStatus: "Gotowy",
  },
  {
    id: 10,
    firstName: "Franciszek",
    lastName: "Olejarz",
    email: "francesco@example.pl",
    eventType: "choir",
    paymentStatus: "Nieopłacone",
    documentStatus: "-",
  },
]

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState(initialParticipants)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("Wszystkie")
  const [selectedRows, setSelectedRows] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState(null)

  // <CHANGE> Unified state for document generation
  const [generationTargetIds, setGenerationTargetIds] = useState([])
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState({
    identyfikator: false,
    koperta: false,
    rachunek: false,
  })

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    eventType: "choir",
    paymentStatus: "Oczekuje",
  })

  const { toast } = useToast()

  // Filter participants based on search and event type
  const filteredParticipants = participants.filter((participant) => {
    const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEventType = eventTypeFilter === "Wszystkie" || participant.eventType === eventTypeFilter

    return matchesSearch && matchesEventType
  })

  // Toggle row selection
  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]))
  }

  // Toggle all rows selection
  const toggleAllRows = () => {
    if (selectedRows.length === filteredParticipants.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredParticipants.map((p) => p.id))
    }
  }

  // Toggle payment status
  const togglePaymentStatus = (id) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const statuses = ["Opłacone", "Nieopłacone", "Oczekuje"]
          const currentIndex = statuses.indexOf(p.paymentStatus)
          const nextIndex = (currentIndex + 1) % statuses.length
          return { ...p, paymentStatus: statuses[nextIndex] }
        }
        return p
      }),
    )
    toast({
      title: "Status płatności zaktualizowany",
      description: "Zmiany zostały zapisane",
    })
  }

  // <CHANGE> Open generation dialog for bulk action (selected rows)
  const openGenerateDialogForBulk = () => {
    if (selectedRows.length === 0) return
    setGenerationTargetIds([...selectedRows])
    setSelectedDocumentTypes({
      identyfikator: false,
      koperta: false,
      rachunek: false,
    })
  }

  // <CHANGE> Open generation dialog for single participant
  const openGenerateDialogForSingle = (participantId) => {
    setGenerationTargetIds([participantId])
    setSelectedDocumentTypes({
      identyfikator: false,
      koperta: false,
      rachunek: false,
    })
  }

  // <CHANGE> Toggle document type selection
  const toggleDocumentType = (type) => {
    setSelectedDocumentTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  // <CHANGE> Check if any document type is selected
  const hasSelectedDocumentTypes = Object.values(selectedDocumentTypes).some((value) => value)

  // <CHANGE> Handle final confirmation from the dialog
  const confirmGeneration = () => {
    const count = generationTargetIds.length

    // Get selected document type labels
    const documentTypeLabels = {
      identyfikator: "Identyfikatory",
      koperta: "Koperty",
      rachunek: "Rachunki",
    }

    const selectedTypes = Object.keys(selectedDocumentTypes)
      .filter((key) => selectedDocumentTypes[key])
      .map((key) => documentTypeLabels[key])
      .join(", ")

    // Close the dialog
    setGenerationTargetIds([])

    // Show toast notification
    toast({
      title: `Zlecono generowanie (${selectedTypes}) dla ${count} os.`,
      description: count > 20 ? "Proces odbędzie się w tle" : "Pliki zostaną pobrane bezpośrednio",
    })

    // Simulate the generation process (in real app, this would be an API call)
    setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => (generationTargetIds.includes(p.id) ? { ...p, documentStatus: "Gotowy" } : p))
      )
      setSelectedRows([])
      toast({
        title: "Dokumenty wygenerowane!",
        description: `${count} dokumentów zostało utworzonych`,
      })
    }, 2000)
  }

  // Open add modal
  const openAddModal = () => {
    setEditingParticipant(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      eventType: "choir",
      paymentStatus: "Oczekuje",
    })
    setIsAddModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (participant) => {
    setEditingParticipant(participant)
    setFormData({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      eventType: participant.eventType,
      paymentStatus: participant.paymentStatus,
    })
    setIsAddModalOpen(true)
  }

  // Save participant
  const saveParticipant = () => {
    if (editingParticipant) {
      // Update existing participant
      setParticipants((prev) => prev.map((p) => (p.id === editingParticipant.id ? { ...p, ...formData } : p)))
      toast({
        title: "Uczestnik zaktualizowany",
        description: "Zmiany zostały zapisane",
      })
    } else {
      // Add new participant
      const newParticipant = {
        id: Math.max(...participants.map((p) => p.id)) + 1,
        ...formData,
        documentStatus: "-",
      }
      setParticipants((prev) => [...prev, newParticipant])
      toast({
        title: "Uczestnik dodany",
        description: "Nowy uczestnik został dodany do listy",
      })
    }
    setIsAddModalOpen(false)
  }

  // Delete participant
  const deleteParticipant = (id) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id))
    toast({
      title: "Uczestnik usunięty",
      description: "Uczestnik został usunięty z listy",
      variant: "destructive",
    })
  }

  // Send email
  const sendEmail = (participant) => {
    toast({
      title: "Wysyłanie email...",
      description: `Email do ${participant.email}`,
    })
  }

  // Get payment status badge
  const getPaymentBadge = (status) => {
    const variants = {
      Opłacone: {
        variant: "default",
        className: "bg-green-500 hover:bg-green-600 text-white",
        icon: CheckCircle2,
      },
      Nieopłacone: {
        variant: "destructive",
        className: "bg-red-500 hover:bg-red-600 text-white",
        icon: XCircle,
      },
      Oczekuje: {
        variant: "secondary",
        className: "bg-gray-500 hover:bg-gray-600 text-white",
        icon: Clock,
      },
    }
    const config = variants[status]
    const Icon = config.icon
    return (
      <Badge className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel Uczestników</h1>
          <p className="text-muted-foreground">Zarządzaj uczestnikami i generuj dokumenty</p>
        </div>

        {/* Top Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj uczestnika..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Middle: Filter */}
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Typ wydarzenia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Wszystkie">Wszystkie</SelectItem>
              <SelectItem value="choir">Chór</SelectItem>
              <SelectItem value="seminar">Seminarium</SelectItem>
              <SelectItem value="convention">Konwencja</SelectItem>
            </SelectContent>
          </Select>

          {/* Right: Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openGenerateDialogForBulk} disabled={selectedRows.length === 0}>
              <FileText className="mr-2 h-4 w-4" />
              Generuj zaznaczone ({selectedRows.length})
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Uczestnika
            </Button>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === filteredParticipants.length && filteredParticipants.length > 0}
                    onCheckedChange={toggleAllRows}
                  />
                </TableHead>
                <TableHead>Imię i Nazwisko</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Typ Wydarzenia</TableHead>
                <TableHead>Status Płatności</TableHead>
                <TableHead>Status Dokumentu</TableHead>
                <TableHead className="w-12">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <p className="text-muted-foreground">Nie znaleziono uczestników</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(participant.id)}
                        onCheckedChange={() => toggleRowSelection(participant.id)}
                      />
                    </TableCell>
                    <TableCell className="font-bold">
                      {participant.firstName} {participant.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{participant.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {participant.eventType === "choir" && "Chór"}
                        {participant.eventType === "seminar" && "Seminarium"}
                        {participant.eventType === "convention" && "Konwencja"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => togglePaymentStatus(participant.id)} className="cursor-pointer">
                        {getPaymentBadge(participant.paymentStatus)}
                      </button>
                    </TableCell>
                    <TableCell>
                      {participant.documentStatus === "Gotowy" ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Gotowy
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(participant)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edytuj dane
                          </DropdownMenuItem>
                          {/* <CHANGE> Updated single-row document generation */}
                          <DropdownMenuItem
                            onClick={() => openGenerateDialogForSingle(participant.id)}
                            className="font-semibold"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Generuj dokumenty
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendEmail(participant)}>
                            <Mail className="mr-2 h-4 w-4" />
                            Wyślij email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteParticipant(participant.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Wyświetlono {filteredParticipants.length} z {participants.length} uczestników
        </div>
      </div>

      {/* Add/Edit Participant Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingParticipant ? "Edytuj Uczestnika" : "Dodaj Uczestnika"}</DialogTitle>
            <DialogDescription>
              {editingParticipant ? "Zaktualizuj dane uczestnika" : "Wprowadź dane nowego uczestnika"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Imię</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nazwisko</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Kowalski"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jan.kowalski@example.pl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventType">Typ Wydarzenia</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value })}
              >
                <SelectTrigger id="eventType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="choir">Chór</SelectItem>
                  <SelectItem value="seminar">Seminarium</SelectItem>
                  <SelectItem value="convention">Konwencja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Status Płatności</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Opłacone">Opłacone</SelectItem>
                  <SelectItem value="Nieopłacone">Nieopłacone</SelectItem>
                  <SelectItem value="Oczekuje">Oczekuje</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={saveParticipant}>{editingParticipant ? "Zapisz zmiany" : "Dodaj uczestnika"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <CHANGE> Unified Document Generation Dialog with Multi-Select Checkboxes */}
      <Dialog open={generationTargetIds.length > 0} onOpenChange={() => setGenerationTargetIds([])}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            {/* <CHANGE> Dynamic header based on count */}
            <DialogTitle>
              {generationTargetIds.length === 1
                ? "Generowanie dokumentów dla 1 uczestnika"
                : `Generowanie dokumentów dla ${generationTargetIds.length} uczestników`}
            </DialogTitle>
            <DialogDescription>Wybierz typy dokumentów i potwierdź operację</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* <CHANGE> Section 1: Document Type Selection with Checkboxes */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Typy dokumentów</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doc-identyfikator"
                    checked={selectedDocumentTypes.identyfikator}
                    onCheckedChange={() => toggleDocumentType("identyfikator")}
                  />
                  <Label htmlFor="doc-identyfikator" className="cursor-pointer font-normal">
                    Identyfikatory
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doc-koperta"
                    checked={selectedDocumentTypes.koperta}
                    onCheckedChange={() => toggleDocumentType("koperta")}
                  />
                  <Label htmlFor="doc-koperta" className="cursor-pointer font-normal">
                    Koperty
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doc-rachunek"
                    checked={selectedDocumentTypes.rachunek}
                    onCheckedChange={() => toggleDocumentType("rachunek")}
                  />
                  <Label htmlFor="doc-rachunek" className="cursor-pointer font-normal">
                    Rachunki
                  </Label>
                </div>
              </div>
            </div>

            {/* <CHANGE> Section 2: Summary & Safety Warning (Rule PF-W.4) */}
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium">
                  Wybrano uczestników: <span className="font-bold">{generationTargetIds.length}</span>
                </p>
              </div>

              {/* <CHANGE> Conditional rendering based on count */}
              {generationTargetIds.length <= 20 ? (
                <p className="text-sm text-muted-foreground">Pliki zostaną pobrane bezpośrednio.</p>
              ) : (
                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    Wybrano dużą liczbę uczestników ({generationTargetIds.length}). Proces odbędzie się w tle.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerationTargetIds([])}>
              Anuluj
            </Button>
            {/* <CHANGE> Validation: Disable if no document type selected */}
            <Button onClick={confirmGeneration} disabled={!hasSelectedDocumentTypes}>
              Zleć generowanie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}