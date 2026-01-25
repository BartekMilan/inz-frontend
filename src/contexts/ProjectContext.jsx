import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../services/projects.service';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

const SELECTED_PROJECT_KEY = 'selectedProjectId';

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  REGISTRAR: 'registrar',
};

export function ProjectProvider({ children }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    // Initialize from localStorage
    // For registrars, check if assigned_project_id is stored
    const assignedProjectId = localStorage.getItem('assignedProjectId');
    if (assignedProjectId) {
      return assignedProjectId;
    }
    return localStorage.getItem(SELECTED_PROJECT_KEY) || null;
  });

  // Fetch user's system role
  const {
    data: roleData,
    isLoading: isLoadingRole,
  } = useQuery({
    queryKey: ['userRole'],
    queryFn: projectsApi.getUserRole,
    staleTime: 10 * 60 * 1000, // 10 minutes - role doesn't change often
  });

  const userRole = roleData?.role || ROLES.REGISTRAR;
  const isAdmin = userRole === ROLES.ADMIN;
  
  // Get assignedProjectId from user profile (for REGISTRAR)
  const assignedProjectId = user?.assignedProjectId || null;

  // Fetch user's projects - ONLY for ADMIN
  // For REGISTRAR, we use assignedProjectId directly
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Only fetch projects list for ADMIN, REGISTRAR uses assignedProjectId
    enabled: isAdmin || !assignedProjectId,
  });

  const projects = projectsData?.projects || [];

  // Auto-select project based on role
  useEffect(() => {
    // For REGISTRAR with assignedProjectId - always use that project
    if (!isAdmin && assignedProjectId) {
      if (selectedProjectId !== assignedProjectId) {
        console.log('[ProjectContext] REGISTRAR: Using assignedProjectId:', assignedProjectId);
        setSelectedProjectId(assignedProjectId);
        localStorage.setItem(SELECTED_PROJECT_KEY, assignedProjectId);
        localStorage.setItem('assignedProjectId', assignedProjectId);
      }
      return;
    }
    
    // For ADMIN or REGISTRAR without assignedProjectId - use projects list
    if (!isLoadingProjects && projects.length > 0) {
      const projectExists = projects.some(p => p.id === selectedProjectId);
      
      // Select first available if no project selected or selected project doesn't exist
      if (!selectedProjectId || !projectExists) {
        const firstProject = projects[0];
        setSelectedProjectId(firstProject.id);
        localStorage.setItem(SELECTED_PROJECT_KEY, firstProject.id);
      }
    }
  }, [projects, selectedProjectId, isLoadingProjects, isAdmin, assignedProjectId]);

  // Fetch selected project details with user role
  const {
    data: projectDetails,
    isLoading: isLoadingProjectDetails,
  } = useQuery({
    queryKey: ['projectDetails', selectedProjectId],
    queryFn: () => projectsApi.getProject(selectedProjectId),
    enabled: !!selectedProjectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get selected project object (prefer details from API, fallback to list)
  const selectedProject = useMemo(() => {
    if (projectDetails) {
      return projectDetails;
    }
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId, projectDetails]);

  // Get user's role in the selected project
  const myRole = selectedProject?.role || null;

  // Switch project
  const switchProject = useCallback((projectId) => {
    setSelectedProjectId(projectId);
    localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    
    // Invalidate all project-specific queries to force refetch with new project
    // Using queryKey prefix to invalidate all queries that start with these keys
    queryClient.invalidateQueries({ queryKey: ['sheetConfiguration'] });
    queryClient.invalidateQueries({ queryKey: ['sheetData'] });
    queryClient.invalidateQueries({ queryKey: ['sheetStatus'] });
    queryClient.invalidateQueries({ queryKey: ['fieldDefinitions'] });
    queryClient.invalidateQueries({ queryKey: ['projectMembers'] });
    queryClient.invalidateQueries({ queryKey: ['participants'] });
    queryClient.invalidateQueries({ queryKey: ['eventConfig'] });
    queryClient.invalidateQueries({ queryKey: ['projectDetails'] });
  }, [queryClient]);

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Auto-select newly created project
      switchProject(newProject.id);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, data }) => projectsApi.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: (_, deletedProjectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // If deleted project was selected, select another one
      if (deletedProjectId === selectedProjectId) {
        const remainingProjects = projects.filter(p => p.id !== deletedProjectId);
        if (remainingProjects.length > 0) {
          switchProject(remainingProjects[0].id);
        } else {
          setSelectedProjectId(null);
          localStorage.removeItem(SELECTED_PROJECT_KEY);
        }
      }
    },
  });

  // Create project helper
  const createProject = useCallback(async (data) => {
    return createProjectMutation.mutateAsync(data);
  }, [createProjectMutation]);

  // Update project helper
  const updateProject = useCallback(async (projectId, data) => {
    return updateProjectMutation.mutateAsync({ projectId, data });
  }, [updateProjectMutation]);

  // Delete project helper
  const deleteProject = useCallback(async (projectId) => {
    return deleteProjectMutation.mutateAsync(projectId);
  }, [deleteProjectMutation]);

  // Clear project selection (for logout)
  const clearProjectSelection = useCallback(() => {
    setSelectedProjectId(null);
    localStorage.removeItem(SELECTED_PROJECT_KEY);
    localStorage.removeItem('assignedProjectId');
  }, []);

  // Initialize project from assigned_project_id (for registrars after login)
  const initializeFromAssignedProject = useCallback((assignedProjectId) => {
    if (assignedProjectId) {
      setSelectedProjectId(assignedProjectId);
      localStorage.setItem(SELECTED_PROJECT_KEY, assignedProjectId);
      localStorage.setItem('assignedProjectId', assignedProjectId);
    }
  }, []);

  const value = {
    // Role
    userRole,
    isAdmin,
    isLoadingRole,
    
    // State
    projects,
    selectedProject,
    selectedProjectId,
    isLoadingProjects,
    projectsError,
    isLoadingProjectDetails,
    
    // Project role
    myRole, // User's role in the selected project ('owner', 'editor', 'viewer')
    
    // Actions
    switchProject,
    createProject,
    updateProject,
    deleteProject,
    refetchProjects,
    clearProjectSelection,
    initializeFromAssignedProject,
    
    // Mutation states
    isCreatingProject: createProjectMutation.isPending,
    isUpdatingProject: updateProjectMutation.isPending,
    isDeletingProject: deleteProjectMutation.isPending,
    
    // Helpers
    // For REGISTRAR with assignedProjectId, hasProjects is true even if projects list is empty
    hasProjects: projects.length > 0 || !!assignedProjectId,
    hasSelectedProject: !!selectedProject,
    canSwitchProjects: isAdmin && projects.length > 1,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export default ProjectContext;
