import apiClient from '../lib/api';

export const usersApi = {
  // Get all users (admin only)
  getAllUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Update user approval and project assignment (admin only)
  updateUserApproval: async (userId, data) => {
    const response = await apiClient.put(`/users/${userId}/approval`, data);
    return response.data;
  },

  // Delete a user (admin only)
  deleteUser: async (userId) => {
    await apiClient.delete(`/users/${userId}`);
  },
};

export default usersApi;

