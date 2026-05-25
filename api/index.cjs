const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwtLib = require('jsonwebtoken')

const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
const isDev = process.env.NODE_ENV !== 'production'
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
  return jwtLib.sign(
    { sub: String(citizen.id || citizen._id), email: citizen.email },
    JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  )
}

function json(code, data, msg) {
  return { statusCode: code, body: JSON.stringify({ data, message: msg || 'Success', success: code < 400 }) }
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://accounts.google.com https://www.googleapis.com https://open.er-api.com; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://i.ytimg.com https://www.properties.et https://betoch.com https://qetero.com https://www.ethiojobs.net https://justice.gov.et https://www.ecx.com.et; frame-src 'self' https://accounts.google.com https://id.et https://justice.gov.et https://qetero.com https://www.ethiojobs.net https://www.ecx.com.et https://www.properties.et https://betoch.com https://www.youtube.com https://www.youtube-nocookie.com; font-src 'self' data: https://fonts.gstatic.com; base-uri 'self'; form-action 'self'; manifest-src 'self'")
}

function sendRes(res, result) {
  setSecurityHeaders(res)
  res.status(result.statusCode).setHeader('Content-Type', 'application/json').send(result.body)
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

function verifyCitizenToken(token) {
  try {
    const payload = jwtLib.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    const id = parseInt(payload.sub, 10)
    return isNaN(id) ? null : id
  } catch { return null }
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

function adminToken(user) {
  return jwtLib.sign(
    { sub: String(user._id), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h', algorithm: 'HS256' }
  )
}

function safeUser(u) { const { password, _id, ...r } = u; return r }

async function doAdminLogin(body) {
  const { username, password } = body
  if (!username || !password) return json(400, null, 'Username and password required')
  const db = await mongo()
  const user = await db.collection('users').findOne({ username })
  if (!user) return json(401, null, 'Invalid credentials')
  const pw = user.password || ''
  const isBcrypt = pw.startsWith('$2a$') || pw.startsWith('$2b$')
  const isMatch = isBcrypt ? await bcrypt.compare(password, pw) : pw === password
  if (!isMatch) return json(401, null, 'Invalid credentials')
  if (!isBcrypt) {
    const hashed = await bcrypt.hash(password, 12)
    await db.collection('users').updateOne({ _id: user._id }, { $set: { password: hashed } })
  }
  return json(200, { user: safeUser(user), accessToken: adminToken(user) }, 'Login successful')
}

async function requireAuth(req) {
  const token = bearerToken(req)
  const cid = verifyCitizenToken(token)
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

  if (method === 'GET' && p === '/citizens/verifications' && citizen) {
    const db = await mongo()
    const vers = await db.collection('citizenVerifications').find({ citizenId }).toArray()
    if (vers.length === 0) {
      const defaultTypes = ['national_id','passport','drivers_license','tin_certificate','tax_clearance','business_tax','vat_certificate']
      const now = new Date().toISOString()
      const seeds = defaultTypes.map(dt => ({ id: Date.now() + Math.floor(Math.random() * 1000000), citizenId, documentType: dt, status: 'not_submitted', documentName: dt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), submittedAt: null, verifiedAt: null, adminNotes: '', fileName: '', fileUrl: '', createdAt: now }))
      await db.collection('citizenVerifications').insertMany(seeds)
      return json(200, seeds)
    }
    return json(200, vers)
  }

  if (method === 'POST' && p?.startsWith('/citizens/verifications/') && p.endsWith('/submit') && citizen) {
    const documentType = p.split('/')[3]
    const db = await mongo()
    const existing = await db.collection('citizenVerifications').findOne({ citizenId, documentType })
    if (existing && existing.status === 'verified') return json(400, null, 'Document already verified')
    const now = new Date().toISOString()
    const data = { citizenId, documentType, status: 'pending', submittedAt: now, fileName: body.fileName || 'document', fileUrl: body.fileUrl || '', adminNotes: '', updatedAt: now, createdAt: existing?.createdAt || now }
    if (existing) {
      await db.collection('citizenVerifications').updateOne({ citizenId, documentType }, { $set: data })
    } else {
      data.id = Date.now() + Math.floor(Math.random() * 1000000)
      data.documentName = documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      await db.collection('citizenVerifications').insertOne(data)
    }
    return json(200, data, 'Verification submitted')
  }

  if (method === 'GET' && p === '/citizens/verification-status' && citizen) {
    const db = await mongo()
    const vers = await db.collection('citizenVerifications').find({ citizenId }).toArray()
    if (vers.length === 0) {
      const defaultTypes = ['national_id','passport','drivers_license','tin_certificate','tax_clearance','business_tax','vat_certificate']
      const now = new Date().toISOString()
      const seeds = defaultTypes.map(dt => ({ id: Date.now() + Math.floor(Math.random() * 1000000), citizenId, documentType: dt, status: 'not_submitted', documentName: dt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), submittedAt: null, verifiedAt: null, adminNotes: '', fileName: '', fileUrl: '', createdAt: now }))
      await db.collection('citizenVerifications').insertMany(seeds)
      vers.push(...seeds)
    }
    const verifiedDocs = vers.filter(v => v.status === 'verified').length
    const tin = await db.collection('citizenTins').findOne({ citizenId })
    const nw = await db.collection('netWorth').findOne({ citizenId })
    return json(200, {
      isMesobVerified: verifiedDocs >= 2,
      verifiedDocuments: verifiedDocs,
      totalDocuments: vers.length,
      badges: verifiedDocs,
      economyRank: '—',
      netWorth: nw?.netWorth || 0,
      tinStatus: tin?.status || 'unregistered',
    })
  }

  if (method === 'GET' && p === '/citizens/badge' && citizen) {
    const db = await mongo()
    const vers = await db.collection('citizenVerifications').find({ citizenId }).toArray()
    if (vers.length === 0) {
      const defaultTypes = ['national_id','passport','drivers_license','tin_certificate','tax_clearance','business_tax','vat_certificate']
      const now = new Date().toISOString()
      const seeds = defaultTypes.map(dt => ({ id: Date.now() + Math.floor(Math.random() * 1000000), citizenId, documentType: dt, status: 'not_submitted', documentName: dt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), submittedAt: null, verifiedAt: null, adminNotes: '', fileName: '', fileUrl: '', createdAt: now }))
      await db.collection('citizenVerifications').insertMany(seeds)
      vers.push(...seeds)
    }
    const verifiedDocs = vers.filter(v => v.status === 'verified').length
    return json(200, { isMesobVerified: verifiedDocs >= 2, verifiedDocuments: verifiedDocs, totalDocuments: vers.length })
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

  /* proxy/bank is handled in the main handler where response is in scope */

  /* ─── Generic collection CRUD fallback ─── */
  const segments = p.split('/').filter(Boolean)
  if (segments.length >= 1) {
    const rawName = segments[0]
    const collName = rawName.charAt(0).toLowerCase() + rawName.slice(1)

    if (method === 'GET' && segments.length === 1) {
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        return json(200, await db.collection(collName).find().toArray())
      }
    }

    if (method === 'GET' && segments.length === 2 && segments[1] === 'active') {
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        return json(200, await db.collection(collName).find({ isActive: { $ne: false } }).toArray())
      }
    }

    if (method === 'GET' && segments.length === 2 && segments[1] === 'search') {
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        const term = (body.name || body.term || body.title || '').toLowerCase()
        const all = await db.collection(collName).find().toArray()
        const filtered = all.filter(item =>
          (item.name || '').toLowerCase().includes(term) ||
          (item.title || '').toLowerCase().includes(term)
        )
        return json(200, filtered)
      }
    }

    if (method === 'GET' && segments.length === 2 && segments[1] === 'latest') {
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        const limit = parseInt(body.limit) || 10
        return json(200, await db.collection(collName).find().sort({ _id: -1 }).limit(limit).toArray())
      }
    }

    if (method === 'GET' && segments.length === 3 && segments[1] === 'language') {
      const langId = parseInt(segments[2])
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        return json(200, await db.collection(collName).find({ languageId: langId }).toArray())
      }
    }

    if (method === 'GET' && segments.length === 2) {
      const itemId = isNaN(segments[1]) ? segments[1] : parseInt(segments[1])
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        const item = await db.collection(collName).findOne({ id: itemId })
        return json(200, item || null)
      }
    }

    if (method === 'POST' && segments.length === 1) {
      const db = await mongo()
      const collections = await db.listCollections({ name: collName }).toArray()
      if (collections.length > 0) {
        const all = await db.collection(collName).find().sort({ id: -1 }).limit(1).toArray()
        const newId = (all.length > 0 ? all[0].id : 0) + 1
        const doc = { id: newId, ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        await db.collection(collName).insertOne(doc)
        return json(200, doc, 'Created')
      }
    }

    if (method === 'PUT' && segments.length === 2) {
      const itemId = parseInt(segments[1])
      if (!isNaN(itemId)) {
        const db = await mongo()
        const collections = await db.listCollections({ name: collName }).toArray()
        if (collections.length > 0) {
          const $set = { ...body, updatedAt: new Date().toISOString() }
          delete $set._id
          await db.collection(collName).updateOne({ id: itemId }, { $set })
          const updated = await db.collection(collName).findOne({ id: itemId })
          return json(200, updated || body, 'Updated')
        }
      }
    }

    if (method === 'DELETE' && segments.length === 2) {
      const itemId = parseInt(segments[1])
      if (!isNaN(itemId)) {
        const db = await mongo()
        const collections = await db.listCollections({ name: collName }).toArray()
        if (collections.length > 0) {
          await db.collection(collName).deleteOne({ id: itemId })
          return json(200, null, 'Deleted')
        }
      }
    }
  }

  return json(404, null, 'Not found')
}

