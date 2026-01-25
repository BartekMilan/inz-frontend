import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, Check, Loader2, Mail, Shield, AlertCircle, UserCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
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
import { Role } from "@/lib/roles"

// Etykiety ról systemowych
const SYSTEM_ROLE_LABELS = {
  admin: 'Administrator',
  registrar: 'Rejestrator',
}

// Kolory dla statusów
const STATUS_COLORS = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200',
  noProject: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-orange-200',
}

export default function UsersPage() {
  const { isAdmin } = useProject()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Stan dla dialogu usuwania
  const [userToDelete, setUserToDelete] = useState(null)

  // Fetch wszystkich użytkowników (tylko dla Admina)
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAllUsers(),
    enabled: isAdmin,
  })

  // Fetch wszystkich projektów (do dropdowna)
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
    enabled: isAdmin,
  })

  const users = usersData?.users || []
  const projects = projectsData?.projects || []

  // Sortuj użytkowników: niezatwierdzeni na górze, potem po dacie utworzenia
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Admini zawsze na dole (są automatycznie zatwierdzeni)
      if (a.role === Role.ADMIN && b.role !== Role.ADMIN) return 1
      if (b.role === Role.ADMIN && a.role !== Role.ADMIN) return -1
      
      // Niezatwierdzeni na górze
      if (!a.isApproved && b.isApproved) return -1
      if (a.isApproved && !b.isApproved) return 1
      
      // Bez projektu wyżej niż z projektem (wśród zatwierdzonych)
      if (a.isApproved && b.isApproved) {
        if (!a.assignedProjectId && b.assignedProjectId) return -1
        if (a.assignedProjectId && !b.assignedProjectId) return 1
      }
      
      // Po dacie utworzenia (najnowsi wyżej)
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [users])

  // Mutacja aktualizacji użytkownika
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }) => usersApi.updateUserApproval(userId, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Zaktualizowano',
        description: 'Dane użytkownika zostały zaktualizowane.',
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

  // Mutacja usuwania użytkownika
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setUserToDelete(null)
      toast({
        title: 'Usunięto',
        description: 'Użytkownik został usunięty z systemu.',
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

  // Handlery
  const handleApprovalChange = (userId, isApproved) => {
    updateUserMutation.mutate({
      userId,
      data: { isApproved },
    })
  }

  const handleProjectChange = (userId, projectId) => {
    updateUserMutation.mutate({
      userId,
      data: { assignedProjectId: projectId === 'none' ? null : projectId },
    })
  }

  const handleDeleteClick = (user) => {
    if (user.id === currentUser?.id) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Nie możesz usunąć własnego konta',
      })
      return
    }
    setUserToDelete(user)
  }

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  // Funkcje pomocnicze
  const getInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return '?'
  }

  const getUserStatus = (user) => {
    if (user.role === Role.ADMIN) {
      return { label: 'Admin', color: STATUS_COLORS.approved, icon: Shield }
    }
    if (!user.isApproved) {
      return { label: 'Oczekuje', color: STATUS_COLORS.pending, icon: Clock }
    }
    if (!user.assignedProjectId) {
      return { label: 'Brak projektu', color: STATUS_COLORS.noProject, icon: AlertCircle }
    }
    return { label: 'Aktywny', color: STATUS_COLORS.approved, icon: UserCheck }
  }

  // Sprawdź czy użytkownik jest adminem
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Brak dostępu. Ta strona jest dostępna tylko dla administratorów.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (usersLoading || projectsLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
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

  // Statystyki
  const pendingCount = users.filter(u => !u.isApproved && u.role !== Role.ADMIN).length
  const activeCount = users.filter(u => u.isApproved && u.assignedProjectId && u.role !== Role.ADMIN).length
  const totalCount = users.length

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Panel Administratora
        </h1>
        <p className="text-muted-foreground">
          Zarządzaj użytkownikami systemu, zatwierdzaj nowe konta i przypisuj projekty.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Oczekujących na zatwierdzenie</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktywnych użytkowników</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Wszystkich użytkowników</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Alert dla oczekujących */}
      {pendingCount > 0 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Masz <strong>{pendingCount}</strong> {pendingCount === 1 ? 'użytkownika oczekującego' : 'użytkowników oczekujących'} na zatwierdzenie.
          </AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Użytkownicy systemu</CardTitle>
          <CardDescription>
            Lista wszystkich zarejestrowanych użytkowników. Zatwierdź nowe konta i przypisz projekty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Brak zarejestrowanych użytkowników.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Użytkownik</TableHead>
                    <TableHead className="w-[120px]">Rola</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[220px]">Przypisany projekt</TableHead>
                    <TableHead className="w-[100px] text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => {
                    const status = getUserStatus(user)
                    const StatusIcon = status.icon
                    const isCurrentUser = user.id === currentUser?.id
                    const isAdminUser = user.role === Role.ADMIN
                    const canModify = !isAdminUser && !isCurrentUser

                    return (
                      <TableRow 
                        key={user.id}
                        className={!user.isApproved && !isAdminUser ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : ''}
                      >
                        {/* Użytkownik Column */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatarUrl} alt={user.email} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email
                                }
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Rola Column */}
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            <Shield className="h-3 w-3 mr-1" />
                            {SYSTEM_ROLE_LABELS[user.role] || user.role}
                          </Badge>
                        </TableCell>

                        {/* Status Column */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {canModify && !user.isApproved ? (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={user.isApproved}
                                  onCheckedChange={(checked) => handleApprovalChange(user.id, checked)}
                                  disabled={updateUserMutation.isPending}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {user.isApproved ? 'Tak' : 'Nie'}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Przypisany Projekt Column */}
                        <TableCell>
                          {isAdminUser ? (
                            <span className="text-sm text-muted-foreground italic">
                              Dostęp do wszystkich
                            </span>
                          ) : (
                            <Select
                              value={user.assignedProjectId || 'none'}
                              onValueChange={(value) => handleProjectChange(user.id, value)}
                              disabled={updateUserMutation.isPending || !canModify}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Wybierz projekt" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">— Brak —</span>
                                </SelectItem>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>

                        {/* Akcje Column */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Przycisk Zatwierdź - tylko dla niezatwierdzonych */}
                            {canModify && !user.isApproved && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprovalChange(user.id, true)}
                                disabled={updateUserMutation.isPending}
                                className="gap-1"
                              >
                                {updateUserMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Zatwierdź
                              </Button>
                            )}
                            
                            {/* Przycisk Usuń */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user)}
                              disabled={isCurrentUser || isAdminUser || deleteUserMutation.isPending}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={
                                isCurrentUser 
                                  ? 'Nie możesz usunąć własnego konta' 
                                  : isAdminUser 
                                    ? 'Nie można usunąć administratora'
                                    : 'Usuń użytkownika'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog - Potwierdzenie usunięcia */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego użytkownika?</AlertDialogTitle>
            <AlertDialogDescription>
              Zamierzasz usunąć użytkownika <strong>{userToDelete?.email}</strong>.
              {userToDelete?.firstName && userToDelete?.lastName && (
                <> ({userToDelete.firstName} {userToDelete.lastName})</>
              )}
              <br /><br />
              Ta operacja jest <strong>nieodwracalna</strong>. Użytkownik straci dostęp do systemu
              i wszystkie jego dane zostaną usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Usuń użytkownika
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
