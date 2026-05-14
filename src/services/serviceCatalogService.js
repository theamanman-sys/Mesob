import api from './api'

export const serviceCatalogService = {
  getAll: () => api.get('/ServiceCatalog'),
  getById: (id) => api.get(`/ServiceCatalog/${id}`),
  getByLanguage: (langId) => api.get(`/ServiceCatalog/language/${langId}`),
  search: (term) => api.get(`/ServiceCatalog/search?name=${encodeURIComponent(term)}`),
  getWithLanguage: () => api.get('/ServiceCatalog/with-language'),
  getWithLanguageAndOrganization: () => api.get('/ServiceCatalog/with-language-and-organization'),
  getWithOrganization: () => api.get('/ServiceCatalog/with-organization'),
  create: (data) => api.post('/ServiceCatalog', data),
  update: (id, data) => api.put(`/ServiceCatalog/${id}`, data),
  delete: (id) => api.delete(`/ServiceCatalog/${id}`)
}
