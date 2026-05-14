import api from './api'

export const headquartersService = {
  getAll: () => api.get('/headquarters'),
  getById: (id) => api.get(`/headquarters/${id}`),
  getByLanguage: (langId) => api.get(`/headquarters/language/${langId}`),
  getLatestByLanguage: (langId, limit) => api.get(`/headquarters/language/${langId}/latest?limit=${limit}`),
  getSingleByLanguage: (langId) => api.get(`/headquarters/language/${langId}/single`),
  getLatest: (limit) => api.get(`/headquarters/latest?limit=${limit}`),
  search: (term) => api.get(`/headquarters/search?term=${encodeURIComponent(term)}`),
  getWithLanguage: () => api.get('/headquarters/with-language'),
  create: (data) => api.post('/headquarters', data),
  update: (id, data) => api.put(`/headquarters/${id}`, data),
  delete: (id) => api.delete(`/headquarters/${id}`)
}
