import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, Trash2, RefreshCw, UserCircle2, Check, Loader2, UserPlus, Mail, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { usersApi } from "@/services/users.service"
import { projectsApi } from "@/services/projects.service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useProject } from "@/contexts/ProjectContext"
import { useProjectPermissions } from "@/hooks/use-project-permissions"
import { Role } from "@/lib/roles"

// Etykiety ról dla widoku globalnego (systemowe)
const SYSTEM_ROLE_LABELS = {
  admin: 'Administrator',
  registrar: 'Rejestrator',
}

// Etykiety ról dla widoku projektu
const PROJECT_ROLE_LABELS = {
  owner: 'Manager',
  editor: 'Operator',
  viewer: 'Audytor',
}

const PROJECT_ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
}

export default function UsersPage() {
  const { isAdmin, selectedProjectId, selectedProject } = useProject()
  const { canManageProject, role: projectRole } = useProjectPermissions()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Stan dla dialogów
  const [inviteEmail, setInviteEmail] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("viewer")
  const [memberToDelete, setMemberToDelete] = useState(null)

  // Określ czy pobieramy kontekst projektu
  // Admin zawsze pobiera globalną listę (nawet z wybranym projektem)
  // Non-admin pobiera tylko członków wybranego projektu
  const shouldFetchProjectMembers = selectedProjectId && !isAdmin
  const projectId = shouldFetchProjectMembers ? selectedProjectId : undefined
  
  // Określ tryb widoku UI - Admin zawsze widzi widok globalny, non-admin widzi widok projektu
  const isProjectView = !isAdmin && !!selectedProjectId

  // Fetch users - przekazujemy projectId tylko dla non-admin z wybranym projektem
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', projectId],
    queryFn: () => usersApi.getAllUsers(projectId),
    enabled: isAdmin ? true : !!selectedProjectId, // Admin zawsze może pobrać, non-admin wymaga projectId
  })

  const users = usersData?.users || []

  // Mutacja dodawania członka do projektu
  const addMemberMutation = useMutation({
    mutationFn: (data) => projectsApi.addProjectMember(selectedProjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['projectMembers', selectedProjectId] })
      setIsAddDialogOpen(false)
      setNewMemberEmail("")
      setNewMemberRole("viewer")
      toast({
        title: 'Sukces',
        description: 'Członek został dodany do projektu.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się dodać członka.',
      })
    },
  })

  // Mutacja usuwania członka z projektu
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.removeProjectMember(selectedProjectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['projectMembers', selectedProjectId] })
      setMemberToDelete(null)
      toast({
        title: 'Sukces',
        description: 'Członek został usunięty z projektu.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się usunąć członka.',
      })
    },
  })

  // Update user approval mutation (tylko dla widoku globalnego)
  const updateApprovalMutation = useMutation({
    mutationFn: ({ userId, data }) => usersApi.updateUserApproval(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Zaktualizowano',
        description: 'Status użytkownika został zaktualizowany.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się zaktualizować użytkownika',
      })
    },
  })

  // Delete user mutation (tylko dla widoku globalnego)
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Usunięto',
        description: 'Użytkownik został usunięty.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się usunąć użytkownika',
      })
    },
  })

  // Handlery dla widoku globalnego
  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Proszę wprowadzić prawidłowy adres email',
      })
      return
    }

    // TODO: Implement invite functionality when backend endpoint is available
    toast({
      title: 'Funkcja w przygotowaniu',
      description: 'Funkcja zapraszania użytkowników będzie dostępna wkrótce.',
    })
    setInviteEmail("")
  }

  const handleApprove = (userId) => {
    updateApprovalMutation.mutate({
      userId,
      data: { isApproved: true },
    })
  }

  const handleDelete = (userId) => {
    if (userId === currentUser?.id) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie możesz usunąć własnego konta',
      })
      return
    }

    if (confirm("Czy na pewno chcesz usunąć tego użytkownika?")) {
      deleteUserMutation.mutate(userId)
    }
  }

  // Handlery dla widoku projektu
  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Email jest wymagany.',
      })
      return
    }

    addMemberMutation.mutate({
      email: newMemberEmail.trim(),
      role: newMemberRole,
    })
  }

  const handleRemoveMember = (user) => {
    removeMemberMutation.mutate(user.id)
  }

  // Funkcje pomocnicze
  const getRoleLabel = (role) => {
    if (isProjectView) {
      return PROJECT_ROLE_LABELS[role] || role
    }
    return SYSTEM_ROLE_LABELS[role] || role
  }

  const getRoleBadge = (user) => {
    if (isProjectView) {
      const roleColor = PROJECT_ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'
      return (
        <Badge variant="secondary" className={roleColor}>
          <Shield className="h-3 w-3 mr-1" />
          {getRoleLabel(user.role)}
        </Badge>
      )
    }
    return <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
  }

  // Jeśli brak projektu w widoku projektu
  if (isProjectView && !selectedProjectId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Wybierz projekt, aby wyświetlić zespół.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Jeśli użytkownik nie ma uprawnień w widoku projektu
  if (isProjectView && !canManageProject && projectRole !== 'editor') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nie masz uprawnień do zarządzania zespołem projektu. Tylko Manager i Operator mogą przeglądać zespół.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (usersLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (usersError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Wystąpił błąd podczas pobierania danych: {usersError.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {isProjectView 
            ? `Zespół Projektu ${selectedProject?.name || ''}`
            : 'Użytkownicy Systemu'}
        </h1>
        <p className="text-muted-foreground">
          {isProjectView
            ? `Zarządzaj członkami projektu ${selectedProject?.name || ''}`
            : 'Zaproś członków zespołu do obsługi wydarzenia.'}
        </p>
      </div>

      {/* Invite/Add Section */}
      {isProjectView ? (
        // Widok projektu - przycisk "Dodaj członka"
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Dodaj członka do projektu</CardTitle>
            <CardDescription>Dodaj nowego członka do projektu poprzez jego adres email</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2" disabled={!canManageProject}>
              <UserPlus className="h-4 w-4" />
              Dodaj członka
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Widok globalny - formularz zaproszenia
        <Card className="mb-8 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Zaproś nowego użytkownika</CardTitle>
            <CardDescription>Wyślij zaproszenie e-mail do nowego członka zespołu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="adres@gmail.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="flex-1"
              />
              <Button onClick={handleInvite} className="gap-2">
                <Send className="h-4 w-4" />
                Wyślij zaproszenie
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{isProjectView ? 'Członkowie projektu' : 'Członkowie zespołu'}</CardTitle>
          <CardDescription>
            {isProjectView
              ? 'Lista wszystkich członków projektu wraz z ich rolami'
              : 'Zarządzaj dostępem i rolami użytkowników'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isProjectView
                ? 'Brak członków w projekcie. Dodaj pierwszego członka, aby rozpocząć.'
                : 'Brak użytkowników'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Imię/Nazwisko</TableHead>
                  <TableHead>Rola</TableHead>
                  {!isProjectView && <TableHead>Status</TableHead>}
                  {!isProjectView && <TableHead>Projekt</TableHead>}
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    {/* Email Column */}
                    <TableCell className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </TableCell>

                    {/* Name Column */}
                    <TableCell>
                      {(user.firstName || user.lastName) ? (
                        <span className="text-sm">
                          {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      {getRoleBadge(user)}
                    </TableCell>

                    {/* Status Column (tylko widok globalny) */}
                    {!isProjectView && (
                      <TableCell>
                        {user.role === Role.ADMIN ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Aktywny
                          </Badge>
                        ) : !user.isApproved ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Oczekuje
                          </Badge>
                        ) : !user.assignedProjectId ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            Brak projektu
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Aktywny
                          </Badge>
                        )}
                      </TableCell>
                    )}

                    {/* Project Column (tylko widok globalny) */}
                    {!isProjectView && (
                      <TableCell>
                        {user.assignedProjectName || (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isProjectView ? (
                          // Widok projektu - tylko usuń (jeśli nie owner)
                          user.role !== 'owner' && canManageProject && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMemberToDelete(user)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )
                        ) : (
                          // Widok globalny - zatwierdź i usuń
                          <>
                            {!user.isApproved && user.role !== Role.ADMIN && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(user.id)}
                                disabled={updateApprovalMutation.isPending || !user.assignedProjectId}
                                className="gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Zatwierdź
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.id === currentUser?.id || deleteUserMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog dodawania członka do projektu */}
      {isProjectView && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj członka do projektu</DialogTitle>
              <DialogDescription>
                Dodaj nowego członka do projektu poprzez jego adres email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="uzytkownik@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  disabled={addMemberMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rola</Label>
                <Select
                  value={newMemberRole}
                  onValueChange={setNewMemberRole}
                  disabled={addMemberMutation.isPending}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Audytor (viewer)</SelectItem>
                    <SelectItem value="editor">Operator (editor)</SelectItem>
                    <SelectItem value="owner" disabled>
                      Manager (owner) - tylko dla właściciela
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Audytor: tylko podgląd | Operator: edycja danych | Manager: pełny dostęp
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={addMemberMutation.isPending}
              >
                Anuluj
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={addMemberMutation.isPending || !newMemberEmail.trim()}
              >
                {addMemberMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dodawanie...
                  </>
                ) : (
                  'Dodaj członka'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog potwierdzenia usunięcia członka */}
      {isProjectView && (
        <AlertDialog
          open={!!memberToDelete}
          onOpenChange={(open) => !open && setMemberToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć członka z projektu?</AlertDialogTitle>
              <AlertDialogDescription>
                Czy na pewno chcesz usunąć{' '}
                <strong>{memberToDelete?.email || memberToDelete?.id}</strong> z projektu?
                Ta operacja nie może być cofnięta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={removeMemberMutation.isPending}>
                Anuluj
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleRemoveMember(memberToDelete)}
                disabled={removeMemberMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeMemberMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Usuwanie...
                  </>
                ) : (
                  'Usuń'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
