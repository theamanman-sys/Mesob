import api from './api'

export const serviceService = {
  getAll: () => api.get('/Services'),
  getById: (id) => api.get(`/Services/${id}`),
  getActive: () => api.get('/Services/active'),
  getByLanguage: (langId) => api.get(`/Services/language/${langId}`),
  getByOrganization: (orgId) => api.get(`/Services/organization/${orgId}`),
  getByOrganizationAndLanguage: (orgId, langId) => api.get(`/Services/organization/${orgId}/language/${langId}`),
  searchByDescription: (term) => api.get(`/Services/search/description?description=${encodeURIComponent(term)}`),
  searchByTitle: (term) => api.get(`/Services/search/title?title=${encodeURIComponent(term)}`),
  getWithLanguage: () => api.get('/Services/with-language'),
  getWithLanguageAndOrganization: () => api.get('/Services/with-language-and-organization'),
  create: (data) => api.post('/Services', data),
  update: (id, data) => api.put(`/Services/${id}`, data),
  delete: (id) => api.delete(`/Services/${id}`)
}
