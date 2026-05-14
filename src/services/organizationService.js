import api from './api'

export const organizationService = {
  getAll: (page, limit) => api.get(`/Organizations?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/Organizations/${id}`),
  getByIdWithLanguage: (id) => api.get(`/Organizations/${id}/with-language`),
  search: (name) => api.get(`/Organizations/search?name=${encodeURIComponent(name)}`),
  getWithLanguage: () => api.get('/Organizations/with-language'),
  create: (data) => api.post('/Organizations', data),
  update: (id, data) => api.put(`/Organizations/${id}`, data),
  delete: (id) => api.delete(`/Organizations/${id}`)
}
