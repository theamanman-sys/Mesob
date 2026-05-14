import api from './api'

export const advVideoService = {
  getAll: () => api.get('/AdvVideo'),
  getById: (id) => api.get(`/AdvVideo/${id}`),
  getActive: () => api.get('/AdvVideo/active'),
  getByLanguage: (langId) => api.get(`/AdvVideo/language/${langId}`),
  getWithLanguage: () => api.get('/AdvVideo/with-language'),
  create: (data) => api.post('/AdvVideo', data),
  update: (id, data) => api.put(`/AdvVideo/${id}`, data),
  updateStatus: (id, status) => api.put(`/AdvVideo/${id}/status`, { status }),
  delete: (id) => api.delete(`/AdvVideo/${id}`)
}
