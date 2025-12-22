"use client"

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectPermissions } from '@/hooks/use-project-permissions';
import { projectsApi } from '@/services/projects.service';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Trash2, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';

const ROLE_LABELS = {
  owner: 'Manager',
  editor: 'Operator',
  viewer: 'Audytor',
};

const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  editor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

export default function ProjectTeamPage() {
  const { selectedProjectId, selectedProject } = useProject();
  const { canManageProject } = useProjectPermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('viewer');
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Pobierz członków projektu
  const {
    data: members,
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery({
    queryKey: ['projectMembers', selectedProjectId],
    queryFn: () => projectsApi.getProjectMembers(selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutacja dodawania członka
  const addMemberMutation = useMutation({
    mutationFn: (data) => projectsApi.addProjectMember(selectedProjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', selectedProjectId] });
      setIsAddDialogOpen(false);
      setNewMemberEmail('');
      setNewMemberRole('viewer');
      toast({
        title: 'Sukces',
        description: 'Członek został dodany do projektu.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się dodać członka.',
      });
    },
  });

  // Mutacja usuwania członka
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.removeProjectMember(selectedProjectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', selectedProjectId] });
      setMemberToDelete(null);
      toast({
        title: 'Sukces',
        description: 'Członek został usunięty z projektu.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się usunąć członka.',
      });
    },
  });

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Błąd',
        description: 'Email jest wymagany.',
      });
      return;
    }

    addMemberMutation.mutate({
      email: newMemberEmail.trim(),
      role: newMemberRole,
    });
  };

  const handleDeleteMember = (member) => {
    removeMemberMutation.mutate(member.userId);
  };

  // Jeśli brak projektu
  if (!selectedProjectId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Wybierz projekt, aby wyświetlić zespół.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Jeśli użytkownik nie ma uprawnień
  if (!canManageProject) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nie masz uprawnień do zarządzania zespołem projektu. Tylko właściciel projektu może zarządzać zespołem.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zespół projektu</h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj członkami projektu {selectedProject?.name}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Dodaj członka
        </Button>
      </div>

      {/* Lista członków */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Członkowie projektu
          </CardTitle>
          <CardDescription>
            Lista wszystkich członków projektu wraz z ich rolami
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : membersError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Wystąpił błąd podczas pobierania członków: {membersError.message}
              </AlertDescription>
            </Alert>
          ) : !members || members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak członków w projekcie. Dodaj pierwszego członka, aby rozpocząć.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rola</TableHead>
                  <TableHead>Data dodania</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {member.user?.email || member.userId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-800'}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString('pl-PL')}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMemberToDelete(member)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog dodawania członka */}
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

      {/* Dialog potwierdzenia usunięcia */}
      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć członka z projektu?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć{' '}
              <strong>{memberToDelete?.user?.email || memberToDelete?.userId}</strong> z projektu?
              Ta operacja nie może być cofnięta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteMember(memberToDelete)}
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
    </div>
  );
}

