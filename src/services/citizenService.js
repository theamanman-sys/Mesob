import api from './api'

const CITIZEN_BASE = '/citizens'

export const citizenService = {
  async register(data) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/register`, data)
    const result = response.data || response
    if (result.accessToken) {
      localStorage.setItem('citizen_token', result.accessToken)
    }
    if (result.citizen) {
      localStorage.setItem('citizen_user', JSON.stringify(result.citizen))
    }
    return result
  },

  async login(identifier, password) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/login`, { identifier, password })
    const result = response.data || response
    if (result.accessToken) {
      localStorage.setItem('citizen_token', result.accessToken)
    }
    if (result.citizen) {
      localStorage.setItem('citizen_user', JSON.stringify(result.citizen))
    }
    return result
  },

  async googleLogin(credential) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/google`, { credential })
    const result = response.data || response
    if (result.accessToken) {
      localStorage.setItem('citizen_token', result.accessToken)
    }
    if (result.citizen) {
      localStorage.setItem('citizen_user', JSON.stringify(result.citizen))
    }
    return result
  },

  logout() {
    localStorage.removeItem('citizen_token')
    localStorage.removeItem('citizen_user')
  },

  getSession() {
    const raw = localStorage.getItem('citizen_user')
    return raw ? JSON.parse(raw) : null
  },

  isLoggedIn() {
    return !!localStorage.getItem('citizen_token')
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
      localStorage.setItem('citizen_user', JSON.stringify(result))
    }
    return result
  },

  async getProfile() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/session`)
    const result = response.data || response
    if (result) {
      localStorage.setItem('citizen_user', JSON.stringify(result))
    }
    return result
  },

  // Net Worth
  async getNetWorth() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/net-worth`)
    return response.data || response
  },

  async updateNetWorth(netWorth, assets = [], liabilities = []) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/net-worth`, { netWorth, assets, liabilities })
    return response.data || response
  },

  async getNetWorthRankings() {
    const { data: response } = await api.get('/net-worth/rankings')
    return response.data || []
  },

  // Contributions
  async getContributions() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/contributions`)
    return response.data || []
  },

  async submitContribution(department, amount, message = '') {
    const { data: response } = await api.post('/contributions', { department, amount, message })
    return response.data || response
  },

  async getContributionStats() {
    const { data: response } = await api.get('/contributions/stats')
    return response.data || response
  },

  // Economy
  async getEconomyData() {
    const { data: response } = await api.get('/economy')
    return response.data || response
  },

  // Tickets
  async getTickets() {
    const { data: response } = await api.get('/tickets')
    return response.data || []
  },

  async getTicketStats() {
    const { data: response } = await api.get('/tickets/stats')
    return response.data || response
  },

  // Budgets
  async getBudgets() {
    const { data: response } = await api.get('/budgets')
    return response.data || []
  },

  async getBudgetOverview() {
    const { data: response } = await api.get('/budgets/overview')
    return response.data || {}
  },

  async getDepartmentBudget(id) {
    const { data: response } = await api.get(`/budgets/department/${id}`)
    return response.data || response
  },

  async updateDepartmentBudget(id, updates) {
    const { data: response } = await api.put(`/budgets/department/${id}`, updates)
    return response.data || response
  },

  // Department Controls
  async getDepartmentControls() {
    const { data: response } = await api.get('/department-controls')
    return response.data || {}
  },

  async updateDepartmentControls(controls) {
    const { data: response } = await api.put('/department-controls', controls)
    return response.data || response
  },

  async updateDepartmentControl(id, updates) {
    const { data: response } = await api.put(`/department-controls/department/${id}`, updates)
    return response.data || response
  },

  // Population
  async getPopulationData() {
    const { data: response } = await api.get('/population')
    return response.data || {}
  },

  async getDigitalCapability() {
    const { data: response } = await api.get('/population/digital-capability')
    return response.data || {}
  },

  async getTelecomReach() {
    const { data: response } = await api.get('/population/telecom')
    return response.data || {}
  },

  // Tax
  async getTaxData(params = {}) {
    const query = new URLSearchParams(params).toString()
    const { data: response } = await api.get(`/tax${query ? '?' + query : ''}`)
    return response.data || []
  },

  async getTaxStats() {
    const { data: response } = await api.get('/tax/stats')
    return response.data || response
  },

  // Wealth Allocations
  async getAllocations() {
    const { data: response } = await api.get('/allocations')
    return response.data || []
  },

  async getAllocationStats() {
    const { data: response } = await api.get('/allocations/stats')
    return response.data || response
  },

  async createAllocation(data) {
    const { data: response } = await api.post('/allocations', data)
    return response.data || response
  },

  async updateAllocationStatus(id, status) {
    const { data: response } = await api.put(`/allocations/${id}/status`, { status })
    return response.data || response
  },

  // Citizen Tickets
  async getMyTickets() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/tickets`)
    return response.data || []
  },

  async updateTicket(ticketId, updates) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/tickets/${ticketId}`, updates)
    return response.data || response
  },

  // Fayda ID
  async getFaydaId() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/fayda-id`)
    return response.data || response
  },

  async updateFaydaId(data) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/fayda-id`, data)
    return response.data || response
  },

  // Verifications
  async getVerifications() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/verifications`)
    return response.data || []
  },

  async submitVerification(type, fileUrl) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/verifications/${type}/submit`, { fileUrl })
    return response.data || response
  },

  async getVerificationStatus() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/verification-status`)
    return response.data || response
  },

  // TIN / Tax
  async getTin() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/tin`)
    return response.data || response
  },

  async updateTin(tinNumber) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/tin`, { tinNumber })
    return response.data || response
  },

  async getTaxRecords() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/tax-records`)
    return response.data || response
  },

  // Badge
  async getBadge() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/badge`)
    return response.data || response
  },

  // Economy position
  async getEconomyPosition() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/badge`)
    return response.data || response
  },

  // Jobs
  async getJobSuggestions() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/job-suggestions`).catch(() => ({ data: { data: null } }))
    return response.data || null
  },

  async getJobApplications() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/job-applications`).catch(() => ({ data: { data: [] } }))
    return response.data || []
  },

  async applyForJob(jobId, coverLetter) {
    const { data: response } = await api.post(`/jobs/apply`, { jobId, coverLetter })
    return response.data || response
  },

  // Legal Cases
  async getLegalCases() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/legal-cases`)
    return response.data || []
  },

  async createLegalCase(data) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/legal-cases`, data)
    return response.data || response
  },

  async updateLegalCase(id, updates) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/legal-cases/${id}`, updates)
    return response.data || response
  },

  async addCourtDecision(caseId, decision, note) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/legal-cases/${caseId}/decisions`, { decision, note })
    return response.data || response
  },

  async addHearing(caseId, hearingData) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/legal-cases/${caseId}/hearings`, hearingData)
    return response.data || response
  },

  // Proxies
  async getProxies() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/proxies`)
    return response.data || []
  },

  async addProxy(proxyId, type) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/proxies`, { proxyId, type })
    return response.data || response
  },

  async updateProxyStatus(id, status) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/proxies/${id}/status`, { status })
    return response.data || response
  },

  async getAvailableProxies() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/available-proxies`)
    return response.data || []
  },

  // Linked Documents
  async getLinkedDocuments() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/linked-documents`)
    return response.data || []
  },

  async linkDocument(documentId, serviceType) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/linked-documents`, { documentId, serviceType })
    return response.data || response
  },

  async unlinkDocument(id) {
    await api.delete(`${CITIZEN_BASE}/linked-documents/${id}`)
  },

  // Properties
  async getProperties() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/properties`)
    return response.data || []
  },

  async addProperty(data) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/properties`, data)
    return response.data || response
  },

  async updateProperty(id, updates) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/properties/${id}`, updates)
    return response.data || response
  },

  async deleteProperty(id) {
    await api.delete(`${CITIZEN_BASE}/properties/${id}`)
  },

  async estimatePropertyValue(type, size, location) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/properties/estimate`, { type, size, location })
    return response.data || response
  },

  async getPropertyAssetsWorth() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/properties/assets-worth`)
    return response.data || response
  },

  // Vehicles
  async getVehicles() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/vehicles`)
    return response.data || []
  },

  async addVehicle(data) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/vehicles`, data)
    return response.data || response
  },

  async updateVehicle(id, updates) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/vehicles/${id}`, updates)
    return response.data || response
  },

  async deleteVehicle(id) {
    await api.delete(`${CITIZEN_BASE}/vehicles/${id}`)
  },

  async addVehicleDocument(vehicleId, docData) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/vehicles/documents/${vehicleId}`, docData)
    return response.data || response
  },

  // Other Assets
  async getOtherAssets() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/other-assets`)
    return response.data || []
  },

  async addOtherAsset(data) {
    const { data: response } = await api.post(`${CITIZEN_BASE}/other-assets`, data)
    return response.data || response
  },

  async updateOtherAsset(id, updates) {
    const { data: response } = await api.put(`${CITIZEN_BASE}/other-assets/${id}`, updates)
    return response.data || response
  },

  async deleteOtherAsset(id) {
    await api.delete(`${CITIZEN_BASE}/other-assets/${id}`)
  },

  // Available Services
  async getAvailableServices() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/available-services`)
    return response.data || []
  },

  // Trading
  async getTradingAccount() {
    const { data: response } = await api.get('/trading/account')
    return response.data || null
  },

  async createTradingAccount() {
    const { data: response } = await api.post('/trading/account')
    return response.data || response
  },

  async depositTrading(amount) {
    const { data: response } = await api.post('/trading/account/deposit', { amount })
    return response.data || response
  },

  async withdrawTrading(amount) {
    const { data: response } = await api.post('/trading/account/withdraw', { amount })
    return response.data || response
  },

  async getCommodities() {
    const { data: response } = await api.get('/trading/commodities')
    return response.data || []
  },

  async getExchangeRates() {
    const { data: response } = await api.get('/trading/exchange-rates')
    return response.data || []
  },

  async placeOrder(commodityId, type, quantity, price) {
    const { data: response } = await api.post('/trading/orders', { commodityId, type, quantity, price })
    return response.data || response
  },

  async getMyOrders() {
    const { data: response } = await api.get('/trading/orders')
    return response.data || []
  },

  async getPortfolio() {
    const { data: response } = await api.get('/trading/portfolio')
    return response.data || response
  },

  async getAllOrders() {
    const { data: response } = await api.get('/trading/all-orders')
    return response.data || []
  },

  // Banks
  async getBanks() {
    const { data: response } = await api.get('/banks')
    return response.data || []
  },

  async getBankPortfolio() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/bank-portfolio`)
    return response.data || []
  },

  async addBankToPortfolio(bankId, accountType = 'savings', notes = '') {
    const { data: response } = await api.post(`${CITIZEN_BASE}/bank-portfolio`, { bankId, accountType, notes })
    return response.data || response
  },

  async removeBankFromPortfolio(bankId) {
    await api.delete(`${CITIZEN_BASE}/bank-portfolio/${bankId}`)
  },

  async getBankBalance(bankId) {
    const { data: response } = await api.get(`${CITIZEN_BASE}/bank-portfolio/${bankId}/balance`)
    return response.data || { balance: 0, credit: 0, debt: 0, currency: 'ETB' }
  },

  // Business News
  async getBusinessNews() {
    const { data: response } = await api.get('/business-news')
    return response.data || []
  },

  // ─── Fayda OIDC ───
  async getFaydaOidcStatus() {
    const { data: response } = await api.get(`${CITIZEN_BASE}/fayda-oidc`)
    return response.data || null
  },

  async mockLinkFaydaOidc() {
    const { data: response } = await api.post('/fayda/oidc/link')
    return response.data || response
  },

  async unlinkFaydaOidc() {
    await api.delete(`${CITIZEN_BASE}/fayda-oidc`)
  },

  async initiateFaydaOidcAuth() {
    const { data: response } = await api.get('/fayda/auth')
    return response.data || response
  }
}
