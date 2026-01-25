"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, FileText, Search, Pencil, Plus, X, Loader2, FileDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjectTemplates } from "@/hooks/use-project-templates"
import { useGeneratePdf } from "@/hooks/use-generate-pdf"
import { useCreateDocumentTask } from "@/hooks/use-create-document-task"
import { useProject } from "@/contexts/ProjectContext"
import { useToast } from "@/hooks/use-toast"

export default function DynamicParticipantsTable({ config, data, canEditData = true }) {
  const navigate = useNavigate()
  const { selectedProjectId } = useProject()
  const { toast } = useToast()
  const [sorting, setSorting] = useState([])
  const [activeFilters, setActiveFilters] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [showFloatingHeader, setShowFloatingHeader] = useState(false)
  
  // Stan dla modala generowania PDF dla pojedynczego uczestnika
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)
  const [selectedParticipantId, setSelectedParticipantId] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  
  // Stan dla modala zbiorczego generowania dokumentów
  const [bulkTemplateId, setBulkTemplateId] = useState("")
  const [bulkDriveFolderId, setBulkDriveFolderId] = useState("")
  
  // Hooki do pobierania szablonów i generowania PDF
  const { 
    data: templatesData, 
    isLoading: templatesLoading, 
    error: templatesError 
  } = useProjectTemplates()
  const generatePdfMutation = useGeneratePdf()
  const createDocumentTaskMutation = useCreateDocumentTask()
  
  const templates = templatesData || []

  // Generate columns dynamically from config
  const columns = useMemo(() => {
    if (!config || config.length === 0) return []

    const dynamicColumns = config.map((col) => ({
      accessorKey: col.key,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-muted/50 -ml-4"
        >
          {col.label}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="py-1">{row.getValue(col.key) || <span className="text-muted-foreground">—</span>}</div>
      ),
    }))

    // Selection column
    const selectColumn = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
    }

    // Actions column - empty header, pencil icon and PDF generation button
    const actionsColumn = {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <div className="text-right flex items-center justify-end gap-1">
          {canEditData && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedParticipantId(row.original.id)
                  setIsPdfModalOpen(true)
                }}
                title="Generuj PDF"
              >
                <FileDown className="h-4 w-4" />
                <span className="sr-only">Generuj PDF</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/participants/edit/${row.original.id}`)
                }}
                title="Edytuj uczestnika"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit participant</span>
              </Button>
            </>
          )}
        </div>
      ),
      enableSorting: false,
    }

    return [selectColumn, ...dynamicColumns, actionsColumn]
  }, [config, navigate, canEditData])

  // Custom filter function that checks all active filters (AND logic)
  const customFilterFn = useCallback((row, columnId, filterValue) => {
    // filterValue contains { activeFilters, inputValue }
    const { activeFilters: filters, inputValue: currentInput } = filterValue || { activeFilters: [], inputValue: "" }
    
    // Combine active filters with current input value (if any)
    const allFilters = currentInput.trim()
      ? [...filters, currentInput.trim()]
      : filters

    if (allFilters.length === 0) return true

    // Get all cell values from the row as strings
    const rowValues = Object.values(row.original)
      .map((val) => (val != null ? String(val).toLowerCase() : ""))

    // Check if ALL filters match (AND logic)
    return allFilters.every((filter) => {
      const filterLower = filter.toLowerCase()
      return rowValues.some((value) => value.includes(filterLower))
    })
  }, [])

  // Combine activeFilters and inputValue for globalFilter
  const globalFilterValue = useMemo(
    () => ({ activeFilters, inputValue }),
    [activeFilters, inputValue]
  )

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: customFilterFn,
    state: {
      sorting,
      rowSelection,
      globalFilter: globalFilterValue,
    },
  })

  const selectedRowsCount = Object.keys(rowSelection).length
  const selectedParticipantIds = useMemo(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    return selectedRows.map((r) => r.original.id)
  }, [rowSelection])

  const handleRowDoubleClick = (row) => {
    if (canEditData) {
      navigate(`/participants/edit/${row.original.id}`)
    }
  }

  const handleOpenBulkModal = () => {
    setBulkTemplateId("")
    setBulkDriveFolderId("")
    setIsDocModalOpen(true)
  }

  const handleScheduleBulkGeneration = () => {
    if (!selectedProjectId || !bulkTemplateId || selectedParticipantIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Wypełnij wszystkie wymagane pola.',
      })
      return
    }

    createDocumentTaskMutation.mutate(
      {
        projectId: selectedProjectId,
        templateId: bulkTemplateId,
        participantIds: selectedParticipantIds,
        outputDriveFolderId: bulkDriveFolderId || undefined,
      },
      {
        onSuccess: () => {
          setIsDocModalOpen(false)
          setRowSelection({}) // Wyczyść zaznaczenie
          setBulkTemplateId("")
          setBulkDriveFolderId("")
        },
      }
    )
  }

  const handleAddParticipant = () => {
    navigate("/participants/new")
  }

  const handleAddFilter = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !activeFilters.includes(trimmedValue)) {
      setActiveFilters([...activeFilters, trimmedValue])
      setInputValue("")
    }
  }

  const handleRemoveFilter = (filterToRemove) => {
    setActiveFilters(activeFilters.filter((f) => f !== filterToRemove))
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddFilter()
    }
  }

  // Handle scroll to show/hide floating header
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowFloatingHeader(scrollY > 150)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Loading skeleton
  if (!config || !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Floating toolbar - slides down when scrolling */}
      <div
        className={`fixed top-0 left-0 right-0 w-full z-50 bg-background shadow-md transition-transform duration-300 m-0 ${
          showFloatingHeader ? "translate-y-0" : "-translate-y-[110%]"
        }`}
        style={{ willChange: 'transform', margin: 0 }}
      >
        <div className="w-full px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-7xl mx-auto">
            {/* Search */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Szukaj we wszystkich kolumnach..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="pl-10 pr-10"
                />
                {inputValue.trim() && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={handleAddFilter}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Active Filters Badges */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="secondary"
                      className="flex items-center gap-1.5 pr-1"
                    >
                      <span>{filter}</span>
                      <button
                        onClick={() => handleRemoveFilter(filter)}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                        aria-label={`Usuń filtr ${filter}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {canEditData && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleOpenBulkModal} 
                  disabled={selectedRowsCount < 2} 
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Generuj zbiorczo
                  {selectedRowsCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                      {selectedRowsCount}
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={handleAddParticipant} className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Dodaj uczestnika
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="pb-4">
          {/* Fixed height container to prevent layout shift */}
          <div className="flex items-center justify-between min-h-[28px]">
            {selectedRowsCount > 0 ? (
              <span className="text-sm text-muted-foreground">
                Wybrano {selectedRowsCount} z {table.getFilteredRowModel().rows.length} wierszy
              </span>
            ) : (
              <CardTitle className="text-xl font-semibold">Uczestnicy</CardTitle>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Szukaj we wszystkich kolumnach..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="pl-10 pr-10"
                />
                {inputValue.trim() && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={handleAddFilter}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Active Filters Badges */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="secondary"
                      className="flex items-center gap-1.5 pr-1"
                    >
                      <span>{filter}</span>
                      <button
                        onClick={() => handleRemoveFilter(filter)}
                        className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                        aria-label={`Usuń filtr ${filter}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {canEditData && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleOpenBulkModal} 
                  disabled={selectedRowsCount < 2} 
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Generuj zbiorczo
                  {selectedRowsCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                      {selectedRowsCount}
                    </span>
                  )}
                </Button>
                <Button variant="outline" onClick={handleAddParticipant} className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Dodaj uczestnika
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table className="w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/50">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-semibold">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onDoubleClick={() => handleRowDoubleClick(row)}
                      className={`
                        cursor-pointer transition-colors
                        ${index % 2 === 1 ? "bg-muted/30" : ""}
                        hover:bg-accent/50
                        data-[state=selected]:bg-accent
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Brak wyników.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer info */}
          <div className="text-sm text-muted-foreground">
            Wyświetlono {table.getFilteredRowModel().rows.length} z {data.length} uczestników
          </div>
        </CardContent>
      </Card>

      {/* Bulk Document Generation Modal */}
      <Dialog 
        open={isDocModalOpen} 
        onOpenChange={(open) => {
          setIsDocModalOpen(open)
          if (!open) {
            setBulkTemplateId("")
            setBulkDriveFolderId("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zaplanuj generowanie dokumentów</DialogTitle>
            <DialogDescription>
              Zaplanuj generowanie dokumentów dla {selectedRowsCount} wybran{selectedRowsCount === 1 ? "ego" : "ych"} uczestnik{selectedRowsCount === 1 ? "a" : "ów"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Wybierz szablon dokumentu:</label>
              {templatesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Ładowanie szablonów...</span>
                </div>
              ) : templatesError ? (
                <div className="py-4 text-center space-y-2">
                  <p className="text-sm text-destructive font-medium">
                    Nie udało się załadować szablonów dokumentów.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {templatesError?.message || "Wystąpił nieoczekiwany błąd."}
                  </p>
                </div>
              ) : templates.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Brak skonfigurowanych szablonów. Dodaj je w Ustawieniach.
                </div>
              ) : (
                <Select value={bulkTemplateId} onValueChange={setBulkTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz szablon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Optional Drive Folder ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Folder ID w Google Drive <span className="text-muted-foreground">(opcjonalnie)</span>
              </label>
              <Input
                placeholder="Wprowadź ID folderu..."
                value={bulkDriveFolderId}
                onChange={(e) => setBulkDriveFolderId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Folder musi być udostępniony kontu serwisowemu aplikacji.
              </p>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDocModalOpen(false)
                setBulkTemplateId("")
                setBulkDriveFolderId("")
              }}
              disabled={createDocumentTaskMutation.isPending}
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleScheduleBulkGeneration} 
              disabled={
                !bulkTemplateId || 
                templatesLoading || 
                templates.length === 0 ||
                createDocumentTaskMutation.isPending
              }
            >
              {createDocumentTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Planowanie...
                </>
              ) : (
                'Zaplanuj generowanie'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Generation Modal for Single Participant */}
      <Dialog 
        open={isPdfModalOpen} 
        onOpenChange={(open) => {
          setIsPdfModalOpen(open)
          if (!open) {
            setSelectedParticipantId(null)
            setSelectedTemplateId("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generuj PDF</DialogTitle>
            <DialogDescription>
              Wybierz szablon dokumentu do wygenerowania dla uczestnika.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Ładowanie szablonów...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Brak skonfigurowanych szablonów dla tego projektu.
              </div>
            ) : templates.length === 1 ? (
              // Jeśli jest tylko jeden szablon, nie pokazuj dropdown
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Szablon: <span className="font-medium">{templates[0].name}</span>
                </p>
              </div>
            ) : (
              // Jeśli jest więcej szablonów, pokaż dropdown
              <div className="space-y-2">
                <label className="text-sm font-medium">Wybierz szablon:</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz szablon..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPdfModalOpen(false)
                setSelectedParticipantId(null)
                setSelectedTemplateId("")
              }}
            >
              Anuluj
            </Button>
            <Button 
              onClick={() => {
                if (!selectedProjectId || !selectedParticipantId) {
                  toast({
                    variant: 'destructive',
                    title: 'Błąd',
                    description: 'Brak wymaganych danych.',
                  })
                  return
                }

                // Jeśli jest tylko jeden szablon, użyj go automatycznie
                const templateId = templates.length === 1 
                  ? templates[0].id 
                  : selectedTemplateId

                if (!templateId) {
                  toast({
                    variant: 'destructive',
                    title: 'Błąd',
                    description: 'Wybierz szablon dokumentu.',
                  })
                  return
                }

                generatePdfMutation.mutate(
                  {
                    projectId: selectedProjectId,
                    templateId: templateId,
                    participantId: selectedParticipantId,
                  },
                  {
                    onSuccess: () => {
                      setIsPdfModalOpen(false)
                      setSelectedParticipantId(null)
                      setSelectedTemplateId("")
                    },
                  }
                )
              }}
              disabled={
                templatesLoading || 
                templates.length === 0 || 
                (templates.length > 1 && !selectedTemplateId) ||
                generatePdfMutation.isPending
              }
            >
              {generatePdfMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generowanie...
                </>
              ) : (
                'Generuj'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
