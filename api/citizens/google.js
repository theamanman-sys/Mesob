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

export default function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).send(JSON.stringify({ message: 'Method not allowed', success: false }))
  }

  try {
    const { credential } = JSON.parse(request.body || '{}')
    if (!credential) {
      return response.status(400).send(JSON.stringify(respond(400, null, 'Missing credential').body))
    }

    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64url').toString())
    const db = loadDB()

    const googleData = {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      locale: payload.locale,
      aud: payload.aud,
      iss: payload.iss,
    }

    let citizen = db.citizens.find((c) => c.email === payload.email)

    if (citizen) {
      Object.assign(citizen, {
        firstName: payload.given_name || citizen.firstName,
        lastName: payload.family_name || citizen.lastName,
        picture: payload.picture || citizen.picture,
        googleId: payload.sub,
        googleData,
        updatedAt: new Date().toISOString(),
      })
      saveDB(db)
    } else {
      citizen = {
        id: db.citizens.length + 1,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        email: payload.email,
        phone: '',
        idNumber: '',
        password: '',
        picture: payload.picture || '',
        googleId: payload.sub,
        googleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
      }
      db.citizens.push(citizen)
      saveDB(db)
    }

    const token = makeCitizenToken(citizen)
    const { password: _, ...safe } = citizen
    const body = JSON.stringify({ data: { citizen: safe, accessToken: token }, message: 'Login successful', success: true })
    return response.status(200).send(body)
  } catch (err) {
    return response.status(400).send(JSON.stringify(respond(400, null, err.message || 'Invalid credential').body))
  }
}
