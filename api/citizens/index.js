const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DB_PATH = path.resolve(__dirname, '..', '..', 'mock', 'db.json')

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function respond(status, data, msg = 'Success') {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, message: msg, success: status < 400 }),
  }
}

function makeCitizenToken(citizen) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: citizen.id, email: citizen.email, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', 'citizen-secret').update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

function getPath(request) {
  const url = new URL(request.url, `http://localhost${request.url}`)
  // Strip the /api prefix to get the original path the frontend intended
  const stripped = url.pathname.replace(/^\/api/, '')
  return stripped
}

export default function handler(request, response) {
  if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'GET' && request.method !== 'DELETE') {
    return response.status(405).send(JSON.stringify({ message: 'Method not allowed', success: false }))
  }

  const p = getPath(request)

  let body = {}
  try {
    body = JSON.parse(request.body || '{}')
  } catch {
    body = {}
  }

  const db = loadDB()

  try {
    // POST /citizens/register
    if (request.method === 'POST' && p === '/citizens/register') {
      const { firstName, lastName, email, phone, idNumber, password } = body
      if (db.citizens.find((c) => c.email === email)) {
        return response.status(400).send(JSON.stringify(respond(400, null, 'Email already registered').body))
      }
      if (idNumber && db.citizens.find((c) => c.idNumber === idNumber)) {
        return response.status(400).send(JSON.stringify(respond(400, null, 'ID number already registered').body))
      }
      const citizen = {
        id: db.citizens.length + 1,
        firstName, lastName, email, phone, idNumber, password,
        picture: '', googleId: null, googleData: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active',
      }
      db.citizens.push(citizen)
      saveDB(db)
      const token = makeCitizenToken(citizen)
      const { password: _, ...safe } = citizen
      return response.status(200).send(JSON.stringify(respond(200, { citizen: safe, accessToken: token }, 'Registration successful').body))
    }

    // POST /citizens/login
    if (request.method === 'POST' && p === '/citizens/login') {
      const { identifier, password } = body
      const citizen = db.citizens.find((c) => (c.email === identifier || c.idNumber === identifier) && c.password === password)
      if (!citizen) {
        return response.status(401).send(JSON.stringify(respond(401, null, 'Invalid credentials').body))
      }
      const token = makeCitizenToken(citizen)
      const { password: _, ...safe } = citizen
      return response.status(200).send(JSON.stringify(respond(200, { citizen: safe, accessToken: token }, 'Login successful').body))
    }

    // POST /citizens/google — delegate to dedicated handler if it exists
    if (request.method === 'POST' && p === '/citizens/google') {
      return response.status(501).send(JSON.stringify(respond(501, null, 'Use /api/citizens/google directly').body))
    }

    // GET /citizens/session
    if (request.method === 'GET' && p === '/citizens/session') {
      const auth = request.headers.authorization || ''
      const token = auth.replace('Bearer ', '')
      if (!token.startsWith('mock-citizen-token-')) {
        return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      }
      const citizenId = parseInt(token.replace('mock-citizen-token-', ''))
      const citizen = db.citizens.find((c) => c.id === citizenId)
      if (!citizen) return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      const { password: _, ...safe } = citizen
      return response.status(200).send(JSON.stringify(respond(200, safe).body))
    }

    // GET /citizens/applications
    if (request.method === 'GET' && p === '/citizens/applications') {
      const auth = request.headers.authorization || ''
      const token = auth.replace('Bearer ', '')
      if (!token.startsWith('mock-citizen-token-')) {
        return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      }
      return response.status(200).send(JSON.stringify(respond(200, (db.citizenApplications || []).filter((a) => a.citizenId)).body))
    }

    // GET /citizens/documents
    if (request.method === 'GET' && p === '/citizens/documents') {
      const auth = request.headers.authorization || ''
      const token = auth.replace('Bearer ', '')
      if (!token.startsWith('mock-citizen-token-')) {
        return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      }
      return response.status(200).send(JSON.stringify(respond(200, (db.citizenDocuments || []).filter((d) => d.citizenId)).body))
    }

    // GET /citizens/tickets
    if (request.method === 'GET' && p === '/citizens/tickets') {
      const auth = request.headers.authorization || ''
      const token = auth.replace('Bearer ', '')
      if (!token.startsWith('mock-citizen-token-')) {
        return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      }
      return response.status(200).send(JSON.stringify(respond(200, (db.tickets || []).filter((t) => t.citizenId)).body))
    }

    // GET /citizens/net-worth
    if (request.method === 'GET' && p === '/citizens/net-worth') {
      const auth = request.headers.authorization || ''
      const token = auth.replace('Bearer ', '')
      if (!token.startsWith('mock-citizen-token-')) {
        return response.status(401).send(JSON.stringify(respond(401, null, 'Unauthorized').body))
      }
      const citizenId = parseInt(token.replace('mock-citizen-token-', ''))
      let entry = (db.netWorth || []).find((n) => n.citizenId === citizenId)
      if (!entry) {
        entry = { id: Date.now(), citizenId, fullName: '', email: '', netWorth: 0, assets: [], liabilities: [], updatedAt: new Date().toISOString() }
        if (!db.netWorth) db.netWorth = []
        db.netWorth.push(entry)
      }
      const rankings = [...db.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      const rank = rankings.findIndex((n) => n.citizenId === citizenId) + 1
      return response.status(200).send(JSON.stringify(respond(200, { ...entry, rank, totalParticipants: rankings.length }).body))
    }

    return response.status(404).send(JSON.stringify(respond(404, null, 'Not found').body))
  } catch (err) {
    return response.status(500).send(JSON.stringify(respond(500, null, err.message).body))
  }
}
