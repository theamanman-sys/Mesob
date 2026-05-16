import api from './api'

const CITIZEN_BASE = '/citizens'

export const citizenService = {
  async register(data) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/register`, data)
    const result = response.data || response
    if (result.accessToken) {
      sessionStorage.setItem('citizen_token', result.accessToken)
    }
    if (result.citizen) {
      sessionStorage.setItem('citizen_user', JSON.stringify(result.citizen))
    }
    return result
  },

  async login(identifier, password) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/login`, { identifier, password })
    const result = response.data || response
    if (result.accessToken) {
      sessionStorage.setItem('citizen_token', result.accessToken)
    }
    if (result.citizen) {
      sessionStorage.setItem('citizen_user', JSON.stringify(result.citizen))
    }
    return result
  },

  async googleLogin(credential) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/google`, { credential })
    const result = response.data || response
    if (result.accessToken) {
      sessionStorage.setItem('citizen_token', result.accessToken)
    }
    if (result.citizen) {
      sessionStorage.setItem('citizen_user', JSON.stringify(result.citizen))
    }
    return result
  },

  logout() {
    sessionStorage.removeItem('citizen_token')
    sessionStorage.removeItem('citizen_user')
  },

  getSession() {
    const raw = sessionStorage.getItem('citizen_user')
    return raw ? JSON.parse(raw) : null
  },

  isLoggedIn() {
    return !!sessionStorage.getItem('citizen_token')
  },

  async getApplications() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/applications`)
    return response.data || []
  },

  async submitApplication(serviceId, serviceTitle, formData, documents) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/applications`, {
      serviceId, serviceTitle, formData, documents
    })
    return response.data || response
  },

  async updateApplication(appId, data) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/applications/${appId}`, data)
    return response.data || response
  },

  async deleteApplication(appId) {
    await api.delete(`${CITIZEN_BASE}/applications/${appId}`)
  },

  async getDocuments() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/documents`)
    return response.data || []
  },

  async uploadDocument(file, type, extra = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const { data: response } = await api.post(`${CITIZEN_BASE}/documents`, {
            name: file.name, size: file.size, type, dataUrl: reader.result, ...extra
          })
          resolve(response.data || response)
        } catch (err) { reject(err) }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  async updateDocument(docId, data) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/documents/${docId}`, data)
    return response.data || response
  },

  async deleteDocument(docId) {
    await api.delete(`${CITIZEN_BASE}/documents/${docId}`)
  },

  async updateProfile(updates) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/profile`, updates)
    const result = response.data || response
    if (result) {
      sessionStorage.setItem('citizen_user', JSON.stringify(result))
    }
    return result
  },

  async getProfile() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/session`)
    const result = response.data || response
    if (result) {
      sessionStorage.setItem('citizen_user', JSON.stringify(result))
    }
    return result
  }
}
