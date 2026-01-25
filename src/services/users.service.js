import apiClient from '../lib/api';

export const usersApi = {
  // Get all users (admin) or project members (owner/editor)
  // @param {string} [projectId] - Optional project ID to get project members
  getAllUsers: async (projectId) => {
    const url = projectId ? `/users?projectId=${projectId}` : '/users';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Update user approval and project assignment (admin only)
  updateUserApproval: async (userId, data) => {
    const response = await apiClient.patch(`/users/${userId}`, data);
    return response.data;
  },

  // Delete a user (admin only)
  deleteUser: async (userId) => {
    await apiClient.delete(`/users/${userId}`);
  },
};

export default usersApi;

