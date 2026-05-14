import api from './api'

export const advImageService = {
  getAll: () => api.get('/AdvImage'),
  getById: (id) => api.get(`/AdvImage/${id}`),
  getActive: () => api.get('/AdvImage/active'),
  getByLanguage: (langId) => api.get(`/AdvImage/language/${langId}`),
  getWithLanguage: () => api.get('/AdvImage/with-language'),
  create: (data) => api.post('/AdvImage', data),
  update: (id, data) => api.put(`/AdvImage/${id}`, data),
  updateStatus: (id, status) => api.put(`/AdvImage/${id}/status`, { status }),
  delete: (id) => api.delete(`/AdvImage/${id}`)
}
