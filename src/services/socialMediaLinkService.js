import api from './api'

export const socialMediaLinkService = {
  getAll: () => api.get('/SocialMediaLinks'),
  getById: (id) => api.get(`/SocialMediaLinks/${id}`),
  getActive: () => api.get('/SocialMediaLinks/active'),
  create: (data) => api.post('/SocialMediaLinks', data),
  update: (id, data) => api.put(`/SocialMediaLinks/${id}`, data),
  delete: (id) => api.delete(`/SocialMediaLinks/${id}`)
}
