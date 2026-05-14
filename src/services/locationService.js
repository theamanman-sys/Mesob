import api from './api'

export const locationService = {
  getAll: () => api.get('/Locations'),
  getById: (id) => api.get(`/Locations/${id}`),
  getActive: () => api.get('/Locations/active'),
  getByLanguage: (langId) => api.get(`/Locations/language/${langId}`),
  getWithLanguage: () => api.get('/Locations/with-language'),
  create: (data) => api.post('/Locations', data),
  update: (id, data) => api.put(`/Locations/${id}`, data),
  delete: (id) => api.delete(`/Locations/${id}`)
}
