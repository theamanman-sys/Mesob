require('dotenv').config()

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const MOCK_DB_PATH = path.resolve(process.cwd(), 'mock', 'db.json')
const MONGODB_URI = process.env.MONGODB_URI
const USE_MOCK = !MONGODB_URI || String(process.env.USE_MOCK_DB) === 'true'

// ── Base64url ────────────────────────────────────────────────────

function b64Decode(str) {
  const raw = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (raw.length % 4)) % 4
  return Buffer.from(raw + '='.repeat(pad), 'base64').toString('utf-8')
}

function b64Encode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ── JWT ──────────────────────────────────────────────────────────

function signJwt(citizen) {
  const h = b64Encode({ alg: 'HS256', typ: 'JWT' })
  const p = b64Encode({ sub: citizen.id || citizen._id, email: citizen.email, iat: Date.now() })
  const s = crypto.createHmac('sha256', 'citizen-secret').update(h + '.' + p)
    .digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return h + '.' + p + '.' + s
}

// ── Response helper ──────────────────────────────────────────────

function json(code, data, msg) {
  return { statusCode: code, body: JSON.stringify({ data, message: msg || 'Success', success: code < 400 }) }
}

function sendRes(res, result) {
  res.status(result.statusCode).setHeader('Content-Type', 'application/json').send(result.body)
}

function getPath(req) {
  try { 
    const pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/api/, '')
    // Remove trailing slash for consistent matching
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
  // Handle mock tokens (for backward compatibility)
  if (token.startsWith('mock-citizen-token-')) {
    const id = parseInt(token.replace(/^mock-citizen-token-/, ''), 10)
    return isNaN(id) ? null : id
  }
  
  // Handle JWT tokens
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(b64Decode(parts[1]))
      const id = parseInt(payload.sub, 10)
      return isNaN(id) ? null : id
    }
  } catch (e) {
    console.error('[getCitizenId] Failed to parse JWT:', e.message)
  }
  
  return null
}

// ── Mock DB ──────────────────────────────────────────────────────

