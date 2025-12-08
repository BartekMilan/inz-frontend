"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, FileText, Search, Pencil, Plus, X } from "lucide-react"

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

// Mock document templates
const DOCUMENT_TEMPLATES = [
  { id: "identifier", label: "Identyfikator" },
  { id: "certificate", label: "Certyfikat" },
  { id: "lunch-coupon", label: "Kupon na lunch" },
]

const useNavigation = () => {
  const navigate = (path) => {
    // In a real react-router-dom app, use: navigate(path)
    // For demo/preview, we log and show alert
    console.log("Navigate to:", path)
    alert(`Navigation to: ${path}`)
  }
  return navigate
}

export default function DynamicParticipantsTable({ config, data }) {
  const navigate = useNavigation()
  const [sorting, setSorting] = useState([])
  const [activeFilters, setActiveFilters] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [showFloatingHeader, setShowFloatingHeader] = useState(false)

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

    // Actions column - empty header, pencil icon only
    const actionsColumn = {
      id: "actions",
      header: () => null,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/participants/edit/${row.original.id}`)
            }}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit participant</span>
          </Button>
        </div>
      ),
      enableSorting: false,
    }

    return [selectColumn, ...dynamicColumns, actionsColumn]
  }, [config, navigate])

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

  const handleRowDoubleClick = (row) => {
    navigate(`/participants/edit/${row.original.id}`)
  }

  const handleOpenDocModal = () => {
    setSelectedTemplates([])
    setIsDocModalOpen(true)
  }

  const handleTemplateToggle = (templateId) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const handleGenerateDocuments = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const participantIds = selectedRows.map((r) => r.original.id)
    console.log("Selected templates:", selectedTemplates)
    console.log("Selected participant IDs:", participantIds)
    setIsDocModalOpen(false)
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
            <div className="flex gap-2">
              <Button onClick={handleOpenDocModal} disabled={selectedRowsCount === 0} className="gap-2">
                <FileText className="h-4 w-4" />
                Generuj Dokumenty
                {selectedRowsCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                    {selectedRowsCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={handleAddParticipant} className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Participant
              </Button>
            </div>
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
            <div className="flex gap-2">
              <Button onClick={handleOpenDocModal} disabled={selectedRowsCount === 0} className="gap-2">
                <FileText className="h-4 w-4" />
                Generuj Dokumenty
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

      {/* Document Generation Modal */}
      <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generuj Dokumenty</DialogTitle>
            <DialogDescription>
              Generating documents for {selectedRowsCount} selected participant{selectedRowsCount !== 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm font-medium">Select document templates:</p>
            <div className="space-y-3">
              {DOCUMENT_TEMPLATES.map((template) => (
                <div key={template.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={template.id}
                    checked={selectedTemplates.includes(template.id)}
                    onCheckedChange={() => handleTemplateToggle(template.id)}
                  />
                  <label
                    htmlFor={template.id}
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {template.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setIsDocModalOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleGenerateDocuments} disabled={selectedTemplates.length === 0}>
              Generuj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
