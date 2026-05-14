import api from './api'

export const contactUiTextService = {
  getAll: () => api.get('/contact-ui-text'),
  getById: (id) => api.get(`/contact-ui-text/${id}`),
  getByKey: (key) => api.get(`/contact-ui-text/key/${key}`),
  getByLanguage: (langId) => api.get(`/contact-ui-text/language/${langId}`),
  getWithLanguage: () => api.get('/contact-ui-text/with-language'),
  create: (data) => api.post('/contact-ui-text', data),
  update: (id, data) => api.put(`/contact-ui-text/${id}`, data),
  delete: (id) => api.delete(`/contact-ui-text/${id}`)
}
