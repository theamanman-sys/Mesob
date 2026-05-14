import api from './api'

export const contactInfoService = {
  getAll: () => api.get('/contact-info'),
  getById: (id) => api.get(`/contact-info/${id}`),
  getActive: () => api.get('/contact-info/active'),
  getByLanguage: (langId) => api.get(`/contact-info/language/${langId}`),
  getWithLanguage: () => api.get('/contact-info/with-language'),
  create: (data) => api.post('/contact-info', data),
  update: (id, data) => api.put(`/contact-info/${id}`, data),
  delete: (id) => api.delete(`/contact-info/${id}`)
}
