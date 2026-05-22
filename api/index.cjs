const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const MONGODB_URI = process.env.MONGODB_URI

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '684481615293-5ah46hm3dccnfbqj4rbuga2knpvtevma.apps.googleusercontent.com'

function b64Decode(str) {
  const raw = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (raw.length % 4)) % 4
  return Buffer.from(raw + '='.repeat(pad), 'base64').toString('utf-8')
}

function b64Encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64UrlDecode(str) {
  const raw = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (raw.length % 4)) % 4
  return Buffer.from(raw + '='.repeat(pad), 'base64').toString('utf-8')
}

async function verifyGoogleToken(credential) {
  const parts = credential.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT format')

  const payload = JSON.parse(b64UrlDecode(parts[1]))

  const exp = payload.exp
  if (exp && Date.now() / 1000 > exp) {
    throw new Error('Token expired')
  }

  const iss = payload.iss
  if (iss !== 'https://accounts.google.com' && iss !== 'accounts.google.com') {
    throw new Error('Invalid token issuer')
  }

  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Token audience mismatch')
  }

  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${encodeURIComponent(credential)}`)
    if (!res.ok) throw new Error('Google token verification failed')
    const verified = await res.json()
    if (verified.aud !== GOOGLE_CLIENT_ID) throw new Error('Token audience mismatch')
    return verified
  } catch (err) {
    if (err.message === 'Token expired' || err.message === 'Invalid token issuer' || err.message === 'Token audience mismatch') throw err
    return payload
  }
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
    const original = req.headers['x-vercel-rewrite-original-url'] || req.url
    const pathname = new URL(original, 'http://localhost').pathname.replace(/^\/api/, '')
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

/* ─── Fayda OIDC Config ─── */
const FAYDA_OIDC = {
  authEndpoint: process.env.FAYDA_AUTH_ENDPOINT || 'https://fayda.et/oauth/authorize',
  tokenEndpoint: process.env.FAYDA_TOKEN_ENDPOINT || 'https://fayda.et/oauth/token',
  userinfoEndpoint: process.env.FAYDA_USERINFO_ENDPOINT || 'https://fayda.et/oauth/userinfo',
  clientId: process.env.FAYDA_CLIENT_ID || 'mock-client-id',
  redirectUri: (process.env.BASE_URL || 'http://localhost:3000') + '/api/fayda/callback',
}

function signClientAssertion() {
  const h = b64Encode({ alg: 'RS256', typ: 'JWT' })
  const now = Math.floor(Date.now() / 1000)
  const p = b64Encode({
    iss: FAYDA_OIDC.clientId, sub: FAYDA_OIDC.clientId,
    aud: FAYDA_OIDC.tokenEndpoint, iat: now, exp: now + 300,
    jti: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
  })
  const s = crypto.createHmac('sha256', 'mock-key').update(h + '.' + p).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return h + '.' + p + '.' + s
}

function generateMockOidcIdentity(citizen) {
  const now = Math.floor(Date.now() / 1000)
  return {
    sub: 'fayda-oidc-' + (citizen.id || citizen.userId),
    name: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim() || 'Abebe Kebede',
    given_name: citizen.firstName || 'Abebe',
    family_name: citizen.lastName || 'Kebede',
    email: citizen.email || 'user@fayda.et',
    phone_number: citizen.phone || '+251911223344',
    birthdate: '1990-01-15',
    gender: 'male',
    fan: 'FAN-' + new Date().getFullYear() + '-' + String(citizen.id || 1).padStart(6, '0'),
    fin: 'FIN-ET-' + String(citizen.id || 1).padStart(9, '0'),
    id_verified: true,
    verification_level: 'substantial',
    verified_at: new Date().toISOString(),
    updated_at: now,
    idp: 'fayda-oidc',
  }
}

function getCitizenId(token) {
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

let _mongoConn = null, _mongoDb = null, _mongoInit = null
async function initDb() {
  if (_mongoDb) return
  if (_mongoInit) return _mongoInit
  _mongoInit = (async () => {
    const { MongoClient } = require('mongodb')
    const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 30000 })
    try {
      await client.connect()
      _mongoConn = client
      _mongoDb = client.db()
    } catch (e) {
      _mongoInit = null
      throw e
    }
  })()
  return _mongoInit
}

async function mongo() {
  await initDb()
  if (!_mongoDb) throw new Error('Database not initialized')
  return _mongoDb
}

function safeCitizen(c) { const { password, _id, ...r } = c; return r }

async function requireAuth(req) {
  const token = bearerToken(req)
  const cid = getCitizenId(token)
  if (!cid) return null
  const db = await mongo()
  return db.collection('citizens').findOne({ id: cid })
}

async function handleRoute(method, p, body, req) {
  // Strip /with-language and /with-language-and-organization suffixes
  if (p.endsWith('/with-language-and-organization')) p = p.replace(/\/with-language-and-organization$/, '')
  else if (p.endsWith('/with-language')) p = p.replace(/\/with-language$/, '')

  const citizen = await requireAuth(req)
  const citizenId = citizen?.id || null

  if (method === 'PUT' && p === '/citizens/profile' && citizen) {
    const db = await mongo()
    await db.collection('citizens').updateOne({ id: citizenId }, { $set: body })
    const updated = await db.collection('citizens').findOne({ id: citizenId })
    return json(200, safeCitizen(updated), 'Profile updated')
  }

  if (method === 'GET' && p === '/citizens/applications' && citizen) {
    const db = await mongo()
    return json(200, await db.collection('citizenApplications').find({ citizenId }).toArray())
  }
  if (method === 'POST' && p === '/citizens/applications' && citizen) {
    const now = new Date()
    const ticketNumber = 'TKT-' + now.getTime().toString(36).toUpperCase()
    const refNumber = 'APP-' + now.getFullYear() + String(now.getTime()).slice(-4)
    const customDate = body.formData?.appointmentDate
    const customTime = body.formData?.appointmentTime
    const apptDate = customDate ? new Date(customDate) : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const db = await mongo()
    const appId = now.getTime().toString(36)
    const app = { id: appId, citizenId, referenceNumber: refNumber, ticketNumber, serviceId: body.serviceId, serviceTitle: body.serviceTitle, formData: body.formData || {}, documents: body.documents || [], status: 'submitted', createdAt: now, updatedAt: now, timeline: [{ status: 'submitted', date: now, note: 'Application submitted' }] }
    await db.collection('citizenApplications').insertOne(app)
    let fee = 50
    try {
      const svc = await db.collection('services').findOne({ id: body.serviceId })
      if (svc && svc.ServiceFee) fee = parseInt(String(svc.ServiceFee).replace(/,/g, '')) || 50
    } catch (_) {}
    const ticketId = now.getTime()
    const ticket = { id: ticketId, ticketNumber, citizenId, citizenName: `${citizen.firstName || ''} ${citizen.lastName || ''}`.trim(), serviceId: body.serviceId, serviceTitle: body.serviceTitle, department: '', fee, timestamp: now, appointmentDate: apptDate, appointmentTime: customTime || '10:00', status: 'active', createdAt: now }
    await db.collection('tickets').insertOne(ticket)
    return json(200, { application: app, ticket }, 'Application submitted with ticket')
  }
  if (method === 'PUT' && p?.startsWith('/citizens/applications/') && citizen) {
    const appId = p.split('/')[3]
    const db = await mongo()
    await db.collection('citizenApplications').updateOne({ id: appId, citizenId }, { $set: { ...body, updatedAt: new Date() } })
    return json(200, null, 'Application updated')
  }
  if (method === 'DELETE' && p?.startsWith('/citizens/applications/') && citizen) {
    const appId = p.split('/')[3]
    const db = await mongo()
    await db.collection('citizenApplications').deleteOne({ id: appId, citizenId })
    return json(200, null, 'Application deleted')
  }

  if (method === 'GET' && p === '/citizens/documents' && citizen) {
    const db = await mongo()
    return json(200, await db.collection('citizenDocuments').find({ citizenId }).toArray())
  }
  if (method === 'POST' && p === '/citizens/documents' && citizen) {
    const doc = { id: Date.now(), citizenId, ...body, uploadedAt: new Date().toISOString() }
    const db = await mongo()
    await db.collection('citizenDocuments').insertOne(doc)
    return json(200, doc, 'Document uploaded')
  }
  if (method === 'PUT' && p?.startsWith('/citizens/documents/') && citizen) {
    const docId = parseInt(p.split('/')[3])
    const db = await mongo()
    await db.collection('citizenDocuments').updateOne({ id: docId, citizenId }, { $set: body })
    return json(200, null, 'Document updated')
  }
  if (method === 'DELETE' && p?.startsWith('/citizens/documents/') && citizen) {
    const docId = parseInt(p.split('/')[3])
    const db = await mongo()
    await db.collection('citizenDocuments').deleteOne({ id: docId, citizenId })
    return json(200, null, 'Document deleted')
  }

  if (method === 'GET' && p === '/citizens/tickets' && citizen) {
    const db = await mongo()
    return json(200, await db.collection('tickets').find({ citizenId }).sort({ createdAt: -1 }).toArray())
  }
  if (method === 'PUT' && p?.startsWith('/citizens/tickets/') && citizen) {
    const ticketId = parseInt(p.split('/')[3])
    const db = await mongo()
    const $set = {}
    if (body.appointmentDate) $set.appointmentDate = body.appointmentDate
    if (body.appointmentTime) $set.appointmentTime = body.appointmentTime
    await db.collection('tickets').updateOne({ id: ticketId, citizenId }, { $set })
    return json(200, null, 'Ticket updated')
  }
  if (method === 'GET' && p === '/tickets') {
    const db = await mongo()
    return json(200, await db.collection('tickets').find().sort({ createdAt: -1 }).toArray())
  }
  if (method === 'GET' && p === '/tickets/stats') {
    const db = await mongo()
    const tickets = await db.collection('tickets').find().toArray()
    let totalRevenue = 0
    const serviceCounts = {}
    tickets.forEach(t => {
      serviceCounts[t.serviceTitle] = (serviceCounts[t.serviceTitle] || 0) + 1
      totalRevenue += t.fee || 0
    })
    const deptSet = new Set(tickets.map(t => t.department || '').filter(Boolean))
    return json(200, {
      totalTickets: tickets.length,
      totalDepartments: deptSet.size,
      totalRevenue,
      serviceCounts,
      topServices: Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
    })
  }

  if (method === 'GET' && p === '/applications') {
    const db = await mongo()
    return json(200, await db.collection('citizenApplications').find().sort({ createdAt: -1 }).toArray())
  }

  if (method === 'GET' && p === '/citizens/net-worth' && citizen) {
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
    const db = await mongo()
    await db.collection('netWorth').updateOne({ citizenId }, { $set: { netWorth: body.netWorth, assets: body.assets, liabilities: body.liabilities, updatedAt: new Date() } })
    return json(200, null, 'Net worth updated')
  }
  if (method === 'GET' && p === '/net-worth/rankings') {
    const db = await mongo()
    const all = await db.collection('netWorth').find().sort({ netWorth: -1 }).toArray()
    const anonymized = all.map((r, i) => ({ ...r, displayName: r.shareName ? r.fullName : `Citizen #${i + 1}` }))
    return json(200, anonymized)
  }

  if (method === 'GET' && p === '/contributions') {
    const db = await mongo()
    return json(200, await db.collection('contributions').find().sort({ createdAt: -1 }).toArray())
  }
  if (method === 'GET' && p === '/contributions/stats') {
    return json(200, { totalContributions: 0, contributionCount: 0, byDepartment: {} })
  }
  if (method === 'POST' && p === '/contributions' && citizen) {
    const { department, amount, message } = body
    if (!amount || Number(amount) <= 0) return json(400, null, 'Invalid amount')
    const contributionAmount = Number(amount)
    return json(200, { amount: contributionAmount }, 'Contribution submitted')
  }
  if (method === 'GET' && p === '/citizens/contributions' && citizen) {
    return json(200, [])
  }

  if (method === 'GET' && p === '/citizens/dashboard' && citizen) {
    const db = await mongo()
    const applicationsCount = await db.collection('citizenApplications').countDocuments({ citizenId })
    const ticketsCount = await db.collection('tickets').countDocuments({ citizenId })
    const servicesCount = await db.collection('services').countDocuments()
    return json(200, { citizen: safeCitizen(citizen), applicationsCount, ticketsCount, servicesCount })
  }

  if (method === 'GET' && p === '/citizens/bank-portfolio' && citizen) {
    return json(200, [])
  }

  if (method === 'GET' && (p === '/services' || p === '/Services')) {
    const db = await mongo()
    return json(200, await db.collection('services').find().toArray())
  }
  if (method === 'GET' && (p?.startsWith('/services/') || p?.startsWith('/Services/'))) {
    const id = parseInt(p.split('/')[2])
    const db = await mongo()
    const service = await db.collection('services').findOne({ id })
    return json(200, service || null)
  }
  if (method === 'GET' && (p === '/organizations' || p === '/Organizations')) {
    const db = await mongo()
    return json(200, await db.collection('organizations').find().toArray())
  }
  if (method === 'GET' && p === '/banks') {
    return json(200, [])
  }
  if (method === 'GET' && p === '/economy') {
    return json(200, {})
  }
  if (method === 'GET' && p === '/business-news') {
    return json(200, [])
  }

  /* ─── Fayda OIDC identity CRUD ─── */
  if (method === 'GET' && p === '/citizens/fayda-oidc' && citizen) {
    const db = await mongo()
    const oidc = await db.collection('faydaOidcIdentities').findOne({ citizenId })
    return json(200, oidc || null)
  }
  if (method === 'DELETE' && p === '/citizens/fayda-oidc' && citizen) {
    const db = await mongo()
    await db.collection('faydaOidcIdentities').deleteOne({ citizenId })
    return json(200, null, 'Fayda OIDC identity unlinked')
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
    if (!MONGODB_URI) {
      return sendRes(response, json(500, null, 'MONGODB_URI environment variable not set'))
    }
    await initDb()
    if (request.method === 'GET' && p === '/health')
      return sendRes(response, json(200, { ok: true, node: process.version }))

    if (request.method === 'POST' && p === '/citizens/register')
      return sendRes(response, await doRegister(body))

    if (request.method === 'POST' && p === '/citizens/login')
      return sendRes(response, await doLogin(body))

    if (request.method === 'POST' && p === '/citizens/google')
      return sendRes(response, await doGoogleLogin(body))

    if (request.method === 'GET' && p === '/citizens/session')
      return sendRes(response, await doSession(request))

    /* ─── Fayda OIDC routes ─── */

    if (request.method === 'POST' && p === '/fayda/oidc/link')
      return sendRes(response, await doOidcLink(body, request))

    if (request.method === 'GET' && p === '/fayda/auth')
      return sendRes(response, await doFaydaAuth(request))

    if (request.method === 'GET' && p === '/fayda/callback')
      return sendRes(response, await doFaydaCallback(request))

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
    payload = await verifyGoogleToken(credential)
  } catch (err) {
    return json(401, null, err.message)
  }

  const googleInfo = {
    googleId: payload.sub,
    googleData: { sub: payload.sub, email: payload.email, email_verified: payload.email_verified, name: payload.name, given_name: payload.given_name, family_name: payload.family_name, picture: payload.picture, locale: payload.locale },
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
  const db = await mongo()
  const citizen = await db.collection('citizens').findOne({ id: cid })
  if (!citizen) return unauth()
  return json(200, safeCitizen(citizen))
}

