"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus, FolderKanban } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useProject } from "@/contexts/ProjectContext"
import CreateProjectDialog from "./CreateProjectDialog"

function ProjectSwitcher({ className }) {
  const {
    projects,
    selectedProject,
    selectedProjectId,
    isLoadingProjects,
    switchProject,
    hasProjects,
    userRole,
    isAdmin,
  } = useProject()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleValueChange = (value) => {
    if (value === "create-new") {
      setCreateDialogOpen(true)
    } else {
      switchProject(value)
    }
  }

  // Hide project switcher for registrars (they can only have one assigned project)
  if (!isAdmin) {
    // For registrars, show read-only project name
    if (isLoadingProjects) {
      return (
        <div className={cn("px-3 py-2", className)}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50">
            <div className="w-8 h-8 rounded-md bg-muted animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={cn("px-3 py-2", className)}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-xs text-muted-foreground">Projekt</span>
            <span className="text-sm font-medium truncate w-full text-left">
              {selectedProject?.name || "Brak projektu"}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (isLoadingProjects) {
    return (
      <div className={cn("px-3 py-2", className)}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50">
          <div className="w-8 h-8 rounded-md bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn("px-3 py-2", className)}>
        <Select value={selectedProjectId || ""} onValueChange={handleValueChange}>
          <SelectTrigger 
            className="w-full h-auto px-3 py-2 bg-background/50 border-border/50 hover:bg-background/80 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary flex-shrink-0">
                <FolderKanban className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-xs text-muted-foreground">Projekt</span>
                <span className="text-sm font-medium truncate w-full text-left">
                  {selectedProject?.name || "Wybierz projekt"}
                </span>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="w-[var(--radix-select-trigger-width)]">
            {projects.map((project) => (
              <SelectItem 
                key={project.id} 
                value={project.id}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{project.name}</span>
                  {project.role && (
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {project.role}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
            
            {projects.length > 0 && <Separator className="my-1" />}
            
            <SelectItem 
              value="create-new" 
              className="cursor-pointer text-primary focus:text-primary"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Utwórz nowy projekt</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CreateProjectDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  )
}

export default ProjectSwitcher
