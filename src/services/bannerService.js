import api from './api'

export const bannerService = {
  getAll: () => api.get('/BannerData'),
  getById: (id) => api.get(`/BannerData/${id}`),
  getByLanguage: (langId) => api.get(`/BannerData/language/${langId}`),
  getWithLanguage: () => api.get('/BannerData/with-language'),
  create: (data) => api.post('/BannerData', data),
  update: (id, data) => api.put(`/BannerData/${id}`, data),
  delete: (id) => api.delete(`/BannerData/${id}`)
}
