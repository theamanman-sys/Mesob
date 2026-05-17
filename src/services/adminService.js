import api from './api'

const fetchJson = async (url) => {
  try {
    const res = await fetch(url)
    return await res.json()
  } catch { return null }
}

export const adminService = {
  async getDashboardData() {
    const [budgetsRes, overviewRes, economyRes, taxStatsRes, ticketStatsRes, popRes, contribRes] = await Promise.all([
      api.get('/budgets').catch(() => ({ data: { data: [] } })),
      api.get('/budgets/overview').catch(() => ({ data: { data: {} } })),
      api.get('/economy').catch(() => ({ data: { data: {} } })),
      api.get('/tax/stats').catch(() => ({ data: { data: {} } })),
      api.get('/tickets/stats').catch(() => ({ data: { data: {} } })),
      api.get('/population').catch(() => ({ data: { data: {} } })),
      api.get('/contributions/stats').catch(() => ({ data: { data: {} } })),
    ])

    return {
      budgets: budgetsRes.data.data || [],
      overview: overviewRes.data.data || {},
      economy: economyRes.data.data || {},
      taxStats: taxStatsRes.data.data || {},
      ticketStats: ticketStatsRes.data.data || {},
      population: popRes.data.data || {},
      contributions: contribRes.data.data || {},
    }
  },

  async getEthiopiaNews() {
    try {
      const { data } = await api.get('/dashboard/news')
      return data.data || []
    } catch { return [] }
  },

  async getCachedNews() {
    try {
      const { data } = await api.get('/news/ethiopia')
      return data.data || []
    } catch { return [] }
  },

  async getVideos() {
    try {
      const { data } = await api.get('/news/videos')
      return data.data || []
    } catch { return [] }
  },

  async fetchNewsFromRss() {
    try {
      const rssUrl = encodeURIComponent(
        'https://news.google.com/rss/search?q=Ethiopia+government+digital+economy&hl=en-US&gl=US&ceid=US:en'
      )
      const json = await fetchJson(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`)
      if (json?.items?.length) {
        return json.items.slice(0, 10).map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          description: item.description?.replace(/<[^>]*>/g, '').substring(0, 300) || '',
          source: item.author || 'Google News',
          image: item.thumbnail || item.enclosure?.link || ''
        }))
      }
    } catch { /* fallback */ }
    return this.getCachedNews()
  },

  // APISIX Admin API
  async getApisixRoutes() {
    const { data } = await api.get('/apisix/routes').catch(() => ({ data: { data: { list: [] } } }))
    return data.data?.list || []
  },

  async getApisixUpstreams() {
    const { data } = await api.get('/apisix/upstreams').catch(() => ({ data: { data: { list: [] } } }))
    return data.data?.list || []
  },

  async getApisixDashboard() {
    const { data } = await api.get('/apisix/dashboard').catch(() => ({ data: { data: {} } }))
    return data.data || {}
  },

  async getApisixPlugins() {
    const { data } = await api.get('/apisix/plugins').catch(() => ({ data: { data: { list: [] } } }))
    return data.data?.list || []
  },

  async getApisixConsumers() {
    const { data } = await api.get('/apisix/consumers').catch(() => ({ data: { data: { list: [] } } }))
    return data.data?.list || []
  },

  // Verified users stats
  async getVerifiedStats() {
    const { data } = await api.get('/admin/verified-stats').catch(() => ({ data: { data: {} } }))
    return data.data || {}
  },

  async getVerifications() {
    const { data } = await api.get('/admin/verifications').catch(() => ({ data: { data: [] } }))
    return data.data || []
  },

  async updateVerification(id, body) {
    const { data } = await api.put(`/admin/verifications/${id}`, body).catch(() => ({ data: { data: {} } }))
    return data.data || {}
  },

  async getCitizenUsers() {
    const { data } = await api.get('/admin/users').catch(() => ({ data: { data: [] } }))
    return data.data || []
  },

  async updateUserBadge(userId, body) {
    const { data } = await api.put(`/admin/users/${userId}/badge`, body).catch(() => ({ data: { data: {} } }))
    return data.data || {}
  },

  async updateCitizenUser(userId, body) {
    const { data } = await api.put(`/admin/users/${userId}`, body).catch(() => ({ data: { data: {} } }))
    return data.data || {}
  },

  async deleteCitizenUser(userId) {
    await api.delete(`/admin/users/${userId}`).catch(() => {})
  }
}
