"use client"

import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectPermissions } from '@/hooks/use-project-permissions';
import { projectsApi } from '@/services/projects.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, Activity, AlertCircle, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function DashboardPage() {
  const { selectedProjectId, selectedProject } = useProject();
  const { isAuditor, role } = useProjectPermissions();

  // Pobierz statystyki projektu
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

  // Jeśli brak projektu
  if (!selectedProjectId) {
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

