require('dotenv').config()

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const MOCK_DB_PATH = path.resolve(process.cwd(), 'mock', 'db.json')
const MONGODB_URI = process.env.MONGODB_URI
const USE_MOCK = !MONGODB_URI || String(process.env.USE_MOCK_DB) === 'true'

function b64Decode(str) {
  const raw = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (raw.length % 4)) % 4
  return Buffer.from(raw + '='.repeat(pad), 'base64').toString('utf-8')
}

function b64Encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function signJwt(citizen) {
  const h = b64Encode({ alg: 'HS256', typ: 'JWT' })
  const p = b64Encode({ sub: citizen.id || citizen._id, email: citizen.email, iat: Date.now() })
  const s = crypto.createHmac('sha256', 'citizen-secret').update(h + '.' + p).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return h + '.' + p + '.' + s
}

function json(code, data, msg) {
  return { statusCode: code, body: JSON.stringify({ data, message: msg || 'Success', success: code < 400 }) }
}

function sendRes(res, result) {
  res.status(result.statusCode).setHeader('Content-Type', 'application/json').setHeader('Cross-Origin-Opener-Policy', 'unsafe-none').send(result.body)
}

function getPath(req) {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/api/, '')
    return pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  } catch { return '' }
}

function bearerToken(req) {
  return (req.headers?.authorization || '').replace(/^Bearer\s+/i, '')
}

function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') try { return JSON.parse(req.body) } catch { return {} }
  if (Buffer.isBuffer(req.body)) try { return JSON.parse(req.body.toString('utf-8')) } catch { return {} }
  return {}
}

function unauth() { return json(401, null, 'Unauthorized') }

function getCitizenId(token) {
  if (token.startsWith('mock-citizen-token-')) {
    const id = parseInt(token.replace(/^mock-citizen-token-/, ''), 10)
    return isNaN(id) ? null : id
  }
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(b64Decode(parts[1]))
      const id = parseInt(payload.sub, 10)
      return isNaN(id) ? null : id
    }
  } catch {}
  return null
}

