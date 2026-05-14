import api from './api'

export const governmentServiceService = {
  getAll: () => api.get('/GovernmentServices'),
  getById: (id) => api.get(`/GovernmentServices/${id}`),
  getLatest: (limit) => api.get(`/GovernmentServices/latest?limit=${limit}`),
  create: (data) => api.post('/GovernmentServices', data),
  update: (id, data) => api.put(`/GovernmentServices/${id}`, data),
  delete: (id) => api.delete(`/GovernmentServices/${id}`)
}
