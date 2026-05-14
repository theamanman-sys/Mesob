import api from './api'

export const bodyTextService = {
  getAll: () => api.get('/BodyTexts'),
  getById: (id) => api.get(`/BodyTexts/${id}`),
  getByLanguage: (langId) => api.get(`/BodyTexts/language/${langId}`),
  create: (data) => api.post('/BodyTexts', data),
  update: (id, data) => api.put(`/BodyTexts/${id}`, data),
  delete: (id) => api.delete(`/BodyTexts/${id}`)
}
