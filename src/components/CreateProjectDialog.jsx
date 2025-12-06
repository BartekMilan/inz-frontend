"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useProject } from "@/contexts/ProjectContext"

function CreateProjectDialog({ open, onOpenChange }) {
  const { createProject, isCreatingProject } = useProject()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Nazwa projektu jest wymagana"
    } else if (formData.name.length > 255) {
      newErrors.name = "Nazwa może mieć maksymalnie 255 znaków"
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Opis może mieć maksymalnie 1000 znaków"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      })
      
      toast({
        title: "Projekt utworzony",
        description: `Projekt "${formData.name}" został pomyślnie utworzony.`,
      })
      
      // Reset form and close dialog
      setFormData({ name: "", description: "" })
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Błąd",
        description: error.response?.data?.message || "Nie udało się utworzyć projektu",
        variant: "destructive",
      })
    }
  }

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      // Reset form when closing
      setFormData({ name: "", description: "" })
      setErrors({})
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Utwórz nowy projekt</DialogTitle>
            <DialogDescription>
              Wprowadź nazwę nowego projektu. Każdy projekt ma własną konfigurację arkusza Google i definicje pól.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nazwa projektu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="np. Konferencja 2025"
                value={formData.name}
                onChange={handleChange}
                disabled={isCreatingProject}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Opis (opcjonalnie)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Krótki opis projektu..."
                value={formData.description}
                onChange={handleChange}
                disabled={isCreatingProject}
                rows={3}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreatingProject}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isCreatingProject}>
              {isCreatingProject && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Utwórz projekt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProjectDialog
