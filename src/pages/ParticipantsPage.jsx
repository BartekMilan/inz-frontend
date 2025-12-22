"use client"

import { useProject } from "@/contexts/ProjectContext"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { useParticipants } from "@/hooks/use-participants"
import DynamicParticipantsTable from "@/components/dashboard/DynamicParticipantsTable"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function ParticipantsPage() {
  const { selectedProjectId } = useProject()
  const { canEditData } = useProjectPermissions()
  const { data, isLoading, error } = useParticipants()

  // Show message if no project is selected
  if (!selectedProjectId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Wybierz projekt, aby wyświetlić listę uczestników.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Wystąpił błąd podczas pobierania danych uczestników: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Extract config and data from API response
  const config = data?.config || []
  const participantsData = data?.data || []

  return (
    <main className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Zarządzania</h1>
          <p className="text-muted-foreground">Zarządzaj uczestnikami wydarzeń</p>
        </div>

        <DynamicParticipantsTable 
          config={config} 
          data={participantsData}
          canEditData={canEditData}
        />
      </div>
    </main>
  )
}
