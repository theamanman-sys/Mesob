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
    if (p.startsWith(prefix)) {
      p = p.slice(prefix.length) || '/'
      break
    }
  }
  return p
}

exports.handler = async (event) => {
  const method = event.httpMethod
  let p = stripPath(event.path)
  const data = load()

  try {
    // Trading commodities
    if (method === 'GET' && p === '/trading/commodities') {
      return respond(200, data.tradingCommodities || [])
    }

    // Exchange rates
    if (method === 'GET' && p === '/trading/exchange-rates') {
      return respond(200, data.exchangeRates || [])
    }

    // Trading account
    if (p === '/trading/account') {
      if (method === 'GET') return respond(200, (data.tradingAccounts || [])[0] || null)
      if (method === 'POST') {
        const acct = { id: Date.now(), citizenId: 1, accountNumber: 'MES-TRD-' + Math.random().toString(36).toUpperCase().slice(2, 10), balance: 0, portfolioValue: 0, totalReturn: 0, status: 'active', createdAt: new Date().toISOString() }
        if (!data.tradingAccounts) data.tradingAccounts = []
        data.tradingAccounts.push(acct)
        return respond(200, acct, 'Account created')
      }
    }

    // Trading deposit
    if (method === 'POST' && p === '/trading/account/deposit') {
      const { amount } = JSON.parse(event.body || '{}')
      const acct = (data.tradingAccounts || [])[0]
      if (!acct) return respond(404, null, 'No account')
      acct.balance += Number(amount) || 0
      return respond(200, acct, `${amount} ETB deposited`)
    }

    // Trading orders
    if (p === '/trading/orders') {
      if (method === 'GET') return respond(200, (data.tradingOrders || []).filter(o => o.citizenId === 1).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      if (method === 'POST') {
        const body = JSON.parse(event.body || '{}')
        const commodity = (data.tradingCommodities || []).find(c => c.id === body.commodityId)
        if (!commodity) return respond(404, null, 'Commodity not found')
        const acct = (data.tradingAccounts || [])[0]
        if (!acct) return respond(404, null, 'No account')
        const total = body.quantity * body.price
        if (body.type === 'buy' && total > acct.balance) return respond(400, null, 'Insufficient balance')
        const order = { id: Date.now(), citizenId: 1, commodityId: body.commodityId, commodityName: commodity.name, type: body.type, quantity: body.quantity, price: body.price, total, status: 'filled', createdAt: new Date().toISOString() }
        if (!data.tradingOrders) data.tradingOrders = []
        data.tradingOrders.push(order)
        if (body.type === 'buy') { acct.balance -= total; acct.portfolioValue += total } else { acct.balance += total; acct.portfolioValue -= total }
        if (!data.tradingPortfolio) data.tradingPortfolio = []
        let h = data.tradingPortfolio.find(x => x.citizenId === 1 && x.commodityId === body.commodityId)
        if (h) {
          const oldQty = h.quantity
          h.quantity += body.type === 'buy' ? body.quantity : -body.quantity
          h.avgPrice = ((h.avgPrice * oldQty) + (body.price * body.quantity)) / h.quantity
          if (h.quantity <= 0) data.tradingPortfolio = data.tradingPortfolio.filter(x => x.id !== h.id)
        } else if (body.type === 'buy') {
          data.tradingPortfolio.push({ id: Date.now(), citizenId: 1, commodityId: body.commodityId, commodityName: commodity.name, quantity: body.quantity, avgPrice: body.price, currentPrice: commodity.currentPrice })
        }
        acct.totalReturn = data.tradingPortfolio.filter(x => x.citizenId === 1).reduce((s, x) => s + (x.quantity * (x.currentPrice - x.avgPrice)), 0)
        return respond(200, { order, account: acct, portfolio: data.tradingPortfolio.filter(x => x.citizenId === 1) }, 'Order filled')
      }
    }

    // Trading portfolio
    if (method === 'GET' && p === '/trading/portfolio') {
      const portfolio = (data.tradingPortfolio || []).filter(x => x.citizenId === 1)
      const totalValue = portfolio.reduce((s, x) => s + (x.quantity * x.currentPrice), 0)
      const totalCost = portfolio.reduce((s, x) => s + (x.quantity * x.avgPrice), 0)
      return respond(200, { holdings: portfolio, totalValue, totalCost, totalReturn: totalValue - totalCost })
    }

    // Trading all orders
    if (method === 'GET' && p === '/trading/all-orders') {
      return respond(200, (data.tradingOrders || []).slice(-50).reverse())
    }

    // Citizens login
    if (method === 'POST' && p === '/citizens/login') {
      const { email, tin } = JSON.parse(event.body || '{}')
      const citizen = (data.citizens || []).find(c => c.email === email || c.tin === tin)
      if (!citizen) return respond(401, null, 'Invalid credentials')
      return respond(200, { citizen, accessToken: 'mock-citizen-token-' + citizen.id })
    }

    // Citizens google login
    if (method === 'POST' && p === '/citizens/google') {
      const body = JSON.parse(event.body || '{}')
      const payload = JSON.parse(Buffer.from(body.credential.split('.')[1], 'base64').toString())
      let citizen = (data.citizens || []).find(c => c.email === payload.email)
      if (!citizen) {
        citizen = { id: Date.now(), email: payload.email, firstName: payload.given_name, lastName: payload.family_name, picture: payload.picture, tin: '', phone: '', createdAt: new Date().toISOString() }
        if (!data.citizens) data.citizens = []
        data.citizens.push(citizen)
      }
      return respond(200, { citizen, accessToken: 'mock-citizen-token-' + citizen.id })
    }

    // Citizens register
    if (method === 'POST' && p === '/citizens/register') {
      const body = JSON.parse(event.body || '{}')
      const citizen = { id: Date.now(), ...body, createdAt: new Date().toISOString() }
      if (!data.citizens) data.citizens = []
      data.citizens.push(citizen)
      return respond(200, { citizen, accessToken: 'mock-citizen-token-' + citizen.id })
    }

    // Citizen profile
    if (method === 'GET' && p === '/citizens/profile') {
      return respond(200, (data.citizens || [])[0] || null)
    }

    // Citizen dashboard
    if (method === 'GET' && p === '/citizens/dashboard') {
      const citizen = (data.citizens || [])[0] || {}
      return respond(200, { citizen, applicationsCount: (data.citizenApplications || []).length, ticketsCount: (data.tickets || []).length, servicesCount: (data.services || []).length })
    }

    // Citizen applications
    if (p === '/citizens/applications') {
      if (method === 'GET') return respond(200, data.citizenApplications || [])
      if (method === 'POST') {
        const app = { id: Date.now(), citizenId: 1, ...JSON.parse(event.body || '{}'), createdAt: new Date().toISOString() }
        if (!data.citizenApplications) data.citizenApplications = []
        data.citizenApplications.push(app)
        return respond(200, app, 'Application submitted')
      }
    }

    // Services
    if (method === 'GET' && p === '/services') {
      return respond(200, data.services || [])
    }
    if (method === 'GET' && p?.startsWith('/services/')) {
      const id = parseInt(p.split('/')[2])
      return respond(200, (data.services || []).find(s => s.id === id) || null)
    }

    // Tickets
    if (method === 'GET' && p === '/tickets') {
      return respond(200, data.tickets || [])
    }

    // Catch citizens GET routes
    if (method === 'GET' && p?.startsWith('/citizens/')) {
      const key = p.slice(10)
      const collection = data[key] || data[key + 's']
      if (collection) return respond(200, Array.isArray(collection) ? collection : [collection])
    }

    return respond(404, null, 'Not found')
  } catch (err) {
    return respond(500, null, err.message)
  }
}