function loadMockDB() { return JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8')) }
function saveMockDB(db) { try { fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8') } catch (_) {} }

let _mongoConn = null, _mongoDb = null
async function mongo() {
  if (_mongoDb) return _mongoDb
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 })
  await client.connect()
  _mongoConn = client
  _mongoDb = client.db()
  return _mongoDb
}

function safeCitizen(c) { const { password, _id, ...r } = c; return r }

async function requireAuth(req) {
  const token = bearerToken(req)
  const cid = getCitizenId(token)
  if (!cid) return null
  if (USE_MOCK) {
    const citizen = loadMockDB().citizens?.find(c => c.id === cid)
    return citizen || null
  }
  const db = await mongo()
  return db.collection('citizens').findOne({ id: cid })
}

async function handleRoute(method, p, body, req) {
  const data = USE_MOCK ? loadMockDB() : null
  const citizen = await requireAuth(req)
  const citizenId = citizen?.id || null

  // --- PROFILE ---
  if (method === 'PUT' && p === '/citizens/profile' && citizen && USE_MOCK) {
    const idx = data.citizens.findIndex(c => c.id === citizenId)
    if (idx === -1) return json(404, null, 'Not found')
    data.citizens[idx] = { ...data.citizens[idx], ...body }
    saveMockDB(data)
    return json(200, safeCitizen(data.citizens[idx]), 'Profile updated')
  }
  if (method === 'PUT' && p === '/citizens/profile' && citizen && !USE_MOCK) {
    const db = await mongo()
    await db.collection('citizens').updateOne({ id: citizenId }, { $set: body })
    const updated = await db.collection('citizens').findOne({ id: citizenId })
    return json(200, safeCitizen(updated), 'Profile updated')
  }

  // --- APPLICATIONS ---
  if (method === 'GET' && p === '/citizens/applications' && citizen) {
    if (USE_MOCK) return json(200, (data.citizenApplications || []).filter(a => a.citizenId === citizenId))
    const db = await mongo()
    return json(200, await db.collection('citizenApplications').find({ citizenId }).toArray())
  }
  if (method === 'POST' && p === '/citizens/applications' && citizen) {
    const now = new Date()
    const ticketNumber = 'TKT-' + now.getTime().toString(36).toUpperCase()
    const seq = (USE_MOCK ? (data.citizenApplications || []).length : 0) + 1
    const refNumber = 'APP-' + now.getFullYear() + String(seq).padStart(4, '0')
    const customDate = body.formData?.appointmentDate
    const customTime = body.formData?.appointmentTime
    const apptDate = customDate ? new Date(customDate) : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    if (USE_MOCK) {
      if (!data.citizenApplications) data.citizenApplications = []
      const app = { id: now.getTime().toString(36), citizenId, referenceNumber: refNumber, ticketNumber, ...body, status: 'submitted', createdAt: now.toISOString(), updatedAt: now.toISOString(), timeline: [{ status: 'submitted', date: now.toISOString(), note: 'Application submitted' }] }
      data.citizenApplications.push(app)
      const fee = body.serviceId && data.services ? parseInt(String((data.services.find(s => s.id == body.serviceId)?.ServiceFee || '50').replace(/,/g, ''))) || 50 : 50
      if (!data.tickets) data.tickets = []
      const ticket = { id: now.getTime(), ticketNumber, citizenId, citizenName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), serviceId: body.serviceId, serviceTitle: body.serviceTitle, department: '', fee, timestamp: now.toISOString(), appointmentDate: apptDate.toISOString(), appointmentTime: customTime || '10:00', status: 'active', createdAt: now.toISOString() }
      data.tickets.push(ticket)
      saveMockDB(data)
      return json(200, { application: app, ticket }, 'Application submitted with ticket')
    }
    const db = await mongo()
    const app = { citizenId, referenceNumber: refNumber, ticketNumber, serviceId: body.serviceId, serviceTitle: body.serviceTitle, formData: body.formData || {}, documents: body.documents || [], status: 'submitted', createdAt: now, updatedAt: now, timeline: [{ status: 'submitted', date: now, note: 'Application submitted' }] }
    const result = await db.collection('citizenApplications').insertOne(app)
    const fee = 50
    const ticket = { ticketNumber, citizenId, citizenName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), serviceId: body.serviceId, serviceTitle: body.serviceTitle, department: '', fee, timestamp: now, appointmentDate: apptDate, appointmentTime: customTime || '10:00', status: 'active', createdAt: now }
    await db.collection('tickets').insertOne(ticket)
    return json(200, { application: { ...app, _id: result.insertedId }, ticket }, 'Application submitted with ticket')
  }
  if (method === 'PUT' && p?.startsWith('/citizens/applications/') && citizen) {
    const appId = p.split('/')[3]
    if (USE_MOCK) {
      const idx = data.citizenApplications.findIndex(a => a.id == appId && a.citizenId === citizenId)
      if (idx === -1) return json(404, null, 'Not found')
      data.citizenApplications[idx] = { ...data.citizenApplications[idx], ...body, updatedAt: new Date().toISOString() }
      if (!data.citizenApplications[idx].timeline) data.citizenApplications[idx].timeline = []
      data.citizenApplications[idx].timeline.push({ status: 'updated', date: new Date().toISOString(), note: 'Application updated' })
      saveMockDB(data)
      return json(200, data.citizenApplications[idx], 'Application updated')
    }
    const db = await mongo()
    await db.collection('citizenApplications').updateOne({ _id: appId, citizenId }, { $set: { ...body, updatedAt: new Date() } })
    return json(200, null, 'Application updated')
  }
  if (method === 'DELETE' && p?.startsWith('/citizens/applications/') && citizen) {
    const appId = p.split('/')[3]
    if (USE_MOCK) {
      const idx = data.citizenApplications.findIndex(a => a.id == appId && a.citizenId === citizenId)
      if (idx === -1) return json(404, null, 'Not found')
      data.citizenApplications.splice(idx, 1)
      saveMockDB(data)
      return json(200, null, 'Application deleted')
    }
    const db = await mongo()
    await db.collection('citizenApplications').deleteOne({ _id: appId, citizenId })
    return json(200, null, 'Application deleted')
  }

  // --- DOCUMENTS ---
  if (method === 'GET' && p === '/citizens/documents' && citizen) {
    if (USE_MOCK) return json(200, (data.citizenDocuments || []).filter(d => d.citizenId === citizenId))
    const db = await mongo()
    return json(200, await db.collection('citizenDocuments').find({ citizenId }).toArray())
  }
  if (method === 'POST' && p === '/citizens/documents' && citizen) {
    const doc = { id: Date.now(), citizenId, ...body, uploadedAt: new Date().toISOString() }
    if (USE_MOCK) {
      if (!data.citizenDocuments) data.citizenDocuments = []
      data.citizenDocuments.push(doc)
      saveMockDB(data)
      return json(200, doc, 'Document uploaded')
    }
    const db = await mongo()
    await db.collection('citizenDocuments').insertOne(doc)
    return json(200, doc, 'Document uploaded')
  }
  if (method === 'PUT' && p?.startsWith('/citizens/documents/') && citizen) {
    const docId = parseInt(p.split('/')[3])
    if (USE_MOCK) {
      const idx = (data.citizenDocuments || []).findIndex(d => d.id === docId && d.citizenId === citizenId)
      if (idx === -1) return json(404, null, 'Not found')
      data.citizenDocuments[idx] = { ...data.citizenDocuments[idx], ...body }
      saveMockDB(data)
      return json(200, data.citizenDocuments[idx], 'Document updated')
    }
    return json(200, null, 'Document updated')
  }
  if (method === 'DELETE' && p?.startsWith('/citizens/documents/') && citizen) {
    const docId = parseInt(p.split('/')[3])
    if (USE_MOCK) {
      const idx = (data.citizenDocuments || []).findIndex(d => d.id === docId && d.citizenId === citizenId)
      if (idx === -1) return json(404, null, 'Not found')
      data.citizenDocuments.splice(idx, 1)
      saveMockDB(data)
      return json(200, null, 'Document deleted')
    }
    return json(200, null, 'Document deleted')
  }

  // --- TICKETS ---
  if (method === 'GET' && p === '/citizens/tickets' && citizen) {
    if (USE_MOCK) return json(200, (data.tickets || []).filter(t => t.citizenId === citizenId))
    const db = await mongo()
    return json(200, await db.collection('tickets').find({ citizenId }).sort({ createdAt: -1 }).toArray())
  }
  if (method === 'PUT' && p?.startsWith('/citizens/tickets/') && citizen) {
    const ticketId = parseInt(p.split('/')[3])
    if (USE_MOCK) {
      const idx = (data.tickets || []).findIndex(t => t.id === ticketId && t.citizenId === citizenId)
      if (idx === -1) return json(404, null, 'Ticket not found')
      if (body.appointmentDate) data.tickets[idx].appointmentDate = body.appointmentDate
      if (body.appointmentTime) data.tickets[idx].appointmentTime = body.appointmentTime
      saveMockDB(data)
      return json(200, data.tickets[idx], 'Ticket updated')
    }
    return json(200, null, 'Ticket updated')
  }
  if (method === 'GET' && p === '/tickets') {
    if (USE_MOCK) return json(200, (data.tickets || []).filter(t => t.citizenId === citizenId))
    const db = await mongo()
    return json(200, await db.collection('tickets').find().toArray())
  }
  if (method === 'GET' && p === '/tickets/stats') {
    if (USE_MOCK) return json(200, { total: (data.tickets || []).length })
    const db = await mongo()
    const count = await db.collection('tickets').countDocuments()
    return json(200, { total: count })
  }

  // --- NET WORTH ---
  if (method === 'GET' && p === '/citizens/net-worth' && citizen) {
    if (USE_MOCK) {
      let entry = (data.netWorth || []).find(n => n.citizenId === citizenId)
      if (!entry) {
        if (!data.netWorth) data.netWorth = []
        entry = { id: Date.now(), citizenId, fullName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), email: citizen?.email || '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date().toISOString(), shareName: !!citizen?.shareName }
        data.netWorth.push(entry)
        saveMockDB(data)
      }
      const rankings = [...data.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const rank = rankings.findIndex(n => n.citizenId === citizenId) + 1
      return json(200, { ...entry, rank, totalParticipants: rankings.length })
    }
    const db = await mongo()
    let entry = await db.collection('netWorth').findOne({ citizenId })
    if (!entry) {
      entry = { citizenId, fullName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), email: citizen?.email || '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date(), shareName: false }
      await db.collection('netWorth').insertOne(entry)
    }
    const all = await db.collection('netWorth').find().sort({ netWorth: -1 }).toArray()
    const rank = all.findIndex(n => n.citizenId === citizenId) + 1
    return json(200, { ...entry, rank, totalParticipants: all.length })
  }
  if (method === 'PUT' && p === '/citizens/net-worth' && citizen) {
    if (USE_MOCK) {
      let entry = (data.netWorth || []).find(n => n.citizenId === citizenId)
      if (!entry) {
        if (!data.netWorth) data.netWorth = []
        entry = { id: Date.now(), citizenId, fullName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), email: citizen?.email || '', netWorth: 0, assets: [], liabilities: [], shareName: !!citizen?.shareName }
        data.netWorth.push(entry)
      }
      entry.netWorth = body.netWorth ?? entry.netWorth
      entry.assets = body.assets ?? entry.assets
      entry.liabilities = body.liabilities ?? entry.liabilities
      entry.updatedAt = new Date().toISOString()
      const rankings = [...data.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const rank = rankings.findIndex(n => n.citizenId === citizenId) + 1
      saveMockDB(data)
      return json(200, { ...entry, rank, totalParticipants: rankings.length }, 'Net worth updated')
    }
    const db = await mongo()
    await db.collection('netWorth').updateOne({ citizenId }, { $set: { netWorth: body.netWorth, assets: body.assets, liabilities: body.liabilities, updatedAt: new Date() } })
    return json(200, null, 'Net worth updated')
  }
  if (method === 'GET' && p === '/net-worth/rankings') {
    if (USE_MOCK) {
      if (!data.netWorth) data.netWorth = []
      const rankings = [...data.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const anonymized = rankings.map((r, i) => ({ ...r, displayName: r.shareName ? r.fullName : `Citizen #${i + 1}` }))
      return json(200, anonymized)
    }
    const db = await mongo()
    const all = await db.collection('netWorth').find().sort({ netWorth: -1 }).toArray()
    const anonymized = all.map((r, i) => ({ ...r, displayName: r.shareName ? r.fullName : `Citizen #${i + 1}` }))
    return json(200, anonymized)
  }

  // --- CONTRIBUTIONS ---
  if (method === 'GET' && p === '/contributions') {
    if (USE_MOCK) return json(200, (data.contributions || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    const db = await mongo()
    return json(200, await db.collection('contributions').find().sort({ createdAt: -1 }).toArray())
  }
  if (method === 'GET' && p === '/contributions/stats') {
    if (USE_MOCK) {
      if (!data.contributions) data.contributions = []
      const total = data.contributions.reduce((s, c) => s + (c.amount || 0), 0)
      const byDept = {}
      data.contributions.forEach(c => { const d = c.department || 'Other'; byDept[d] = (byDept[d] || 0) + (c.amount || 0) })
      return json(200, { totalContributions: total, contributionCount: data.contributions.length, byDepartment: byDept })
    }
    return json(200, { totalContributions: 0, contributionCount: 0, byDepartment: {} })
  }
  if (method === 'POST' && p === '/contributions' && citizen) {
    const { department, amount, message } = body
    if (!amount || Number(amount) <= 0) return json(400, null, 'Invalid amount')
    const contributionAmount = Number(amount)
    if (USE_MOCK) {
      let nw = (data.netWorth || []).find(n => n.citizenId === citizenId)
      if (!nw) { nw = { id: Date.now(), citizenId, netWorth: 0 }; if (!data.netWorth) data.netWorth = []; data.netWorth.push(nw) }
      if (contributionAmount > (nw.netWorth || 0)) return json(400, null, 'Insufficient net worth')
      nw.netWorth = (nw.netWorth || 0) - contributionAmount
      nw.updatedAt = new Date().toISOString()
      const deptName = department || 'General'
      const deptBudget = (data.departmentBudgets || []).find(d => d.departmentName === deptName)
      if (deptBudget) { deptBudget.revenueGenerated = (deptBudget.revenueGenerated || 0) + contributionAmount; deptBudget.remaining = (deptBudget.remaining || 0) + contributionAmount }
      if (!data.contributions) data.contributions = []
      const contribution = { id: Date.now(), citizenId, citizenName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), department: deptName, amount: contributionAmount, message: message || '', createdAt: new Date().toISOString() }
      data.contributions.push(contribution)
      saveMockDB(data)
      return json(200, contribution, 'Contribution submitted')
    }
    return json(200, { amount: contributionAmount }, 'Contribution submitted')
  }
  if (method === 'GET' && p === '/citizens/contributions' && citizen) {
    if (USE_MOCK) return json(200, (data.contributions || []).filter(c => c.citizenId === citizenId))
    return json(200, [])
  }

  // --- DASHBOARD ---
  if (method === 'GET' && p === '/citizens/dashboard' && citizen) {
    if (USE_MOCK) return json(200, { citizen: safeCitizen(citizen), applicationsCount: (data.citizenApplications || []).filter(a => a.citizenId === citizenId).length, ticketsCount: (data.tickets || []).filter(t => t.citizenId === citizenId).length, servicesCount: (data.services || []).length })
    return json(200, { citizen: safeCitizen(citizen) })
  }

  // --- BANK PORTFOLIO ---
  if (method === 'GET' && p === '/citizens/bank-portfolio' && citizen) {
    if (USE_MOCK) return json(200, (data.citizenBankPortfolio || []).filter(b => b.citizenId === citizenId))
    return json(200, [])
  }

  // --- SERVICES / PUBLIC ---
  if (method === 'GET' && p === '/services') {
    if (USE_MOCK) return json(200, data.services || [])
    return json(200, [])
  }
  if (method === 'GET' && p?.startsWith('/services/') && USE_MOCK) {
    const id = parseInt(p.split('/')[2])
    return json(200, (data.services || []).find(s => s.id === id) || null)
  }
  if (method === 'GET' && p === '/banks') {
    if (USE_MOCK) return json(200, data.banks || [])
    return json(200, [])
  }
  if (method === 'GET' && p === '/economy') {
    if (USE_MOCK) return json(200, data.economyData || [])
    return json(200, {})
  }
  if (method === 'GET' && p === '/business-news') {
    if (USE_MOCK) return json(200, data.cachedBusinessNews || [])
    return json(200, [])
  }

  // --- OTHER CITIZEN COLLECTIONS (catch-all) ---
  if (method === 'GET' && citizen && p?.startsWith('/citizens/')) {
    const key = p.slice(10).replace(/-/g, '')
    const possibleKeys = [key, key + 's', key.replace(/s$/, '')]
    if (USE_MOCK) {
      for (const k of possibleKeys) {
        if (Array.isArray(data[k])) return json(200, data[k].filter(item => item.citizenId === citizenId))
      }
    }
  }

  return json(404, null, 'Not found')
}

module.exports = async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none')

  if (request.method === 'OPTIONS') return response.status(204).end()

  const p = getPath(request)
  const body = parseBody(request)

  try {
    if (request.method === 'POST' && p === '/citizens/register')
      return sendRes(response, await doRegister(body))

    if (request.method === 'POST' && p === '/citizens/login')
      return sendRes(response, await doLogin(body))

    if (request.method === 'POST' && p === '/citizens/google')
      return sendRes(response, await doGoogleLogin(body))

    if (request.method === 'GET' && p === '/citizens/session')
      return sendRes(response, await doSession(request))

    const result = await handleRoute(request.method, p, body, request)
    return sendRes(response, result)
  } catch (err) {
    console.error('[Citizens API]', err.message || err)
    response.status(500).setHeader('Content-Type', 'application/json').send(
      JSON.stringify({ data: null, message: err.message || 'Server Error', success: false })
    )
  }
}

async function doRegister(body) {
  const { firstName, lastName, email, phone, idNumber, password } = body
  if (!email) return json(400, null, 'Email required')

  if (USE_MOCK) {
    const db = loadMockDB()
    db.citizens = db.citizens || []
    if (db.citizens.find((c) => c.email === email)) return json(400, null, 'Email already registered')
    if (idNumber && db.citizens.find((c) => c.idNumber === idNumber)) return json(400, null, 'ID already registered')
    const id = db.citizens.length + 1
    const citizen = { userId: id, id, firstName, lastName, email, phone: phone || '', idNumber: idNumber || '', password: password || '', picture: '', googleId: null, googleData: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active' }
    db.citizens.push(citizen)
    saveMockDB(db)
    return json(200, { citizen: safeCitizen(citizen), accessToken: signJwt(citizen) }, 'Registration successful')
  }

  const db = await mongo()
  const coll = db.collection('citizens')
  if (await coll.findOne({ email })) return json(400, null, 'Email already registered')
  if (idNumber && await coll.findOne({ idNumber })) return json(400, null, 'ID already registered')
  const newId = (await coll.countDocuments()) + 1
  const doc = { _id: String(newId), id: newId, userId: newId, firstName, lastName, email, phone: phone || '', idNumber: idNumber || '', password: password || '', picture: '', googleId: null, googleData: null, createdAt: new Date(), updatedAt: new Date(), status: 'active' }
  await coll.insertOne(doc)
  return json(200, { citizen: safeCitizen(doc), accessToken: signJwt(doc) }, 'Registration successful')
}

async function doLogin(body) {
  const { identifier, password: pwd } = body
  if (!identifier || !pwd) return json(400, null, 'Identifier and password required')

  if (USE_MOCK) {
    const db = loadMockDB()
    const citizen = (db.citizens || []).find((c) => c.email === identifier || c.idNumber === identifier)
    if (!citizen || citizen.password !== pwd) return json(401, null, 'Invalid credentials')
    return json(200, { citizen: safeCitizen(citizen), accessToken: signJwt(citizen) }, 'Login successful')
  }

  const db = await mongo()
  const citizen = await db.collection('citizens').findOne({ $or: [{ email: identifier }, { idNumber: identifier }] })
  if (!citizen || citizen.password !== pwd) return json(401, null, 'Invalid credentials')
  return json(200, { citizen: safeCitizen(citizen), accessToken: signJwt(citizen) }, 'Login successful')
}

async function doGoogleLogin(body) {
  const { credential } = body
  if (!credential) return json(400, null, 'Credential required')
  let payload
  try {
    payload = JSON.parse(b64Decode(credential.split('.')[1]))
  } catch {
    return json(400, null, 'Invalid credential')
  }

  const googleInfo = {
    googleId: payload.sub,
    googleData: { sub: payload.sub, email: payload.email, email_verified: payload.email_verified, name: payload.name, given_name: payload.given_name, family_name: payload.family_name, picture: payload.picture, locale: payload.locale },
  }

  if (USE_MOCK) {
    const db = loadMockDB()
    let citizen = (db.citizens || []).find((c) => c.email === payload.email)
    if (citizen) {
      Object.assign(citizen, { firstName: payload.given_name || citizen.firstName, lastName: payload.family_name || citizen.lastName, picture: payload.picture || citizen.picture, ...googleInfo, updatedAt: new Date().toISOString() })
    } else {
      const newId = (db.citizens || []).length + 1
      citizen = { id: newId, userId: newId, firstName: payload.given_name || '', lastName: payload.family_name || '', email: payload.email, phone: '', idNumber: '', password: '', picture: payload.picture || '', ...googleInfo, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active' }
      db.citizens = db.citizens || []
      db.citizens.push(citizen)
    }
    saveMockDB(db)
    const { password: _, ...safe } = citizen
    return json(200, { citizen: safe, accessToken: signJwt(citizen) }, 'Login successful')
  }

  const db = await mongo()
  const coll = db.collection('citizens')
  let citizen = await coll.findOne({ email: payload.email })
  if (citizen) {
    await coll.updateOne({ _id: citizen._id }, { $set: { firstName: payload.given_name || citizen.firstName, lastName: payload.family_name || citizen.lastName, picture: payload.picture || citizen.picture, ...googleInfo, updatedAt: new Date() } })
  } else {
    const newId = (await coll.countDocuments()) + 1
    citizen = { _id: String(newId), id: newId, userId: newId, firstName: payload.given_name || '', lastName: payload.family_name || '', email: payload.email, phone: '', idNumber: '', password: '', picture: payload.picture || '', ...googleInfo, createdAt: new Date(), updatedAt: new Date(), status: 'active' }
    await coll.insertOne(citizen)
  }
  const safe = safeCitizen(citizen)
  return json(200, { citizen: safe, accessToken: signJwt(citizen) }, 'Login successful')
}

async function doSession(req) {
  const token = bearerToken(req)
  const cid = getCitizenId(token)
  if (!cid) return unauth()
  if (USE_MOCK) {
    const citizen = loadMockDB().citizens?.find((c) => c.id === cid)
    if (!citizen) return unauth()
    return json(200, safeCitizen(citizen))
  }
  const db = await mongo()
  const citizen = await db.collection('citizens').findOne({ id: cid })
  if (!citizen) return unauth()
  return json(200, safeCitizen(citizen))
}
