import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Send, Trash2, RefreshCw, UserCircle2, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usersApi } from "@/services/users.service"
import { projectsApi } from "@/services/projects.service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/lib/roles"

export default function UsersPage() {
  const [inviteEmail, setInviteEmail] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  })

  // Fetch projects for assignment dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  })

  const users = usersData?.users || []
  const projects = projectsData?.projects || []

  // Update user approval mutation
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

  // Delete user mutation
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

  const handleProjectAssignment = (userId, projectId) => {
    updateApprovalMutation.mutate({
      userId,
      data: { assignedProjectId: projectId || null },
    })
  }

  const handleDelete = (userId) => {
    // Prevent self-deletion
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

  const handleResendInvite = (userEmail) => {
    // TODO: Implement resend invite functionality when backend endpoint is available
    toast({
      title: 'Funkcja w przygotowaniu',
      description: 'Funkcja ponownego wysyłania zaproszeń będzie dostępna wkrótce.',
    })
  }

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrator' : 'Rejestrator'
  }

  const getStatusBadge = (user) => {
    // Admins don't need approval or project assignment
    if (user.role === Role.ADMIN) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Aktywny
        </Badge>
      )
    }
    
    if (!user.isApproved) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Oczekuje
        </Badge>
      )
    }
    if (!user.assignedProjectId) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          Brak projektu
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Aktywny
      </Badge>
    )
  }

  if (usersLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Zarządzanie Dostępem</h1>
        <p className="text-muted-foreground">Zaproś członków zespołu do obsługi wydarzenia.</p>
      </div>

      {/* Invite Section */}
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Członkowie zespołu</CardTitle>
          <CardDescription>Zarządzaj dostępem i rolami użytkowników</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projekt</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Brak użytkowników
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={!user.isApproved ? "opacity-70" : ""}
                  >
                    {/* User Column */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className={!user.isApproved ? "opacity-60" : ""}>
                          <AvatarFallback className="bg-muted">
                            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{user.email}</span>
                          {(user.firstName || user.lastName) && (
                            <span className="text-xs text-muted-foreground">
                              {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      {getStatusBadge(user)}
                    </TableCell>

                    {/* Project Assignment Column */}
                    <TableCell>
                      {user.role === Role.ADMIN ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          Global Access
                        </Badge>
                      ) : (
                        <Select
                          value={user.assignedProjectId || "__none__"}
                          onValueChange={(value) => {
                            // Convert special value back to null
                            const projectId = value === "__none__" ? null : value;
                            handleProjectAssignment(user.id, projectId);
                          }}
                          disabled={updateApprovalMutation.isPending}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Wybierz projekt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Brak projektu</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!user.isApproved && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            disabled={
                              updateApprovalMutation.isPending || 
                              !user.assignedProjectId || 
                              user.role === Role.ADMIN
                            }
                            className="gap-2"
                            title={
                              !user.assignedProjectId && user.role !== Role.ADMIN
                                ? "Najpierw przypisz projekt, aby zatwierdzić użytkownika"
                                : undefined
                            }
                          >
                            <Check className="h-4 w-4" />
                            Zatwierdź
                          </Button>
                        )}
                        {!user.isApproved && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResendInvite(user.email)}
                            title="Ponów zaproszenie"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUser?.id || deleteUserMutation.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.id === currentUser?.id ? "Nie możesz usunąć własnego konta" : "Usuń"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
