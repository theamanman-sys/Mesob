import api from './api'

export const newsUiTextService = {
  getAll: () => api.get('/NewsUiText'),
  getById: (id) => api.get(`/NewsUiText/${id}`),
  getByLanguageId: (langId) => api.get(`/NewsUiText/language/${langId}`),
  create: (data) => api.post('/NewsUiText', data),
  update: (id, data) => api.put(`/NewsUiText/${id}`, data),
  delete: (id) => api.delete(`/NewsUiText/${id}`)
}
