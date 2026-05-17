const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Use Vercel's process.cwd() — points to the deployment root,
// NOT __dirname which is unreliable after Vercel's bundling step.
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

export default function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).send(JSON.stringify(respond(405, null, 'Method not allowed').body))
  }

  try {
    // Handle both object body and stream body
    const parseBody = (req) => {
      if (!req.body) return {}
      if (typeof req.body === 'object') return req.body
      if (typeof req.body === 'string') { try { return JSON.parse(req.body) } catch { return {} } }
    }

    const { credential } = parseBody(request)
    if (!credential) return response.status(400).send(JSON.stringify(respond(400, null, 'Missing credential').body))

    const payload = JSON.parse(b64urlDecode(credential.split('.')[1]))
    const db = loadDB()

    const googleData = {
      sub: payload.sub, email: payload.email, email_verified: payload.email_verified,
      name: payload.name, given_name: payload.given_name, family_name: payload.family_name,
      picture: payload.picture, locale: payload.locale, aud: payload.aud, iss: payload.iss,
    }

    let citizen = db.citizens.find((c) => c.email === payload.email)

    if (citizen) {
      Object.assign(citizen, {
        firstName: payload.given_name || citizen.firstName,
        lastName: payload.family_name || citizen.lastName,
        picture: payload.picture || citizen.picture,
        googleId: payload.sub, googleData,
        updatedAt: new Date().toISOString(),
      })
    } else {
      citizen = {
        id: db.citizens.length + 1,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        email: payload.email, phone: '', idNumber: '', password: '',
        picture: payload.picture || '',
        googleId: payload.sub, googleData,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'active',
      }
      db.citizens.push(citizen)
    }
    saveDB(db)

    const token = makeCitizenToken(citizen)
    const { password: _, ...safe } = citizen
    return response.status(200).send(JSON.stringify({ data: { citizen: safe, accessToken: token }, message: 'Login successful', success: true }))
  } catch (err) {
    return response.status(500).send(JSON.stringify(respond(500, null, err.message || 'Server error').body))
  }
}
