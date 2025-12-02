import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UserPage';
import ParticipantsPage from './pages/ParticipantsPage';
import ParticipantFormPage from './pages/ParticipantsFormPage';
import SettingsPage from './pages/SettingsPage';
import RegisterPage from './pages/RegisterPage';
import PasswordResetPage from './pages/PasswordResetPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/participants" element={<ParticipantsPage />} />
                <Route path="/participants/new" element={<ParticipantFormPage />} />
                <Route path="/participants/edit/:id" element={<ParticipantFormPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Obsługa 404 wewnątrz panelu */}
                <Route path="*" element={<div>Nie znaleziono strony</div>} />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;