function loadMockDB() { return JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8')) }
function saveMockDB(db) { try { fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8') } catch (_) {} }

// ── MongoDB ──────────────────────────────────────────────────────

let _mongoConn = null, _mongoDb = null
async function mongo() {
  if (_mongoDb) return _mongoDb
  const { MongoClient } = require('mongodb')
  const client = new MongoClient(MONGODB_URI, { maxPoolSize: 5, serverSelectionTimeoutMS: 5000 })
  await client.connect()
  console.log('[MongoDB] Connected —', new URL(MONGODB_URI).hostname)
  _mongoConn = client
  _mongoDb = client.db()
  return _mongoDb
}

// ── Helpers ──────────────────────────────────────────────────────

function safeCitizen(c) { const { password, _id, ...r } = c; return r }

// ─────────────────────────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────────

async function doLogin(body) {
  const { identifier, password: pwd } = body
  if (!identifier || !pwd) return json(400, null, 'Identifier and password required')

  if (USE_MOCK) {
    const db = loadMockDB()
    let citizen = db.citizens?.find((c) =>
      (c.email === identifier || c.idNumber === identifier) && c.password === pwd
    )
    if (!citizen) {
      citizen = db.citizens?.find((c) =>
        (c.email === identifier || c.idNumber === identifier) && !c.password
      )
    }
    if (!citizen) return json(401, null, 'Invalid credentials')
    return json(200, { citizen: safeCitizen(citizen), accessToken: signJwt(citizen) }, 'Login successful')
  }

  const db = await mongo()
  const coll = db.collection('citizens')

  let citizen = await coll.findOne({
    $or: [{ email: identifier }, { idNumber: identifier }],
    password: pwd,
  })

  if (!citizen) {
    const candidates = await coll.find({
      $or: [{ email: identifier }, { idNumber: identifier }],
    }).toArray()
    try {
      const bcrypt = require('bcryptjs')
      for (const c of candidates) {
        if (bcrypt.compareSync(pwd, c.password || '')) { citizen = c; break }
      }
    } catch {}
  }

  if (!citizen) return json(401, null, 'Invalid credentials')
  return json(200, { citizen: safeCitizen(citizen), accessToken: signJwt(citizen) }, 'Login successful')
}

// ─────────────────────────────────────────────────────────────────
//  GOOGLE LOGIN
// ─────────────────────────────────────────────────────────────────

async function doGoogleLogin(body) {
  const { credential } = body
  if (!credential) return json(400, null, 'Missing credential')

  let payload
  try {
    payload = JSON.parse(b64Decode(credential.split('.')[1]))
  } catch {
    return json(400, null, 'Invalid credential')
  }

  console.log('[Google]', payload.email, USE_MOCK ? '[MOCK]' : '[MongoDB]')

  const googleInfo = {
    googleId: payload.sub,
    googleData: {
      sub: payload.sub, email: payload.email, email_verified: payload.email_verified,
      name: payload.name, given_name: payload.given_name, family_name: payload.family_name,
      picture: payload.picture, locale: payload.locale,
    },
  }

  if (USE_MOCK) {
    const db = loadMockDB()
    let citizen = (db.citizens || []).find((c) => c.email === payload.email)

    if (citizen) {
      Object.assign(citizen, {
        firstName: payload.given_name || citizen.firstName,
        lastName: payload.family_name || citizen.lastName,
        picture: payload.picture || citizen.picture,
        ...googleInfo,
        updatedAt: new Date().toISOString(),
      })
    } else {
      const newId = (db.citizens || []).length + 1
      citizen = {
        id: newId, userId: newId,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        email: payload.email, phone: '', idNumber: '', password: '',
        picture: payload.picture || '',
        ...googleInfo,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active',
      }
      db.citizens = db.citizens || []
      db.citizens.push(citizen)
    }
    saveMockDB(db)

    const { password: _, ...safe } = citizen
    return json(200, { citizen: safe, accessToken: signJwt(citizen) }, 'Login successful')
  }

  try {
    const db = await mongo()
    const coll = db.collection('citizens')

    let citizen = await coll.findOne({ email: payload.email })

    if (citizen) {
      await coll.updateOne(
        { _id: citizen._id },
        { $set: { firstName: payload.given_name || citizen.firstName, lastName: payload.family_name || citizen.lastName, picture: payload.picture || citizen.picture, ...googleInfo, updatedAt: new Date() } },
      )
    } else {
      const newId = (await coll.countDocuments()) + 1
      const newCitizen = {
        _id: String(newId), id: newId, userId: newId,
        firstName: payload.given_name || '', lastName: payload.family_name || '',
        email: payload.email, phone: '', idNumber: '', password: '',
        picture: payload.picture || '',
        ...googleInfo, createdAt: new Date(), updatedAt: new Date(), status: 'active',
      }
      await coll.insertOne(newCitizen)
      citizen = newCitizen
    }

    const safe = safeCitizen(citizen)
    return json(200, { citizen: safe, accessToken: signJwt(citizen) }, 'Login successful')
  } catch (err) {
    console.error('[Google MongoDB]', err.message)
    return json(500, null, 'Database error: ' + err.message)
  }
}

// ─────────────────────────────────────────────────────────────────
//  SESSION
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
//  APPLICATIONS / DOCS / TICKETS / NET-WORTH
// ─────────────────────────────────────────────────────────────────

async function doApplications(req) {
  const cid = getCitizenId(bearerToken(req))
  if (!cid) return unauth()
  if (USE_MOCK) return json(200, (loadMockDB().citizenApplications || []).filter((a) => a.citizenId === cid))
  const db = await mongo()
  return json(200, await db.collection('citizenApplications').find({ citizenId: cid }).toArray())
}

async function doDocuments(req) {
  const cid = getCitizenId(bearerToken(req))
  if (!cid) return unauth()
  if (USE_MOCK) return json(200, (loadMockDB().citizenDocuments || []).filter((d) => d.citizenId === cid))
  const db = await mongo()
  return json(200, await db.collection('citizenDocuments').find({ citizenId: cid }).toArray())
}

async function doTickets() {
  if (USE_MOCK) return json(200, loadMockDB().tickets || [])
  const db = await mongo()
  return json(200, await db.collection('tickets').find().toArray())
}

async function doNetWorth(req) {
  const cid = getCitizenId(bearerToken(req))
  if (!cid) return unauth()
  if (USE_MOCK) {
    const db = loadMockDB()
    db.netWorth = db.netWorth || []
    let entry = db.netWorth.find((n) => n.citizenId === cid)
    if (!entry) {
      entry = { id: Date.now(), citizenId: cid, fullName: '', email: '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date().toISOString(), shareName: false }
      db.netWorth.push(entry)
      saveMockDB(db)
    }
    const rankings = [...db.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
    const rank = rankings.findIndex((n) => n.citizenId === cid) + 1
    return json(200, { ...entry, rank, totalParticipants: rankings.length })
  }
  const db = await mongo()
  let entry = await db.collection('netWorth').findOne({ citizenId: cid })
  if (!entry) {
    entry = { id: Date.now(), citizenId: cid, fullName: '', email: '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date(), shareName: false }
    await db.collection('netWorth').insertOne(entry)
  }
  const all = await db.collection('netWorth').find().sort({ netWorth: -1 }).toArray()
  const rank = all.findIndex((n) => n.citizenId === cid) + 1
  return json(200, { ...entry, rank, totalParticipants: all.length })
}

// ─────────────────────────────────────────────────────────────────
//  VERCEL ENTRY POINT
// ─────────────────────────────────────────────────────────────────

module.exports = async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (request.method === 'OPTIONS') return response.status(204).end()

  const p = getPath(request)

  try {
    if (request.method === 'POST' && p === '/citizens/register')
      return sendRes(response, await doRegister(parseBody(request)))

    if (request.method === 'POST' && p === '/citizens/login')
      return sendRes(response, await doLogin(parseBody(request)))

    if (request.method === 'POST' && p === '/citizens/google')
      return sendRes(response, await doGoogleLogin(parseBody(request)))

    if (request.method === 'GET' && p === '/citizens/session')
      return sendRes(response, await doSession(request))

    if (request.method === 'GET' && p === '/citizens/applications')
      return sendRes(response, await doApplications(request))

    if (request.method === 'GET' && p === '/citizens/documents')
      return sendRes(response, await doDocuments(request))

    if (request.method === 'GET' && p === '/citizens/tickets')
      return sendRes(response, await doTickets())

    if (request.method === 'GET' && p === '/citizens/net-worth')
      return sendRes(response, await doNetWorth(request))

    const r = json(404, null, 'Not found')
    return response.status(404).setHeader('Content-Type', 'application/json').send(r.body)
  } catch (err) {
    console.error('[Citizens API]', err.message || err)
    response.status(500).setHeader('Content-Type', 'application/json').send(
      JSON.stringify({ data: null, message: err.message || 'Server Error', success: false })
    )
  }
}

// ── Dev server runner ────────────────────────────────────────────

if (require.main === module) {
  const http = require('http')
  const port = process.env.PORT || 4000
  http.createServer(handler).listen(port, () =>
    console.log('[Citizens API] :' + port, USE_MOCK ? 'MOCK' : '[MongoDB]')
  )
}
