import api from './api'

export const bannerImageService = {
  getAll: () => api.get('/BannerImages'),
  getById: (id) => api.get(`/BannerImages/${id}`),
  getActive: () => api.get('/BannerImages/active'),
  getByLanguage: (langId) => api.get(`/BannerImages/language/${langId}`),
  getWithLanguage: () => api.get('/BannerImages/with-language'),
  create: (data) => api.post('/BannerImages', data),
  update: (id, data) => api.put(`/BannerImages/${id}`, data),
  delete: (id) => api.delete(`/BannerImages/${id}`)
}
