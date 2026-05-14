import api from './api'

export const newsService = {
  getAll: () => api.get('/NewsData'),
  getById: (id) => api.get(`/NewsData/${id}`),
  getActive: () => api.get('/NewsData/active'),
  getByCategory: (category) => api.get(`/NewsData/category/${encodeURIComponent(category)}`),
  getLatest: (limit) => api.get(`/NewsData/latest?limit=${limit}`),
  search: (title) => api.get(`/NewsData/search?title=${encodeURIComponent(title)}`),
  create: (data) => api.post('/NewsData', data),
  update: (id, data) => api.put(`/NewsData/${id}`, data),
  delete: (id) => api.delete(`/NewsData/${id}`)
}
