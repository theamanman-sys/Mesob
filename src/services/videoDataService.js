import api from './api'

export const videoDataService = {
  getAll: () => api.get('/VideoData'),
  getById: (id) => api.get(`/VideoData/${id}`),
  getActive: () => api.get('/VideoData/active'),
  getByLanguage: (langId) => api.get(`/VideoData/language/${langId}`),
  getLatest: (limit) => api.get(`/VideoData/latest?limit=${limit}`),
  getWithLanguage: () => api.get('/VideoData/with-language'),
  create: (data) => api.post('/VideoData', data),
  update: (id, data) => api.put(`/VideoData/${id}`, data),
  delete: (id) => api.delete(`/VideoData/${id}`)
}
