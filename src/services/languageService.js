import api from './api'

export const languageService = {
  getAll: () => api.get('/Languages'),
  getById: (id) => api.get(`/Languages/${id}`),
  getActive: () => api.get('/Languages/active'),
  getByCode: (code) => api.get(`/Languages/code/${code}`),
  create: (data) => api.post('/Languages', data),
  update: (id, data) => api.put(`/Languages/${id}`, data),
  delete: (id) => api.delete(`/Languages/${id}`)
}
