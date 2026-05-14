import api from './api'

export const translatedOrganizationService = {
  getAll: () => api.get('/TranslatedOrganizations'),
  getById: (id) => api.get(`/TranslatedOrganizations/${id}`),
  getByLanguage: (langId) => api.get(`/TranslatedOrganizations/language/${langId}`),
  getByOrganization: (orgId) => api.get(`/TranslatedOrganizations/organization/${orgId}`),
  search: (term) => api.get(`/TranslatedOrganizations/search?name=${encodeURIComponent(term)}`),
  getWithLanguage: () => api.get('/TranslatedOrganizations/with-language'),
  getWithOrganization: () => api.get('/TranslatedOrganizations/with-organization'),
  getWithOrganizationAndLanguage: () => api.get('/TranslatedOrganizations/with-organization-and-language'),
  create: (data) => api.post('/TranslatedOrganizations', data),
  update: (id, data) => api.put(`/TranslatedOrganizations/${id}`, data),
  delete: (id) => api.delete(`/TranslatedOrganizations/${id}`)
}
