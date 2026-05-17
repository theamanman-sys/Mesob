const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DB_PATH = path.resolve(__dirname, '..', '..', 'mock', 'db.json')
let db = null

function load() {
  if (!db) db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  return db
}

function respond(status, data, msg = 'Success') {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Cross-Origin-Opener-Policy': 'unsafe-none' },
    body: JSON.stringify({ data, message: msg, success: status < 400 }),
  }
}

function stripPath(p) {
  for (const prefix of ['/.netlify/functions/api', '/api']) {
    if (p.startsWith(prefix)) { p = p.slice(prefix.length) || '/'; break }
  }
  return p
}

function getCitizenId(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const token = auth.replace('Bearer ', '')
  if (token.startsWith('mock-citizen-token-')) {
    return parseInt(token.replace('mock-citizen-token-', ''))
  }
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      return parseInt(payload.sub || payload.id)
    }
  } catch {}
  return null
}

function requireAuth(event) {
  const cid = getCitizenId(event)
  if (!cid) return null
  return cid
}

exports.handler = async (event) => {
  const method = event.httpMethod
  const p = stripPath(event.path)
  const data = load()
  const body = event.body ? JSON.parse(event.body) : {}

  try {
    // ========== AUTH ==========
    if (method === 'POST' && p === '/citizens/login') {
      const { identifier, password } = body
      const citizen = (data.citizens || []).find(c => (c.email === identifier || c.idNumber === identifier))
      if (!citizen) return respond(401, null, 'Invalid credentials')
      return respond(200, { citizen, accessToken: 'mock-citizen-token-' + citizen.id })
    }

    if (method === 'POST' && p === '/citizens/google') {
      const payload = JSON.parse(Buffer.from(body.credential.split('.')[1], 'base64').toString())
      let citizen = (data.citizens || []).find(c => c.email === payload.email)
      if (!citizen) {
        citizen = { id: Date.now(), email: payload.email, firstName: payload.given_name, lastName: payload.family_name, picture: payload.picture, tin: '', phone: '', idNumber: '', createdAt: new Date().toISOString() }
        if (!data.citizens) data.citizens = []
        data.citizens.push(citizen)
      }
      return respond(200, { citizen, accessToken: 'mock-citizen-token-' + citizen.id })
    }

    if (method === 'POST' && p === '/citizens/register') {
      const citizen = { id: Date.now(), ...body, createdAt: new Date().toISOString() }
      if (!data.citizens) data.citizens = []
      data.citizens.push(citizen)
      return respond(200, { citizen, accessToken: 'mock-citizen-token-' + citizen.id })
    }

    // ========== CITIZEN PROFILE (require auth) ==========
    const citizenId = requireAuth(event)
    if (!citizenId && p.startsWith('/citizens/') && !['/citizens/login', '/citizens/google', '/citizens/register'].includes(p)) {
      return respond(401, null, 'Unauthorized')
    }

    if (method === 'GET' && p === '/citizens/session') {
      return respond(200, (data.citizens || []).find(c => c.id === citizenId) || null)
    }

    if (method === 'PUT' && p === '/citizens/profile') {
      const idx = (data.citizens || []).findIndex(c => c.id === citizenId)
      if (idx === -1) return respond(404, null, 'Not found')
      data.citizens[idx] = { ...data.citizens[idx], ...body }
      return respond(200, data.citizens[idx], 'Profile updated')
    }

    // ========== CITIZEN TICKETS ==========
    if (method === 'GET' && p === '/citizens/tickets') {
      return respond(200, (data.tickets || []).filter(t => t.citizenId === citizenId))
    }

    if (method === 'GET' && p === '/tickets') {
      return respond(200, (data.tickets || []).filter(t => t.citizenId === citizenId))
    }

    // ========== CITIZEN APPLICATIONS ==========
    if (method === 'GET' && p === '/citizens/applications') {
      return respond(200, (data.citizenApplications || []).filter(a => a.citizenId === citizenId))
    }

    if (method === 'POST' && p === '/citizens/applications') {
      const app = { id: Date.now(), citizenId, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      if (!data.citizenApplications) data.citizenApplications = []
      data.citizenApplications.push(app)
      return respond(200, app, 'Application submitted')
    }

    if (method === 'PUT' && p?.startsWith('/citizens/applications/')) {
      const appId = p.split('/')[3]
      const idx = (data.citizenApplications || []).findIndex(a => a.id == appId && a.citizenId === citizenId)
      if (idx === -1) return respond(404, null, 'Not found')
      data.citizenApplications[idx] = { ...data.citizenApplications[idx], ...body, updatedAt: new Date().toISOString() }
      return respond(200, data.citizenApplications[idx], 'Application updated')
    }

    if (method === 'DELETE' && p?.startsWith('/citizens/applications/')) {
      const appId = p.split('/')[3]
      const idx = (data.citizenApplications || []).findIndex(a => a.id == appId && a.citizenId === citizenId)
      if (idx === -1) return respond(404, null, 'Not found')
      data.citizenApplications.splice(idx, 1)
      return respond(200, null, 'Application deleted')
    }

    // ========== CITIZEN DOCUMENTS ==========
    if (method === 'GET' && p === '/citizens/documents') {
      return respond(200, (data.citizenDocuments || []).filter(d => d.citizenId === citizenId))
    }

    if (method === 'POST' && p === '/citizens/documents') {
      const doc = { id: Date.now(), citizenId, ...body, uploadedAt: new Date().toISOString() }
      if (!data.citizenDocuments) data.citizenDocuments = []
      data.citizenDocuments.push(doc)
      return respond(200, doc, 'Document uploaded')
    }

    if (method === 'DELETE' && p?.startsWith('/citizens/documents/')) {
      const docId = p.split('/')[3]
      const idx = (data.citizenDocuments || []).findIndex(d => d.id == docId && d.citizenId === citizenId)
      if (idx === -1) return respond(404, null, 'Not found')
      data.citizenDocuments.splice(idx, 1)
      return respond(200, null, 'Document deleted')
    }

    if (method === 'PUT' && p?.startsWith('/citizens/documents/')) {
      const docId = p.split('/')[3]
      const idx = (data.citizenDocuments || []).findIndex(d => d.id == docId && d.citizenId === citizenId)
      if (idx === -1) return respond(404, null, 'Not found')
      data.citizenDocuments[idx] = { ...data.citizenDocuments[idx], ...body }
      return respond(200, data.citizenDocuments[idx], 'Document updated')
    }

    // ========== CITIZEN DASHBOARD ==========
    if (method === 'GET' && p === '/citizens/dashboard') {
      const citizen = (data.citizens || []).find(c => c.id === citizenId) || {}
      return respond(200, {
        citizen,
        applicationsCount: (data.citizenApplications || []).filter(a => a.citizenId === citizenId).length,
        ticketsCount: (data.tickets || []).filter(t => t.citizenId === citizenId).length,
        servicesCount: (data.services || []).length,
      })
    }

    // ========== OTHER CITIZEN COLLECTIONS ==========
    if (method === 'GET' && p?.startsWith('/citizens/')) {
      const key = p.slice(10) // e.g. "net-worth" from "/citizens/net-worth"
      const collectionKey = key.replace(/-/g, '')
      // Try plural forms
      const possibleKeys = [key, key + 's', collectionKey, collectionKey + 's', key.replace(/s$/, '')]
      let collection = null
      for (const k of possibleKeys) {
        if (Array.isArray(data[k])) { collection = data[k]; break }
      }
      if (collection) {
        return respond(200, collection.filter(item => item.citizenId === citizenId))
      }
    }

    // ========== TRADING ==========
    if (method === 'GET' && p === '/trading/commodities') {
      return respond(200, data.tradingCommodities || [])
    }

    if (method === 'GET' && p === '/trading/exchange-rates') {
      return respond(200, data.exchangeRates || [])
    }

    if (p === '/trading/account') {
      if (method === 'GET') return respond(200, (data.tradingAccounts || []).find(a => a.citizenId === citizenId) || null)
      if (method === 'POST') {
        const acct = { id: Date.now(), citizenId, accountNumber: 'MES-TRD-' + crypto.randomBytes(4).toString('hex').toUpperCase(), balance: 0, portfolioValue: 0, totalReturn: 0, status: 'active', createdAt: new Date().toISOString() }
        if (!data.tradingAccounts) data.tradingAccounts = []
        data.tradingAccounts.push(acct)
        return respond(200, acct, 'Account created')
      }
    }

    if (method === 'POST' && p === '/trading/account/deposit') {
      const acct = (data.tradingAccounts || []).find(a => a.citizenId === citizenId)
      if (!acct) return respond(404, null, 'No account')
      acct.balance += Number(body.amount) || 0
      return respond(200, acct, `${body.amount} ETB deposited`)
    }

    if (p === '/trading/orders') {
      if (method === 'GET') return respond(200, (data.tradingOrders || []).filter(o => o.citizenId === citizenId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      if (method === 'POST') {
        const commodity = (data.tradingCommodities || []).find(c => c.id === body.commodityId)
        if (!commodity) return respond(404, null, 'Commodity not found')
        const acct = (data.tradingAccounts || []).find(a => a.citizenId === citizenId)
        if (!acct) return respond(404, null, 'No account')
        const total = body.quantity * body.price
        if (body.type === 'buy' && total > acct.balance) return respond(400, null, 'Insufficient balance')
        const order = { id: Date.now(), citizenId, commodityId: body.commodityId, commodityName: commodity.name, type: body.type, quantity: body.quantity, price: body.price, total, status: 'filled', createdAt: new Date().toISOString() }
        if (!data.tradingOrders) data.tradingOrders = []
        data.tradingOrders.push(order)
        if (body.type === 'buy') { acct.balance -= total; acct.portfolioValue += total } else { acct.balance += total; acct.portfolioValue -= total }
        if (!data.tradingPortfolio) data.tradingPortfolio = []
        let h = data.tradingPortfolio.find(x => x.citizenId === citizenId && x.commodityId === body.commodityId)
        if (h) {
          const oldQty = h.quantity
          h.quantity += body.type === 'buy' ? body.quantity : -body.quantity
          h.avgPrice = oldQty > 0 ? ((h.avgPrice * oldQty) + (body.price * body.quantity)) / h.quantity : body.price
          if (h.quantity <= 0) data.tradingPortfolio = data.tradingPortfolio.filter(x => x.id !== h.id)
        } else if (body.type === 'buy') {
          data.tradingPortfolio.push({ id: Date.now(), citizenId, commodityId: body.commodityId, commodityName: commodity.name, quantity: body.quantity, avgPrice: body.price, currentPrice: commodity.currentPrice })
        }
        acct.totalReturn = data.tradingPortfolio.filter(x => x.citizenId === citizenId).reduce((s, x) => s + (x.quantity * (x.currentPrice - x.avgPrice)), 0)
        return respond(200, { order, account: acct, portfolio: data.tradingPortfolio.filter(x => x.citizenId === citizenId) }, 'Order filled')
      }
    }

    if (method === 'GET' && p === '/trading/portfolio') {
      const portfolio = (data.tradingPortfolio || []).filter(x => x.citizenId === citizenId)
      const totalValue = portfolio.reduce((s, x) => s + (x.quantity * x.currentPrice), 0)
      const totalCost = portfolio.reduce((s, x) => s + (x.quantity * x.avgPrice), 0)
      return respond(200, { holdings: portfolio, totalValue, totalCost, totalReturn: totalValue - totalCost })
    }

    if (method === 'GET' && p === '/trading/all-orders') {
      return respond(200, (data.tradingOrders || []).slice(-50).reverse())
    }

    // ========== PUBLIC ROUTES ==========
    if (method === 'GET' && p === '/services') return respond(200, data.services || [])
    if (method === 'GET' && p?.startsWith('/services/')) {
      const id = parseInt(p.split('/')[2])
      return respond(200, (data.services || []).find(s => s.id === id) || null)
    }

    if (method === 'GET' && p === '/banks') return respond(200, data.banks || [])
    if (method === 'GET' && p === '/economy') return respond(200, data.economyData || [])
    if (method === 'GET' && p === '/business-news') return respond(200, data.cachedBusinessNews || [])
    if (method === 'GET' && p === '/net-worth/rankings') return respond(200, data.netWorth || [])
    if (method === 'GET' && p === '/contributions/stats') return respond(200, data.contributions || [])
    if (method === 'GET' && p === '/tickets/stats') return respond(200, { total: (data.tickets || []).length })

    // ========== BANKS ==========
    if (method === 'GET' && p === '/citizens/bank-portfolio') {
      return respond(200, (data.citizenBankPortfolio || []).filter(b => b.citizenId === citizenId))
    }

    return respond(404, null, 'Not found')
  } catch (err) {
    return respond(500, null, err.message)
  }
}
