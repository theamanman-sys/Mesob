const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DB_PATH = path.resolve(process.cwd(), 'mock', 'db.json')

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}
function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function respond(status, data, msg = 'Success') {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, message: msg, success: status < 400 }) }
}

function b64urlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString()
}

function makeCitizenToken(citizen) {
  const enc = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const header = enc({ alg: 'HS256', typ: 'JWT' })
  const payload = enc({ sub: citizen.id, email: citizen.email, iat: Date.now() })
  const sig = crypto.createHmac('sha256', 'citizen-secret').update(`${header}.${payload}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${payload}.${sig}`
}

function getPath(request) {
  try { return new URL(request.url, 'http://localhost').pathname.replace(/^\/api/, '') } catch { return '' }
}
function bearerToken(request) {
  return (request.headers.authorization || '').replace('Bearer ', '')
}
function parseBody(request) {
  if (!request.body) return {}
  if (typeof request.body === 'object') return request.body
  if (typeof request.body === 'string') { try { return JSON.parse(request.body) } catch { return {} } }
  return {}
}

export default function handler(request, response) {
  if (request.method === 'OPTIONS') return response.status(204).end()

  const p = getPath(request)
  const db = loadDB()

  try {
    if (request.method === 'POST' && p === '/citizens/register') {
      const { firstName, lastName, email, phone, idNumber, password } = parseBody(request)
      if (!email) return response.status(400).send(JSON.stringify(respond(400, null, 'Email required').body))
      if (db.citizens.find((c) => c.email === email)) return response.status(400).send(JSON.stringify(respond(400, null, 'Email already registered').body))
      if (idNumber && db.citizens.find((c) => c.idNumber === idNumber)) return response.status(400).send(JSON.stringify(respond(400, null, 'ID number already registered').body))
      const citizen = { id: db.citizens.length + 1, firstName, lastName, email, phone, idNumber, password: password || '', picture: '', googleId: null, googleData: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active' }
      db.citizens.push(citizen)
      const token = makeCitizenToken(citizen)
      const { password: _, ...safe } = citizen
      return response.status(200).send(JSON.stringify(respond(200, { citizen: safe, accessToken: token }, 'Registration successful').body))
    }

    if (request.method === 'POST' && p === '/citizens/login') {
      const { identifier, password } = parseBody(request)
      const citizen = db.citizens.find((c) => (c.email === identifier || c.idNumber === identifier) && c.password === password)
      if (!citizen) return response.status(401).send(JSON.stringify(respond(401, null, 'Invalid credentials').body))
      const token = makeCitizenToken(citizen)
      const { password: _, ...safe } = citizen
      return response.status(200).send(JSON.stringify(respond(200, { citizen: safe, accessToken: token }, 'Login successful').body))
    }

    // /citizens/google handled by dedicated function
    if (request.method === 'POST' && p === '/citizens/google') {
      return response.status(501).send(JSON.stringify(respond(501, null, 'Use /api/citizens/google directly').body))
    }

    if (request.method === 'GET' && p === '/citizens/session') {
      const token = bearerToken(request)
      if (!token) return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      const citizenId = parseInt(token.replace('mock-citizen-token-', ''), 10)
      const citizen = db.citizens.find((c) => c.id === citizenId)
      if (!citizen) return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      const { password: _, ...safe } = citizen
      return response.status(200).send(JSON.stringify(respond(200, safe).body))
    }

    if (request.method === 'GET' && p === '/citizens/applications') {
      const token = bearerToken(request)
      if (!token) return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      const citizenId = parseInt(token.replace('mock-citizen-token-', ''), 10)
      return response.status(200).send(JSON.stringify(respond(200, (db.citizenApplications || []).filter((a) => a.citizenId === citizenId)).body))
    }

    if (request.method === 'GET' && p === '/citizens/documents') {
      const token = bearerToken(request)
      if (!token) return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      const citizenId = parseInt(token.replace('mock-citizen-token-', ''), 10)
      return response.status(200).send(JSON.stringify(respond(200, (db.citizenDocuments || []).filter((d) => d.citizenId === citizenId)).body))
    }

    if (request.method === 'GET' && p === '/citizens/tickets') {
      return response.status(200).send(JSON.stringify(respond(200, db.tickets || []).body))
    }

    if (request.method === 'GET' && p === '/citizens/net-worth') {
      const token = bearerToken(request)
      if (!token) return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      const citizenId = parseInt(token.replace('mock-citizen-token-', ''), 10)
      let entry = (db.netWorth || []).find((n) => n.citizenId === citizenId)
      if (!entry) {
        entry = { id: Date.now(), citizenId, fullName: '', email: '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date().toISOString() }
        if (!db.netWorth) db.netWorth = []
        db.netWorth.push(entry)
        saveDB(db)
      }
      const rankings = [...db.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const rank = rankings.findIndex((n) => n.citizenId === citizenId) + 1
      return response.status(200).send(JSON.stringify(respond(200, { ...entry, rank, totalParticipants: rankings.length }).body))
    }

    return response.status(404).send(JSON.stringify(respond(404, null, 'Not found').body))
  } catch (err) {
    return response.status(500).send(JSON.stringify(respond(500, null, err.message || 'Server error').body))
  }
}