module.exports = async function handler(request, response) {
  const origin = request.headers['origin'] || ''
  const allowedOrigins = isDev
    ? ['http://localhost:3000', 'http://localhost:5173']
    : (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin || '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.setHeader('Access-Control-Allow-Credentials', 'true')
  }

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

    /* ─── Admin / User routes ─── */

    if (request.method === 'POST' && p === '/users/login')
      return sendRes(response, await doAdminLogin(body))

    if (request.method === 'POST' && p === '/users/logout')
      return sendRes(response, json(200, null, 'Logged out'))

    if (request.method === 'POST' && p === '/users/accessToken') {
      const auth = bearerToken(request)
      if (!auth) return sendRes(response, json(401, null, 'No token provided'))
      let payload
      try { payload = jwtLib.verify(auth, JWT_SECRET) } catch { return sendRes(response, json(401, null, 'Invalid or expired token')) }
      const db = await mongo()
      const user = await db.collection('users').findOne({ _id: new (require('mongodb').ObjectId)(payload.sub) })
      if (!user) return sendRes(response, json(401, null, 'No admin user found'))
      return sendRes(response, json(200, { accessToken: adminToken(user) }))
    }

    if (request.method === 'GET' && p === '/users/profile') {
      const db = await mongo()
      const user = await db.collection('users').findOne()
      return sendRes(response, json(200, user ? safeUser(user) : null))
    }

    /* ─── Admin verification routes ─── */

    if (p?.startsWith('/admin/verified') || p?.startsWith('/admin/verifications') || p?.startsWith('/admin/users') || p?.startsWith('/admin/documents')) {
      const auth = bearerToken(request)
      if (!auth) return sendRes(response, json(401, null, 'No token provided'))
      try {
        const payload = jwtLib.verify(auth, JWT_SECRET)
        const db = await mongo()
        const user = await db.collection('users').findOne({ _id: new (require('mongodb').ObjectId)(payload.sub) })
        if (!user) return sendRes(response, json(401, null, 'No admin user found'))
      } catch { return sendRes(response, json(401, null, 'Invalid or expired token')) }
    }

    if (p === '/admin/verified-stats') {
      const db = await mongo()
      const citizens = await db.collection('citizens').find().toArray()
      const vers = await db.collection('citizenVerifications').find().toArray()
      const tins = await db.collection('citizenTins').find().toArray()
      const verifiedCitizens = citizens.filter(c => {
        const cv = vers.filter(v => v.citizenId === c.id && v.status === 'verified').length
        return cv >= 2
      })
      return sendRes(response, json(200, {
        totalCitizens: citizens.length,
        verifiedCitizens: verifiedCitizens.length,
        verificationRate: citizens.length > 0 ? ((verifiedCitizens.length / citizens.length) * 100).toFixed(1) : 0,
        tinRegistered: tins.filter(t => t.status === 'active').length,
        pendingVerifications: vers.filter(v => v.status === 'pending').length,
        byType: {
          national_id: vers.filter(v => v.documentType === 'national_id' && v.status === 'verified').length,
          passport: vers.filter(v => v.documentType === 'passport' && v.status === 'verified').length,
          drivers_license: vers.filter(v => v.documentType === 'drivers_license' && v.status === 'verified').length,
          tin_certificate: vers.filter(v => v.documentType === 'tin_certificate' && v.status === 'verified').length,
        }
      }))
    }

    if (request.method === 'GET' && p === '/admin/verifications') {
      const db = await mongo()
      const vers = await db.collection('citizenVerifications').find({ status: { $ne: 'not_submitted' } }).sort({ submittedAt: -1 }).toArray()
      const citizens = await db.collection('citizens').find().toArray()
      const enriched = vers.map(v => {
        const c = citizens.find(cit => cit.id === v.citizenId)
        return { ...v, citizenName: c ? `${c.firstName} ${c.lastName}` : 'Unknown', citizenEmail: c?.email || '', citizenPhone: c?.phone || '' }
      })
      return sendRes(response, json(200, enriched))
    }

    if (request.method === 'PUT' && p?.startsWith('/admin/verifications/')) {
      const verId = parseInt(p.split('/')[3])
      const db = await mongo()
      const ver = await db.collection('citizenVerifications').findOne({ id: verId })
      if (!ver) return sendRes(response, json(404, null, 'Verification not found'))
      const $set = {}
      if (body.status) $set.status = body.status
      if (body.adminNotes !== undefined) $set.adminNotes = body.adminNotes
      if (body.status === 'verified' || body.status === 'rejected') $set.verifiedAt = new Date().toISOString()
      await db.collection('citizenVerifications').updateOne({ id: verId }, { $set })
      const updated = await db.collection('citizenVerifications').findOne({ id: verId })
      if (body.status === 'verified' || body.status === 'rejected') {
        const allVers = await db.collection('citizenVerifications').find({ citizenId: ver.citizenId }).toArray()
        const verifiedCount = allVers.filter(v => v.status === 'verified').length
        const isVerified = verifiedCount >= 2
        await db.collection('citizens').updateOne({ id: ver.citizenId }, { $set: { isMesobVerified: isVerified } })
      }
      return sendRes(response, json(200, updated, `Verification ${body.status}`))
    }

    if (request.method === 'GET' && p === '/admin/users') {
      const db = await mongo()
      const citizens = await db.collection('citizens').find().toArray()
      const vers = await db.collection('citizenVerifications').find().toArray()
      const tins = await db.collection('citizenTins').find().toArray()
      const netWorth = await db.collection('netWorth').find().toArray()
      const enriched = citizens.map(c => {
        const cv = vers.filter(v => v.citizenId === c.id)
        const tin = tins.find(t => t.citizenId === c.id)
        const nw = netWorth.find(n => n.citizenId === c.id)
        const verifiedDocs = cv.filter(v => v.status === 'verified').length
        return {
          id: c.id, firstName: c.firstName, lastName: c.lastName,
          email: c.email, phone: c.phone, shareName: !!c.shareName,
          createdAt: c.createdAt, netWorth: nw?.netWorth || 0,
          verifiedDocuments: verifiedDocs, totalDocuments: cv.length,
          tinStatus: tin?.status || 'unregistered', tinNumber: tin?.tinNumber || '',
          isMesobVerified: c.isMesobVerified ?? (verifiedDocs >= 2), hasBadge: c.isMesobVerified ?? (verifiedDocs >= 2),
          education: c.education || [], experience: c.experience || [], skills: c.skills || []
        }
      })
      return sendRes(response, json(200, enriched))
    }

    if (request.method === 'PUT' && p?.startsWith('/admin/users/') && p.endsWith('/badge')) {
      const userId = parseInt(p.split('/')[3])
      const db = await mongo()
      const citizen = await db.collection('citizens').findOne({ id: userId })
      if (!citizen) return sendRes(response, json(404, null, 'Citizen not found'))
      await db.collection('citizens').updateOne({ id: userId }, { $set: { isMesobVerified: !!body.isMesobVerified } })
      return sendRes(response, json(200, { citizenId: userId, isMesobVerified: !!body.isMesobVerified }, `Badge ${body.isMesobVerified ? 'added' : 'removed'}`))
    }

    if (request.method === 'PUT' && p?.startsWith('/admin/users/') && !p.endsWith('/badge')) {
      const userId = parseInt(p.split('/')[3])
      if (isNaN(userId)) return sendRes(response, json(400, null, 'Invalid user ID'))
      const db = await mongo()
      const $set = {}
      if (body.firstName) $set.firstName = body.firstName
      if (body.lastName) $set.lastName = body.lastName
      if (body.email) $set.email = body.email
      if (body.phone) $set.phone = body.phone
      await db.collection('citizens').updateOne({ id: userId }, { $set })
      const updated = await db.collection('citizens').findOne({ id: userId })
      return sendRes(response, json(200, updated, 'Citizen updated'))
    }

    if (request.method === 'DELETE' && p?.startsWith('/admin/users/')) {
      const userId = parseInt(p.split('/')[3])
      if (isNaN(userId)) return sendRes(response, json(400, null, 'Invalid user ID'))
      const db = await mongo()
      await db.collection('citizens').deleteOne({ id: userId });
      ['citizenVerifications','citizenTins','citizenFaydaIds','netWorth','citizenApplications','citizenDocuments'].forEach(async coll => {
        try { await db.collection(coll).deleteMany({ citizenId: userId }) } catch {}
      })
      return sendRes(response, json(200, null, 'Citizen deleted'))
    }

    /* ─── Dashboard data endpoints ─── */

    if (request.method === 'GET' && p === '/budgets') {
      return sendRes(response, json(200, [
        { id: 1, departmentName: 'Ministry of Education', shortName: 'Education', annualBudget: 52000000000, allocated: 48000000000, spent: 35000000000, remaining: 13000000000, netWorth: 0 },
        { id: 2, departmentName: 'Ministry of Health', shortName: 'Health', annualBudget: 38000000000, allocated: 35000000000, spent: 28000000000, remaining: 7000000000, netWorth: 0 },
        { id: 3, departmentName: 'Ministry of Defense', shortName: 'Defense', annualBudget: 45000000000, allocated: 44000000000, spent: 40000000000, remaining: 4000000000, netWorth: 0 },
        { id: 4, departmentName: 'Ministry of Agriculture', shortName: 'Agriculture', annualBudget: 28000000000, allocated: 25000000000, spent: 18000000000, remaining: 7000000000, netWorth: 0 },
        { id: 5, departmentName: 'Ministry of Transport', shortName: 'Transport', annualBudget: 22000000000, allocated: 20000000000, spent: 15000000000, remaining: 5000000000, netWorth: 0 },
        { id: 6, departmentName: 'Ministry of Water & Energy', shortName: 'Water & Energy', annualBudget: 18000000000, allocated: 17000000000, spent: 12000000000, remaining: 5000000000, netWorth: 0 },
        { id: 7, departmentName: 'Ministry of Finance', shortName: 'Finance', annualBudget: 15000000000, allocated: 14000000000, spent: 11000000000, remaining: 3000000000, netWorth: 500000000000 },
        { id: 8, departmentName: 'Ministry of Trade', shortName: 'Trade', annualBudget: 12000000000, allocated: 11000000000, spent: 8000000000, remaining: 3000000000, netWorth: 0 },
        { id: 9, departmentName: 'Ministry of Labor & Skills', shortName: 'Labor', annualBudget: 8000000000, allocated: 7500000000, spent: 5000000000, remaining: 2500000000, netWorth: 0 },
        { id: 10, departmentName: 'Ministry of Innovation & Tech', shortName: 'Innovation', annualBudget: 6000000000, allocated: 5500000000, spent: 3000000000, remaining: 2500000000, netWorth: 0 },
      ]))
    }

    if (request.method === 'GET' && p === '/budgets/overview') {
      return sendRes(response, json(200, {
        fiscalYear: '2025/26', totalNationalBudget: 245000000000, totalAllocated: 222500000000,
        totalSpent: 161000000000, totalRemaining: 61500000000, totalRevenueCollected: 185000000000,
        budgetUtilizationRate: 72.4, totalNetWorth: 500000000000,
      }))
    }

    if (request.method === 'GET' && p === '/economy') {
      return sendRes(response, json(200, {
        gdp: 155.8, gdpGrowth: 6.4, gdpPerCapita: 1123, inflation: 23.5,
        unemployment: 19.1, sectors: { agriculture: 34, services: 36, industry: 30 },
      }))
    }

    if (request.method === 'GET' && p === '/tax/stats') {
      return sendRes(response, json(200, {
        totalCollected: 185000000000, totalTarget: 210000000000, collectionRate: 88.1,
        byType: [
          { name: 'Income Tax', amount: 72000000000 },
          { name: 'VAT', amount: 48000000000 },
          { name: 'Corporate Tax', amount: 35000000000 },
          { name: 'Customs', amount: 18000000000 },
          { name: 'Excise', amount: 12000000000 },
        ],
        byMonth: [
          { month: 'Jul', amount: 14000000000 }, { month: 'Aug', amount: 15200000000 },
          { month: 'Sep', amount: 14800000000 }, { month: 'Oct', amount: 15500000000 },
          { month: 'Nov', amount: 16200000000 }, { month: 'Dec', amount: 15800000000 },
          { month: 'Jan', amount: 16500000000 }, { month: 'Feb', amount: 17000000000 },
          { month: 'Mar', amount: 17200000000 }, { month: 'Apr', amount: 16800000000 },
          { month: 'May', amount: 17500000000 }, { month: 'Jun', amount: 18000000000 },
        ],
      }))
    }

    if (request.method === 'GET' && p === '/population') {
      return sendRes(response, json(200, {
        total: 126500000, growthRate: 2.6, literacyRate: 51.8, medianAge: 19.5,
        regions: [
          { name: 'Oromia', population: 37000000 }, { name: 'Amhara', population: 21000000 },
          { name: 'SNNPR', population: 19000000 }, { name: 'Somali', population: 12000000 },
          { name: 'Tigray', population: 7000000 }, { name: 'Sidama', population: 5000000 },
          { name: 'Afar', population: 2500000 }, { name: 'Benishangul', population: 1500000 },
          { name: 'Gambela', population: 500000 }, { name: 'Harari', population: 300000 },
        ],
        ageGroups: [
          { group: '0-14', percentage: 40 }, { group: '15-24', percentage: 20 },
          { group: '25-54', percentage: 32 }, { group: '55-64', percentage: 4 },
          { group: '65+', percentage: 4 },
        ],
        urbanRural: { urban: 21, rural: 79 },
      }))
    }

    if (request.method === 'GET' && p === '/dashboard/news') {
      return sendRes(response, json(200, [
        { title: 'Ethiopia Launches Digital Economy Strategy 2025-2030', description: 'The government unveils comprehensive digital transformation plan targeting $50B digital economy by 2030.', source: 'ENA', pubDate: new Date(Date.now() - 3600000).toISOString(), image: 'https://i.imgur.com/placeholder-news.jpg' },
        { title: 'New Tax Reform Package Announced for FY 2025/26', description: 'Ministry of Finance introduces streamlined tax collection system expected to increase revenue by 35%.', source: 'The Reporter', pubDate: new Date(Date.now() - 7200000).toISOString(), image: '' },
        { title: 'Ethiopia GDP Growth Projected at 6.4% Amid Economic Reforms', description: 'IMF projects strong growth driven by agriculture reform, industrial parks, and service sector expansion.', source: 'Bloomberg', pubDate: new Date(Date.now() - 14400000).toISOString(), image: '' },
        { title: 'Digital ID System Reaches 80 Million Enrollments', description: 'Fayda digital ID program hits major milestone, enabling improved government service delivery.', source: 'ENA', pubDate: new Date(Date.now() - 28800000).toISOString(), image: '' },
        { title: 'Ethiopia Opens New Industrial Parks in Four Regions', description: 'Investment in manufacturing zones expected to create 200,000 new jobs.', source: 'The Reporter', pubDate: new Date(Date.now() - 57600000).toISOString(), image: '' },
        { title: 'Government Launches E-Service Portal for Citizen Services', description: 'MESOB platform now offers 150+ government services online, reducing processing times by 60%.', source: 'ENA', pubDate: new Date(Date.now() - 115200000).toISOString(), image: '' },
      ]))
    }

    if (request.method === 'GET' && p === '/news/ethiopia') {
      return sendRes(response, json(200, [
        { title: 'Ethiopia Digital Economy', source: 'Google News', pubDate: new Date().toISOString(), description: 'Ethiopia advancing digital transformation agenda with new policies and infrastructure investments.' },
        { title: 'Government Service Modernization', source: 'ENA', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'MESOB platform continues to expand with new services and improved citizen experience.' },
      ]))
    }

    if (request.method === 'GET' && p === '/news/videos') {
      return sendRes(response, json(200, []))
    }

    /* ─── APISIX routes ─── */

    if (request.method === 'GET' && p === '/apisix/routes') return sendRes(response, json(200, { list: [] }))
    if (request.method === 'GET' && p === '/apisix/upstreams') return sendRes(response, json(200, { list: [] }))
    if (request.method === 'GET' && p === '/apisix/dashboard') return sendRes(response, json(200, {}))
    if (request.method === 'GET' && p === '/apisix/plugins') return sendRes(response, json(200, { list: [] }))
    if (request.method === 'GET' && p === '/apisix/consumers') return sendRes(response, json(200, { list: [] }))

    /* ─── Jobs & extra endpoints ─── */

    if (request.method === 'GET' && p === '/jobs') return sendRes(response, json(200, []))
    if (request.method === 'GET' && p === '/admin/job-applications') return sendRes(response, json(200, []))
    if (request.method === 'GET' && p === '/admin/documents') {
      const db = await mongo()
      return sendRes(response, json(200, await db.collection('citizenDocuments').find().sort({ uploadedAt: -1 }).toArray()))
    }
    if (request.method === 'POST' && p === '/admin/documents') {
      const db = await mongo()
      const doc = { ...body, id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, uploadedAt: new Date().toISOString(), createdAt: new Date().toISOString() }
      await db.collection('citizenDocuments').insertOne(doc)
      return sendRes(response, json(201, doc, 'Document saved'))
    }
    if (request.method === 'PUT' && p === '/applications/profile') {
      return sendRes(response, json(200, null))
    }
    if (['PUT', 'DELETE'].includes(request.method) && p?.startsWith('/applications/')) {
      const appId = p.split('/')[2]
      const db = await mongo()
      if (request.method === 'PUT') {
        const { status, adminNotes } = body
        const $set = { updatedAt: new Date().toISOString() }
        if (status) { $set.status = status; if (!$set.timeline) $set.timeline = []; $set.timeline = [{ status, date: new Date().toISOString(), note: adminNotes || `Status changed to ${status}` }] }
        if (adminNotes !== undefined) $set.adminNotes = adminNotes
        await db.collection('citizenApplications').updateOne({ id: appId }, { $set })
        const updated = await db.collection('citizenApplications').findOne({ id: appId })
        return sendRes(response, json(200, updated, `Application ${status || 'updated'}`))
      }
      if (request.method === 'DELETE') {
        await db.collection('citizenApplications').deleteOne({ id: appId })
        return sendRes(response, json(200, null, 'Application deleted'))
      }
    }

    /* ─── Fayda OIDC routes ─── */

    if (request.method === 'POST' && p === '/fayda/oidc/link')
      return sendRes(response, await doOidcLink(body, request))

    if (request.method === 'GET' && p === '/fayda/auth')
      return sendRes(response, await doFaydaAuth(request))

    if (request.method === 'GET' && p === '/fayda/callback')
      return sendRes(response, await doFaydaCallback(request))

    /* ─── Proxy for external sites that block framing ─── */
    if (request.method === 'GET' && p === '/proxy/bank') {
      const https = require('https')
      const http = require('http')
      const targetUrl = request.query?.url
      if (!targetUrl) return sendRes(response, json(400, null, 'Missing url parameter'))
      return new Promise((resolve) => {
        const fetcher = targetUrl.startsWith('https') ? https : http
        fetcher.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html,application/xhtml+xml' }, rejectUnauthorized: false }, (proxyRes) => {
          let body = ''
          proxyRes.on('data', c => body += c)
          proxyRes.on('end', () => {
            body = body.replace(/<meta[^>]*X-Frame-Options[^>]*>/gi, '').replace(/<meta[^>]*frame-ancestors[^>]*>/gi, '').replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')
            response.writeHead(proxyRes.statusCode, {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Frame-Options': 'ALLOWALL',
              'Access-Control-Allow-Origin': '*'
            })
            response.end(body)
            resolve()
          })
        }).on('error', (err) => {
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          response.end(`<html><body style="font-family:sans-serif;padding:2rem;text-align:center;color:#666"><h2>Unable to load page</h2><p>The website could not be reached. It may be temporarily unavailable.</p><a href="${targetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">Open directly</a></body></html>`)
          resolve()
        })
      })
    }

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
  const hashedPassword = password ? await bcrypt.hash(password, 12) : ''
  const newId = (await coll.countDocuments()) + 1
  const doc = { _id: String(newId), id: newId, userId: newId, firstName, lastName, email, phone: phone || '', idNumber: idNumber || '', password: hashedPassword, picture: '', googleId: null, googleData: null, createdAt: new Date(), updatedAt: new Date(), status: 'active' }
  await coll.insertOne(doc)
  const verTypes = ['national_id','passport','drivers_license','tin_certificate','tax_clearance','business_tax','vat_certificate']
  const verSeeds = verTypes.map(dt => ({ id: Date.now() + Math.floor(Math.random() * 1000000), citizenId: newId, documentType: dt, status: 'not_submitted', documentName: dt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), submittedAt: null, verifiedAt: null, adminNotes: '', fileName: '', fileUrl: '', createdAt: new Date() }))
  await db.collection('citizenVerifications').insertMany(verSeeds)
  return json(200, { citizen: safeCitizen(doc), accessToken: signJwt(doc) }, 'Registration successful')
}

async function doLogin(body) {
  const { identifier, password: pwd } = body
  if (!identifier || !pwd) return json(400, null, 'Identifier and password required')

  const db = await mongo()
  const citizen = await db.collection('citizens').findOne({ $or: [{ email: identifier }, { idNumber: identifier }] })
  if (!citizen) return json(401, null, 'Invalid credentials')
  const pw = citizen.password || ''
  const isBcrypt = pw.startsWith('$2a$') || pw.startsWith('$2b$')
  const isMatch = isBcrypt ? await bcrypt.compare(pwd, pw) : pw === pwd
  if (!isMatch) return json(401, null, 'Invalid credentials')
  if (!isBcrypt) {
    const hashed = await bcrypt.hash(pwd, 12)
    await db.collection('citizens').updateOne({ _id: citizen._id }, { $set: { password: hashed } })
  }
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
  const cid = verifyCitizenToken(token)
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
