import apiClient from '../lib/api';

export const authApi = {
  // Register new user
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Login with email/password
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Request password reset
  resetPassword: async (email) => {
    const response = await apiClient.post('/auth/reset-password', { email });
    return response.data;
  },

  // Update password (with token)
  updatePassword: async (password) => {
    const response = await apiClient.post('/auth/update-password', { password });
    return response.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Get Google OAuth URL
  getGoogleAuthUrl: async () => {
    const response = await apiClient.get('/auth/google');
    return response.data;
  },

  // Exchange OAuth code for session
  exchangeCode: async (code) => {
    const response = await apiClient.get(`/auth/callback?code=${code}`);
    return response.data;
  },
};

export default authApi;
