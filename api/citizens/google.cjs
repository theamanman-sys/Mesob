require('dotenv').config()

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const IS_VERCEL = !!process.env.VERCEL
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
  const p = b64Encode({ sub: citizen.id, email: citizen.email, iat: Date.now() })
  const s = crypto.createHmac('sha256', 'citizen-secret').update(h + '.' + p)
    .digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return h + '.' + p + '.' + s
}

// ── Response helper ──────────────────────────────────────────────

function json(code, data, message) {
  return { statusCode: code, body: JSON.stringify({ data, message: message || 'Success', success: code < 400 }) }
}

// ── Body parser ──────────────────────────────────────────────────

function parseBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body   // already-parsed by Vercel
  if (typeof request.body === 'string')                       // plain JSON string
    try { return JSON.parse(request.body) } catch { return {} }
  if (Buffer.isBuffer(request.body))                          // raw buffer
    try { return JSON.parse(request.body.toString('utf-8')) } catch { return {} }
  return {}
}

// ── Extract path from request ────────────────────────────────────

function getPath(request) {
  try {
    return new URL(request.url, 'http://localhost').pathname.replace(/^\/api/, '')
  } catch {
    return ''
  }
}

function bearerToken(request) {
  return (request.headers?.authorization || '').replace(/^Bearer\s+/i, '')
}

// ================================================================
//  MOCK DB  (used locally or when MONGODB_URI is absent)
// ================================================================

function loadMock() {
  return JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'))
}

function saveMock(db) {
  // Best-effort: silently ignore if scratch volume is read-only
  try { fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8') } catch (_) {}
}

// ================================================================
//  MONGODB  (used on Vercel when MONGODB_URI env var is set)
// ================================================================

let _mongoConn = null   // cached MongoClient
let _mongoDb = null     // cached db handle

async function getMongo() {
  if (_mongoDb) return _mongoDb

  const { MongoClient } = require('mongodb')
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  })
  await client.connect()
  console.log('[MongoDB] Connected to', new URL(MONGODB_URI).hostname)
  _mongoConn = client
  _mongoDb = client.db()   // db name taken from the URI
  return _mongoDb
}

// ================================================================
//  GOOGLE LOGIN HANDLER
// ================================================================

async function handleGoogleLogin(request) {
  const { credential } = parseBody(request)

  if (!credential) return json(400, null, 'Missing credential')

  let payload
  try {
    payload = JSON.parse(b64Decode(credential.split('.')[1]))
  } catch {
    return json(400, null, 'Invalid credential')
  }

  console.log('[Google] login attempt:', payload.email, USE_MOCK ? 'MOCK' : 'MONGODB')

  const googleInfo = {
    googleId: payload.sub,
    googleData: {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      locale: payload.locale,
    },
  }

  if (USE_MOCK) {
    // ── Mock DB ────────────────────────────────────────────────
    const db = loadMock()
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
        email: payload.email,
        phone: '', idNumber: '', password: '',
        picture: payload.picture || '',
        ...googleInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      }
      db.citizens = db.citizens || []
      db.citizens.push(citizen)
    }
    saveMock(db)

    const { password: _, ...safe } = citizen
    return json(200, { citizen: safe, accessToken: signJwt(citizen) }, 'Login successful')
  }

  // ── MongoDB ──────────────────────────────────────────────────
  try {
    const db = await getMongo()
    const coll = db.collection('citizens')

    let citizen = await coll.findOne({ email: payload.email })

    if (citizen) {
      await coll.updateOne(
        { _id: citizen._id },
        {
          $set: {
            firstName: payload.given_name || citizen.firstName,
            lastName: payload.family_name || citizen.lastName,
            picture: payload.picture || citizen.picture,
            ...googleInfo,
            updatedAt: new Date(),
          },
        },
      )
    } else {
      const newId = (await coll.countDocuments()) + 1
      const newCitizen = {
        _id: newId.toString(),
        id: newId,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        email: payload.email,
        phone: '', idNumber: '', password: '',
        picture: payload.picture || '',
        ...googleInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      }
      await coll.insertOne(newCitizen)
      citizen = newCitizen
    }

    const safe = (({ password, _id, ...rest }) => rest)(citizen)
    return json(200, { citizen: safe, accessToken: signJwt(citizen) }, 'Login successful')
  } catch (err) {
    console.error('[GitHub]', err.message)
    return json(500, null, 'Database error: ' + err.message)
  }
}

// ================================================================
//  MAIN HANDLER  (Vercel entry point)
// ================================================================

async function handler(request, response) {
  // CORS
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (request.method === 'OPTIONS') return response.status(204).end()

  const p = getPath(request)

  // POST /api/citizens/google  — Google OAuth callback
  if (request.method === 'POST' && p === '/citizens/google') {
    const result = await handleGoogleLogin(request)
    response.status(result.statusCode)
      .setHeader('Content-Type', 'application/json')
      .send(result.body)
    return
  }

  // Everything else falls through to /api/citizens/index.cjs
  response.status(404)
    .setHeader('Content-Type', 'application/json')
    .send(JSON.stringify(json(404, null, 'Not found').body))
}

// ================================================================
//  STANDALONE (dev)
// ================================================================

if (require.main === module) {
  const http = require('http')
  const port = process.env.PORT || 4000
  http.createServer(handler).listen(port, () => {
    console.log('[Google Auth] listening on :' + port, USE_MOCK ? '[MOCK]' : '[MongoDB]')
  })
}

module.exports = handler