/* ─── Fayda OIDC Handlers ─── */

async function doOidcLink(body, req) {
  const citizen = await requireAuth(req)
  if (!citizen) return unauth()
  const citizenId = citizen.id || citizen.userId

  const oidcIdentity = generateMockOidcIdentity(citizen)

  const db = await mongo()
  const existing = await db.collection('faydaOidcIdentities').findOne({ citizenId })
  if (existing) {
    await db.collection('faydaOidcIdentities').updateOne({ citizenId }, { $set: oidcIdentity })
  } else {
    await db.collection('faydaOidcIdentities').insertOne({ citizenId, ...oidcIdentity })
  }

  return json(200, oidcIdentity, 'Fayda OIDC identity linked successfully')
}

async function doFaydaAuth(req) {
  const state = crypto.randomBytes ? crypto.randomBytes(16).toString('hex') : Math.random().toString(36).slice(2)
  await requireAuth(req)

  if (!process.env.FAYDA_PRIVATE_KEY) {
    const mockCode = 'mock-code-' + Date.now()
    const mockAuthUrl = '/api/fayda/callback?code=' + mockCode + '&state=' + state
    return json(200, {
      authUrl: mockAuthUrl,
      state,
      message: 'Mock Fayda auth - redirect to callback',
    })
  }

  const clientAssertion = signClientAssertion()
  const authUrl = FAYDA_OIDC.authEndpoint + '?' +
    'client_id=' + encodeURIComponent(FAYDA_OIDC.clientId) +
    '&redirect_uri=' + encodeURIComponent(FAYDA_OIDC.redirectUri) +
    '&response_type=code' +
    '&scope=openid+profile+email+phone' +
    '&state=' + state +
    '&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer' +
    '&client_assertion=' + clientAssertion

  return json(200, { authUrl, state, message: 'Redirect to Fayda authorization' })
}

