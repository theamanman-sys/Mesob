import api from './api'

export const userService = {
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  register: (data) => api.post('/users/register', data),
  registerFirstAdmin: (data) => api.post('/users/register-first-admin', data),
  refreshToken: () => api.post('/users/accessToken'),
  getProfile: () => api.get('/users/profile'),
  getUserCount: () => api.get('/users/user-count'),
  getAllUsers: (page, limit) => api.get(`/users/users?page=${page}&limit=${limit}`),
  getUserById: (id) => api.get(`/users/users/${id}`),
  changeEmail: (data) => api.put('/users/change-email', data),
  changePassword: (data) => api.put('/users/change-password', data),
  activateUser: (id) => api.put(`/users/users/${id}/activate`),
  deactivateUser: (id) => api.put(`/users/users/${id}/deactivate`),
  unblockUser: (id) => api.put(`/users/users/${id}/unblock`),
  updateUser: (id, data) => api.put(`/users/users/${id}/update`, data),
  resetPassword: (id) => api.post(`/users/users/${id}/reset-password`),
  deleteUser: (id) => api.delete(`/users/users/${id}`)
}
