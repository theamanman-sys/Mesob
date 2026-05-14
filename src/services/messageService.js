import api from './api'

export const messageService = {
  getAll: (page, limit, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters })
    return api.get(`/messages?${params}`)
  },
  create: (data) => api.post('/messages', data)
}
