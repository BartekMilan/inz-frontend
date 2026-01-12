import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { Role } from './lib/roles';

import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UserPage';
import ParticipantsPage from './pages/ParticipantsPage';
import ParticipantFormPage from './pages/ParticipantFormPage';
import SettingsPage from './pages/SettingsPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetPage from './pages/PasswordResetPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';

// Role-protected route wrapper component
function RoleProtectedRoute({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {children}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ProjectProvider>
                  <DashboardLayout>
                    <Routes>
                      {/* Admin only routes */}
                      <Route 
                        path="/settings" 
                        element={
                          <RoleProtectedRoute allowedRoles={[Role.ADMIN]}>
                            <SettingsPage />
                          </RoleProtectedRoute>
                        } 
                      />
                      
                      {/* Users/Team - dostęp dla ADMIN, OWNER, EDITOR (logika w komponencie) */}
                      <Route 
                        path="/users" 
                        element={<UsersPage />} 
                      />
                      
                      {/* Dashboard - dostęp dla wszystkich */}
                      <Route 
                        path="/dashboard" 
                        element={<DashboardPage />} 
                      />
                      
                      {/* Admin and Registrar routes */}
                      <Route 
                        path="/participants" 
                        element={
                          <RoleProtectedRoute allowedRoles={[Role.ADMIN, Role.REGISTRAR]}>
                            <ParticipantsPage />
                          </RoleProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/participants/new" 
                        element={
                          <RoleProtectedRoute allowedRoles={[Role.ADMIN, Role.REGISTRAR]}>
                            <ParticipantFormPage />
                          </RoleProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/participants/edit/:id" 
                        element={
                          <RoleProtectedRoute allowedRoles={[Role.ADMIN, Role.REGISTRAR]}>
                            <ParticipantFormPage />
                          </RoleProtectedRoute>
                        } 
                      />
                      
                      {/* Default redirect for authenticated users - przekierowanie do dashboard */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      
                      {/* 404 inside dashboard */}
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProjectProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;