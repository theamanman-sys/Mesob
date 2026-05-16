import axios from 'axios'

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://mesobportalback.mesobcenter.et/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

api.interceptors.request.use(
  (config) => {
    let token = sessionStorage.getItem('accessToken')
    if (!token) {
      token = sessionStorage.getItem('citizen_token')
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const isCitizen = !!sessionStorage.getItem('citizen_token')
      if (isCitizen) {
        sessionStorage.removeItem('citizen_token')
        sessionStorage.removeItem('citizen_user')
        window.location.href = '/citizen-login'
        return Promise.reject(error)
      }
      try {
        const { data } = await axios.post(`${API_BASE_URL}/users/accessToken`, {}, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        })
        if (data.accessToken) {
          sessionStorage.setItem('accessToken', data.accessToken)
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return api(originalRequest)
        }
      } catch {
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