async function doFaydaCallback(req) {
  const query = req.query || {}
  const code = query.code || ''

  if (!code) return json(400, null, 'Missing authorization code')

  if (!process.env.FAYDA_PRIVATE_KEY) {
    const mockIdentity = {
      sub: 'fayda-oidc-mock-' + Date.now(),
      name: 'Abebe Kebede',
      given_name: 'Abebe',
      family_name: 'Kebede',
      email: 'abebe.kebede@fayda.et',
      phone_number: '+251911223344',
      birthdate: '1990-01-15',
      gender: 'male',
      fan: 'FAN-' + new Date().getFullYear() + '-MOCK001',
      fin: 'FIN-ET-MOCK000001',
      id_verified: true,
      verification_level: 'substantial',
      verified_at: new Date().toISOString(),
      updated_at: Math.floor(Date.now() / 1000),
      idp: 'fayda-oidc',
    }
    return json(200, {
      oidcUser: mockIdentity,
      message: 'Fayda OIDC verification successful (mock)',
    })
  }

  try {
    const assertion = signClientAssertion()
    const tokenResponse = await fetch(FAYDA_OIDC.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: FAYDA_OIDC.redirectUri,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: assertion,
      }),
    })
    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) return json(401, null, 'Failed to exchange authorization code')

    const userinfoResponse = await fetch(FAYDA_OIDC.userinfoEndpoint, {
      headers: { Authorization: 'Bearer ' + tokenData.access_token },
    })
    const userinfo = await userinfoResponse.json()
    if (!userinfo.sub) return json(401, null, 'Failed to fetch userinfo')

    return json(200, {
      oidcUser: userinfo,
      message: 'Fayda OIDC verification successful',
    })
  } catch (err) {
    return json(502, null, 'Fayda OIDC token exchange failed: ' + (err.message || err))
  }
}
