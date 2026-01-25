"use client"

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/contexts/ProjectContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectPermissions } from '@/hooks/use-project-permissions';
import { projectsApi } from '@/services/projects.service';
import { Role } from '@/lib/roles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, Activity, AlertCircle, Eye, ArrowRight, ClipboardList } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

// ============================================================================
// WIDOK DLA REJESTRATORA (REGISTRAR)
// ============================================================================
function RegistrarDashboard({ user, selectedProject, selectedProjectId, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header z powitaniem */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cześć, {user?.email || 'Użytkowniku'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Panel Rejestratora - zarządzaj uczestnikami wydarzenia
        </p>
      </div>

      {/* Karta z informacją o przypisanym projekcie */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Twój przypisany projekt</CardTitle>
              <CardDescription>
                Projekt, do którego masz dostęp jako Rejestrator
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            // Skeleton podczas ładowania
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
          ) : selectedProject ? (
            <>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-xl font-semibold">{selectedProject.name}</h3>
                {selectedProject.description && (
                  <p className="text-muted-foreground mt-1">
                    {selectedProject.description}
                  </p>
                )}
              </div>
              
              {/* CTA Button */}
              <Button 
                size="lg" 
                className="w-full gap-2 text-lg py-6"
                onClick={() => navigate(`/projects/${selectedProjectId}/participants`)}
              >
                <Users className="h-5 w-5" />
                Przejdź do listy uczestników
                <ArrowRight className="h-5 w-5 ml-auto" />
              </Button>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nie masz przypisanego projektu. Skontaktuj się z administratorem.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pomocna informacja */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Twoje uprawnienia</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Przeglądanie listy uczestników
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Edycja danych uczestników (np. status płatności)
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Dodawanie nowych uczestników
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// WIDOK DLA ADMINA
// ============================================================================
function AdminDashboard({ selectedProjectId, selectedProject, isAuditor }) {
  // Pobierz statystyki projektu (tylko dla admina)
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['projectStats', selectedProjectId],
    queryFn: () => projectsApi.getProjectStats(selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Przygotuj dane do wykresu (Status generowania dokumentów)
  const chartData = [
    { name: 'Gotowe', value: stats?.documentCount || 0, color: COLORS[0] },
    { name: 'Oczekujące', value: stats?.progressPercentage ? 1 : 0, color: COLORS[1] },
    { name: 'Błędy', value: stats?.lastTaskErrorCount || 0, color: COLORS[2] },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header z nazwą projektu i badge dla viewerów */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedProject?.name || 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Przegląd projektu i statystyki
          </p>
        </div>
        {isAuditor && (
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Eye className="h-4 w-4" />
            Panel Audytora - Tryb odczytu
          </Badge>
        )}
      </div>

      {/* Alert dla viewerów */}
      {isAuditor && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Jesteś w trybie audytora. Możesz tylko przeglądać dane, bez możliwości edycji.
          </AlertDescription>
        </Alert>
      )}

      {/* Karty KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Liczba uczestników */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uczestnicy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.participantCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Zarejestrowanych uczestników
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Wygenerowane dokumenty */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dokumenty</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.documentCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Wygenerowanych dokumentów
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ostatnia aktywność / Błędy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ostatnia aktywność</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.lastTaskErrorCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Błędy w ostatnim zadaniu
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Postęp generowania */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Postęp</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.progressPercentage !== null ? `${stats.progressPercentage}%` : '—'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.progressPercentage !== null ? 'Aktualne zadania' : 'Brak aktywnych zadań'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wykres */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Wykres kołowy - Status generowania */}
        <Card>
          <CardHeader>
            <CardTitle>Status generowania dokumentów</CardTitle>
            <CardDescription>
              Podział wygenerowanych dokumentów według statusu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-[300px]">
                <Skeleton className="h-full w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Brak danych do wyświetlenia
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wykres słupkowy - Statystyki */}
        <Card>
          <CardHeader>
            <CardTitle>Przegląd statystyk</CardTitle>
            <CardDescription>
              Porównanie kluczowych metryk projektu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-[300px]">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Uczestnicy', value: stats?.participantCount || 0 },
                  { name: 'Dokumenty', value: stats?.documentCount || 0 },
                  { name: 'Błędy', value: stats?.lastTaskErrorCount || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Błąd ładowania */}
      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Wystąpił błąd podczas pobierania statystyk: {statsError.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================================================
// GŁÓWNY KOMPONENT - ROLE-BASED DASHBOARD
// ============================================================================
export default function DashboardPage() {
  const { selectedProjectId, selectedProject, isLoadingProjectDetails, isLoadingProjects } = useProject();
  const { user, userRole } = useAuth();
  const { isAuditor } = useProjectPermissions();

  // Pokaż skeleton podczas ładowania dla REGISTRAR
  const isLoading = isLoadingProjectDetails || (isLoadingProjects && !selectedProject);

  // Jeśli brak projektu i nie ładujemy
  if (!selectedProjectId && !isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Wybierz projekt, aby wyświetlić dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // REGISTRAR - uproszczony widok (bez statystyk)
  if (userRole === Role.REGISTRAR) {
    return (
      <RegistrarDashboard 
        user={user} 
        selectedProject={selectedProject} 
        selectedProjectId={selectedProjectId}
        isLoading={isLoading}
      />
    );
  }

  // ADMIN - pełny widok ze statystykami
  return (
    <AdminDashboard 
      selectedProjectId={selectedProjectId} 
      selectedProject={selectedProject} 
      isAuditor={isAuditor} 
    />
  );
}
