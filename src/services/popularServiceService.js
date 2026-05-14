import api from './api'

export const popularServiceService = {
  getAll: () => api.get('/PopularServices'),
  getById: (id) => api.get(`/PopularServices/${id}`),
  getActive: () => api.get('/PopularServices/active'),
  getByLanguage: (langId) => api.get(`/PopularServices/language/${langId}`),
  getWithLanguage: () => api.get('/PopularServices/with-language'),
  create: (data) => api.post('/PopularServices', data),
  update: (id, data) => api.put(`/PopularServices/${id}`, data),
  delete: (id) => api.delete(`/PopularServices/${id}`)
}
