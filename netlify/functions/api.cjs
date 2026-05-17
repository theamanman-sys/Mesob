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

    if (method === 'PUT' && p?.startsWith('/citizens/tickets/')) {
      const ticketId = parseInt(p.split('/')[3])
      const idx = (data.tickets || []).findIndex(t => t.id === ticketId && t.citizenId === citizenId)
      if (idx === -1) return respond(404, null, 'Ticket not found')
      if (body.appointmentDate) data.tickets[idx].appointmentDate = body.appointmentDate
      if (body.appointmentTime) data.tickets[idx].appointmentTime = body.appointmentTime
      return respond(200, data.tickets[idx], 'Ticket updated')
    }

    if (method === 'GET' && p === '/tickets') {
      return respond(200, (data.tickets || []).filter(t => t.citizenId === citizenId))
    }

    // ========== CITIZEN APPLICATIONS ==========
    if (method === 'GET' && p === '/citizens/applications') {
      return respond(200, (data.citizenApplications || []).filter(a => a.citizenId === citizenId))
    }

    if (method === 'POST' && p === '/citizens/applications') {
      const citizen = (data.citizens || []).find(c => c.id === citizenId)
      const now = new Date()
      const ticketNumber = 'TKT-' + now.getTime().toString(36).toUpperCase()
      const seq = ((data.citizenApplications || []).length + 1).toString().padStart(4, '0')
      const refNumber = 'APP-' + now.getFullYear() + seq
      const customDate = body.formData?.appointmentDate
      const customTime = body.formData?.appointmentTime
      const apptDate = customDate ? new Date(customDate) : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const app = {
        id: now.getTime().toString(36), citizenId, referenceNumber: refNumber,
        ticketNumber, ...body,
        status: 'submitted', createdAt: now.toISOString(), updatedAt: now.toISOString(),
        timeline: [{ status: 'submitted', date: now.toISOString(), note: 'Application submitted' }]
      }
      if (!data.citizenApplications) data.citizenApplications = []
      data.citizenApplications.push(app)
      const serviceFee = body.serviceId && data.services ? (data.services.find(s => s.id == body.serviceId)?.ServiceFee) : null
      const feeAmount = serviceFee && serviceFee !== '-' ? parseInt(String(serviceFee).replace(/,/g, '')) || 50 : 50
      const ticket = {
        id: now.getTime(), ticketNumber, citizenId,
        citizenName: citizen ? `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() : '',
        serviceId: body.serviceId, serviceTitle: body.serviceTitle,
        department: '', fee: feeAmount,
        timestamp: now.toISOString(),
        appointmentDate: apptDate.toISOString(),
        appointmentTime: customTime || '10:00',
        status: 'active', createdAt: now.toISOString()
      }
      if (!data.tickets) data.tickets = []
      data.tickets.push(ticket)
      return respond(200, { application: app, ticket }, 'Application submitted with ticket')
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

    // ========== NET WORTH ==========
    if (method === 'GET' && p === '/citizens/net-worth') {
      const citizen = (data.citizens || []).find(c => c.id === citizenId)
      let entry = (data.netWorth || []).find(n => n.citizenId === citizenId)
      if (!entry) {
        entry = { id: Date.now(), citizenId, fullName: citizen ? `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() : '', email: citizen?.email || '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date().toISOString(), shareName: !!(citizen?.shareName) }
        if (!data.netWorth) data.netWorth = []
        data.netWorth.push(entry)
      }
      const rankings = [...data.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const rank = rankings.findIndex(n => n.citizenId === citizenId) + 1
      return respond(200, { ...entry, rank, totalParticipants: rankings.length })
    }

    if (method === 'PUT' && p === '/citizens/net-worth') {
      const citizen = (data.citizens || []).find(c => c.id === citizenId)
      let entry = (data.netWorth || []).find(n => n.citizenId === citizenId)
      if (!entry) {
        entry = { id: Date.now(), citizenId, fullName: citizen ? `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() : '', email: citizen?.email || '', netWorth: 0, assets: [], liabilities: [], shareName: !!(citizen?.shareName) }
        if (!data.netWorth) data.netWorth = []
        data.netWorth.push(entry)
      }
      entry.netWorth = body.netWorth ?? entry.netWorth
      entry.assets = body.assets ?? entry.assets
      entry.liabilities = body.liabilities ?? entry.liabilities
      entry.fullName = citizen ? `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() : entry.fullName
      entry.email = citizen?.email || entry.email
      entry.shareName = !!(citizen?.shareName)
      entry.updatedAt = new Date().toISOString()
      const rankings = [...data.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const rank = rankings.findIndex(n => n.citizenId === citizenId) + 1
      return respond(200, { ...entry, rank, totalParticipants: rankings.length }, 'Net worth updated')
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
    if (method === 'GET' && p === '/net-worth/rankings') {
      if (!data.netWorth) data.netWorth = []
      const rankings = [...data.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const anonymized = rankings.map((r, i) => ({
        ...r,
        displayName: r.shareName ? r.fullName : `Citizen #${i + 1}`,
      }))
      return respond(200, anonymized)
    }
    if (method === 'GET' && p === '/contributions') {
      if (!data.contributions) data.contributions = []
      return respond(200, [...data.contributions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    }

    if (method === 'GET' && p === '/contributions/stats') {
      if (!data.contributions) data.contributions = []
      const total = data.contributions.reduce((s, c) => s + (c.amount || 0), 0)
      const byDept = {}
      data.contributions.forEach(c => {
        const dept = c.department || 'Other'
        byDept[dept] = (byDept[dept] || 0) + (c.amount || 0)
      })
      return respond(200, { totalContributions: total, contributionCount: data.contributions.length, byDepartment: byDept })
    }

    if (method === 'POST' && p === '/contributions') {
      const { department, amount, message } = body
      if (!amount || Number(amount) <= 0) return respond(400, null, 'Invalid amount')
      const citizen = (data.citizens || []).find(c => c.id === citizenId)
      let netWorthEntry = (data.netWorth || []).find(n => n.citizenId === citizenId)
      if (!netWorthEntry) {
        netWorthEntry = { id: Date.now(), citizenId, fullName: citizen ? `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() : '', email: citizen?.email || '', netWorth: 0, assets: [], liabilities: [], shareName: false }
        if (!data.netWorth) data.netWorth = []
        data.netWorth.push(netWorthEntry)
      }
      const contributionAmount = Number(amount)
      if (contributionAmount > (netWorthEntry.netWorth || 0)) return respond(400, null, 'Insufficient net worth')
      netWorthEntry.netWorth = (netWorthEntry.netWorth || 0) - contributionAmount
      netWorthEntry.updatedAt = new Date().toISOString()
      const deptName = department || 'General'
      const deptBudget = (data.departmentBudgets || []).find(d => d.departmentName === deptName)
      if (deptBudget) {
        deptBudget.revenueGenerated = (deptBudget.revenueGenerated || 0) + contributionAmount
        deptBudget.remaining = (deptBudget.remaining || 0) + contributionAmount
      }
      const contribution = {
        id: Date.now(), citizenId, citizenName: citizen ? `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() : '',
        department: deptName, amount: contributionAmount, message: message || '', createdAt: new Date().toISOString()
      }
      if (!data.contributions) data.contributions = []
      data.contributions.push(contribution)
      return respond(200, contribution, 'Contribution submitted')
    }

    if (method === 'GET' && p === '/citizens/contributions') {
      if (!data.contributions) data.contributions = []
      return respond(200, data.contributions.filter(c => c.citizenId === citizenId))
    }
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
