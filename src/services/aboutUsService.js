import api from './api'

export const aboutUsService = {
  getAll: () => api.get('/AboutUs'),
  getById: (id) => api.get(`/AboutUs/${id}`),
  getByLanguage: (langId) => api.get(`/AboutUs/language/${langId}`),
  getWithLanguage: () => api.get('/AboutUs/with-language'),
  create: (data) => api.post('/AboutUs', data),
  update: (id, data) => api.put(`/AboutUs/${id}`, data),
  delete: (id) => api.delete(`/AboutUs/${id}`)
}
