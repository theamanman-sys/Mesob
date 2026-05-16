const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const PORT = 3001
const DB_PATH = path.join(__dirname, 'db.json')

const app = express()
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

function wrap(data, msg = 'Success') {
  return { data, message: msg, success: true }
}

function wrapList(arr, total) {
  return { data: arr, total: total ?? arr.length, success: true }
}

function err(msg, status = 400) {
  return { message: msg, success: false, status }
}

const ADMIN_USER = { id: 1, username: 'admin', email: 'admin@mesobcenter.et', role: 'admin', isActive: true, mustChangePassword: false }

function makeToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: user.id, username: user.username, role: user.role, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', 'mock-secret').update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json(err('Unauthorized', 401))
  }
  next()
}

// ─── Google Auth (mock) ───────────────────────────────────────────────────────

app.post('/auth/google', (req, res) => {
  const { credential } = req.body
  if (!credential) return res.status(400).json(err('Missing credential'))
  try {
    const parts = credential.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    const user = db.users.find(u => u.email === payload.email)
    if (user) {
      const token = makeToken(user)
      const { password, ...safe } = user
      return res.json(wrap({ user: { ...safe, picture: payload.picture }, accessToken: token, isNew: false }))
    }
    const newUser = {
      id: db.users.length + 1,
      username: payload.email.split('@')[0],
      email: payload.email,
      password: '',
      role: 'citizen',
      isActive: true,
      mustChangePassword: false,
      picture: payload.picture,
      googleId: payload.sub,
    }
    db.users.push(newUser); saveDb()
    const token = makeToken(newUser)
    const { password, ...safe } = newUser
    res.json(wrap({ user: safe, accessToken: token, isNew: true }))
  } catch {
    res.status(400).json(err('Invalid credential'))
  }
})

// ─── Auth routes ──────────────────────────────────────────────────────────────

app.post('/users/login', (req, res) => {
  const { username, password } = req.body
  const user = db.users.find(u => u.username === username && u.password === password)
  if (!user) return res.status(401).json(err('Invalid credentials', 401))
  const { password: _, ...safe } = user
  const token = makeToken(user)
  res.json(wrap({ user: safe, accessToken: token }))
})

app.post('/users/logout', (_req, res) => res.json(wrap(null, 'Logged out')))

app.post('/users/register', (req, res) => {
  const { username, email, password } = req.body
  if (db.users.find(u => u.username === username)) return res.status(400).json(err('Username taken'))
  const newUser = { id: db.users.length + 1, username, email, password, role: 'admin', isActive: true, mustChangePassword: false }
  db.users.push(newUser); saveDb()
  const { password: _, ...safe } = newUser
  res.json(wrap(safe, 'User created'))
})

app.post('/users/register-first-admin', (req, res) => {
  if (db.users.length > 0) return res.status(400).json(err('Admin already exists'))
  const { username, email, password } = req.body
  const admin = { id: 1, username, email, password, role: 'admin', isActive: true, mustChangePassword: false }
  db.users.push(admin); saveDb()
  res.json(wrap({ ...admin, password: undefined }, 'First admin created'))
})

app.post('/users/accessToken', (req, res) => {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json(err('No token', 401))
  const user = db.users[0]
  res.json(wrap({ accessToken: makeToken(user) }))
})

app.get('/users/profile', requireAuth, (req, res) => {
  res.json(wrap(ADMIN_USER))
})

app.get('/users/user-count', requireAuth, (_req, res) => {
  res.json(wrap({ total: db.users.length, active: db.users.filter(u => u.isActive).length }))
})

app.get('/users/users', requireAuth, (req, res) => {
  let users = db.users.map(({ password, ...u }) => u)
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const start = (page - 1) * limit
  const paged = users.slice(start, start + limit)
  res.json(wrap({ users: paged, total: users.length, page, limit }))
})

app.get('/users/users/:id', requireAuth, (req, res) => {
  const u = db.users.find(x => x.id === parseInt(req.params.id))
  if (!u) return res.status(404).json(err('Not found', 404))
  const { password, ...safe } = u
  res.json(wrap(safe))
})

app.put('/users/change-email', requireAuth, (req, res) => {
  const user = db.users[0]
  user.email = req.body.email; saveDb()
  res.json(wrap({ ...user, password: undefined }))
})

app.put('/users/change-password', requireAuth, (req, res) => {
  const user = db.users[0]
  if (user.password !== req.body.currentPassword) return res.status(400).json(err('Current password incorrect'))
  user.password = req.body.newPassword; saveDb()
  res.json(wrap(null, 'Password changed'))
})

app.put('/users/users/:id/activate', requireAuth, (req, res) => {
  const u = db.users.find(x => x.id === parseInt(req.params.id))
  if (u) u.isActive = true; saveDb()
  res.json(wrap({ ...u, password: undefined }))
})

app.put('/users/users/:id/deactivate', requireAuth, (req, res) => {
  const u = db.users.find(x => x.id === parseInt(req.params.id))
  if (u) u.isActive = false; saveDb()
  res.json(wrap({ ...u, password: undefined }))
})

app.put('/users/users/:id/unblock', requireAuth, (req, res) => {
  const u = db.users.find(x => x.id === parseInt(req.params.id))
  res.json(wrap({ ...u, password: undefined }))
})

app.put('/users/users/:id/update', requireAuth, (req, res) => {
  const u = db.users.find(x => x.id === parseInt(req.params.id))
  if (!u) return res.status(404).json(err('Not found', 404))
  if (req.body.username) u.username = req.body.username
  if (req.body.email) u.email = req.body.email
  if (req.body.role) u.role = req.body.role
  saveDb()
  res.json(wrap({ ...u, password: undefined }))
})

app.post('/users/users/:id/reset-password', requireAuth, (req, res) => {
  const u = db.users.find(x => x.id === parseInt(req.params.id))
  if (u) u.password = 'reset123'; saveDb()
  res.json(wrap({ newPassword: 'reset123' }))
})

app.delete('/users/users/:id', requireAuth, (req, res) => {
  db.users = db.users.filter(x => x.id !== parseInt(req.params.id)); saveDb()
  res.json(wrap(null, 'Deleted'))
})

// ─── Upload routes ────────────────────────────────────────────────────────────

function handleUpload(req, res, prefix = '') {
  const ext = '.file'
  const fileName = `mock-${Date.now()}${ext}`
  const filePath = `/files/uploads/${prefix}${fileName}`
  res.json(wrap({ url: filePath, path: filePath, fileName }))
}

app.post('/upload/single', (req, res) => handleUpload(req, res))
app.post('/upload/multiple', (req, res) => {
  res.json(wrap({ files: [{ url: `/files/uploads/mock-${Date.now()}.file` }] }))
})
app.post('/upload/video', (req, res) => handleUpload(req, res, 'video-'))
app.post('/upload/news-image', (req, res) => handleUpload(req, res, 'news-'))
app.get('/upload/info', (_req, res) => res.json(wrap({ exists: true, size: 1024 })))
app.delete('/upload/delete', (_req, res) => res.json(wrap(null, 'Deleted')))

// ─── Resource route builder ───────────────────────────────────────────────────

function crud(resource, options = {}) {
  const base = `/${resource}`
  const plural = options.plural || resource
  const getData = () => db[plural] || []
  const idField = options.idField || 'id'
  const searchField = options.searchField || null

  // GET /resource/search?name=...
  if (searchField) {
    app.get(`${base}/search`, (req, res) => {
      const term = (req.query.name || req.query.term || '').toLowerCase()
      const results = getData().filter(item => (item[searchField] || '').toLowerCase().includes(term))
      res.json(wrap(results))
    })
  }

  // GET /resource/active
  if (options.supportsActive) {
    app.get(`${base}/active`, (_req, res) => {
      res.json(wrap(getData().filter(item => item.isActive !== false)))
    })
  }

  // GET /resource/with-language
  if (options.supportsWithLanguage) {
    app.get(`${base}/with-language`, (_req, res) => {
      res.json(wrap(getData()))
    })
  }

  // GET /resource/language/:id
  if (options.supportsLanguage) {
    app.get(`${base}/language/:id`, (req, res) => {
      const langId = parseInt(req.params.id)
      const items = getData()
      const langMap = db.languages?.find(l => l.id === langId)
      return res.json(wrap(items))
    })
    app.get(`${base}/language/:id/latest`, (req, res) => {
      const limit = parseInt(req.query.limit) || 10
      const items = getData().slice(0, limit)
      res.json(wrap(items))
    })
    app.get(`${base}/language/:id/single`, (req, res) => {
      const items = getData()
      res.json(wrap(items[0] || null))
    })
  }

  // GET /resource/organization/:orgId
  if (options.supportsOrganization) {
    app.get(`${base}/organization/:orgId`, (req, res) => {
      const orgId = parseInt(req.params.orgId)
      res.json(wrap(getData().filter(item => item.organizationId === orgId)))
    })
    app.get(`${base}/organization/:orgId/language/:langId`, (req, res) => {
      const orgId = parseInt(req.params.orgId)
      res.json(wrap(getData().filter(item => item.organizationId === orgId)))
    })
  }

  // GET /resource/category/:cat
  if (options.supportsCategory) {
    app.get(`${base}/category/:category`, (req, res) => {
      const cat = req.params.category
      res.json(wrap(getData().filter(item => item.category === cat)))
    })
  }

  // GET /latest
  if (options.supportsLatest) {
    app.get(`${base}/latest`, (req, res) => {
      const limit = parseInt(req.query.limit) || 10
      res.json(wrap(getData().slice(0, limit)))
    })
  }

  // GET /resource/:id/with-language
  if (options.supportsWithLanguage) {
    app.get(`${base}/:id/with-language`, (req, res) => {
      const id = parseInt(req.params.id)
      const item = getData().find(item => item[idField] === id)
      res.json(wrap(item || null))
    })
  }

  // PUT /:id/status
  if (options.supportsStatus) {
    app.put(`${base}/:id/status`, (req, res) => {
      const id = parseInt(req.params.id)
      const idx = getData().findIndex(item => item[idField] === id)
      if (idx === -1) return res.status(404).json(err('Not found', 404))
      db[plural][idx] = { ...db[plural][idx], ...req.body }; saveDb()
      res.json(wrap(db[plural][idx]))
    })
  }

  // GET /resource (list)
  app.get(base, (req, res) => {
    let items = [...getData()]
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    if (page && limit) {
      const start = (page - 1) * limit
      const paged = items.slice(start, start + limit)
      return res.json(wrapList(paged, items.length))
    }
    res.json(wrap(items))
  })

  // GET /resource/:id
  app.get(`${base}/:id`, (req, res) => {
    const id = isNaN(req.params.id) ? req.params.id : parseInt(req.params.id)
    const item = getData().find(item => item[idField] === id)
    if (!item) return res.status(404).json(err('Not found', 404))
    res.json(wrap(item))
  })

  // POST /resource
  app.post(base, (req, res) => {
    const items = getData()
    const maxId = items.reduce((max, item) => Math.max(max, item[idField] || 0), 0)
    const newItem = { [idField]: maxId + 1, ...req.body, id: maxId + 1 }
    db[plural].push(newItem); saveDb()
    res.json(wrap(newItem, 'Created'))
  })

  // PUT /resource/:id
  app.put(`${base}/:id`, (req, res) => {
    const id = parseInt(req.params.id)
    const idx = db[plural].findIndex(item => item[idField] === id)
    if (idx === -1) return res.status(404).json(err('Not found', 404))
    db[plural][idx] = { ...db[plural][idx], ...req.body, [idField]: id }; saveDb()
    res.json(wrap(db[plural][idx], 'Updated'))
  })

  // DELETE /resource/:id
  app.delete(`${base}/:id`, (req, res) => {
    const id = parseInt(req.params.id)
    const idx = db[plural].findIndex(item => item[idField] === id)
    if (idx === -1) return res.status(404).json(err('Not found', 404))
    db[plural].splice(idx, 1); saveDb()
    res.json(wrap(null, 'Deleted'))
  })

  // GET /:id/with-organization
  if (options.supportsWithOrganization) {
    app.get(`${base}/:id/with-organization`, (req, res) => {
      const id = parseInt(req.params.id)
      const item = getData().find(item => item[idField] === id)
      const org = item ? db.organizations.find(o => o.id === item.organizationId) : null
      res.json(wrap({ ...item, organization: org }))
    })
  }
}

// GET /:key (for contact-ui-text)
app.get('/contact-ui-text/key/:key', (req, res) => {
  const items = db.contactUiText.filter(i => i.key === req.params.key)
  res.json(wrap(items))
})

// GET /code/:code (for Languages)
app.get('/Languages/code/:code', (req, res) => {
  const lang = db.languages.find(l => l.code === req.params.code)
  res.json(wrap(lang || null))
})

// ─── Register all resources ──────────────────────────────────────────────────

const resourceConfigs = [
  { resource: 'Organizations', plural: 'organizations', searchField: 'name', supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'Services', plural: 'services', supportsOrganization: true, supportsLanguage: true, supportsWithLanguage: true, supportsWithOrganization: true },
  { resource: 'ServiceCatalog', plural: 'serviceCatalog', searchField: 'name', supportsLanguage: true, supportsWithLanguage: true, supportsOrganization: true },
  { resource: 'Languages', plural: 'languages' },
  { resource: 'GovernmentServices', plural: 'governmentServices', supportsLatest: true },
  { resource: 'AboutUs', plural: 'aboutUs', supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'BannerData', plural: 'bannerData', supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'BannerImages', plural: 'bannerImages', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'Banners', plural: 'bannerData', supportsActive: true },
  { resource: 'messages', plural: 'messages' },
  { resource: 'SocialMediaLinks', plural: 'socialMediaLinks', supportsActive: true },
  { resource: 'BodyTexts', plural: 'bodyTexts', supportsLanguage: true },
  { resource: 'AdvVideo', plural: 'advVideo', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true, supportsStatus: true },
  { resource: 'AdvImage', plural: 'advImage', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true, supportsStatus: true },
  { resource: 'VideoData', plural: 'videoData', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true, supportsLatest: true },
  { resource: 'NewsData', plural: 'newsData', supportsActive: true, supportsCategory: true, supportsLatest: true },
  { resource: 'NewsUiText', plural: 'newsUiText', supportsLanguage: true },
  { resource: 'Locations', plural: 'locations', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'headquarters', plural: 'headquarters', supportsLanguage: true, supportsWithLanguage: true, supportsLatest: true },
  { resource: 'contact-info', plural: 'contactInfo', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'contact-ui-text', plural: 'contactUiText', supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'PopularServices', plural: 'popularServices', supportsActive: true, supportsLanguage: true, supportsWithLanguage: true },
  { resource: 'TranslatedOrganizations', plural: 'translatedOrganizations', supportsLanguage: true, supportsWithOrganization: true },
]

resourceConfigs.forEach(cfg => crud(cfg.resource, cfg))

// GET /BannerImage/byBanner/:id
app.get('/BannerImage/byBanner/:id', (req, res) => {
  const bannerId = parseInt(req.params.id)
  res.json(wrap(db.bannerImages.filter(i => i.bannerId === bannerId)))
})
app.post('/BannerImage', (req, res) => {
  const maxId = db.bannerImages.reduce((m, i) => Math.max(m, i.id || 0), 0)
  const item = { id: maxId + 1, ...req.body }; db.bannerImages.push(item); saveDb()
  res.json(wrap(item, 'Created'))
})
app.put('/BannerImage/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = db.bannerImages.findIndex(i => i.id === id)
  if (idx === -1) return res.status(404).json(err('Not found', 404))
  db.bannerImages[idx] = { ...db.bannerImages[idx], ...req.body, id }; saveDb()
  res.json(wrap(db.bannerImages[idx], 'Updated'))
})
app.delete('/BannerImage/:id', (req, res) => {
  const id = parseInt(req.params.id)
  db.bannerImages = db.bannerImages.filter(i => i.id !== id); saveDb()
  res.json(wrap(null, 'Deleted'))
})

// Search endpoint
app.get('/Services/search/description', (req, res) => {
  const term = (req.query.description || '').toLowerCase()
  res.json(wrap(db.services.filter(s => (s.description || '').toLowerCase().includes(term))))
})
app.get('/Services/search/title', (req, res) => {
  const term = (req.query.title || '').toLowerCase()
  res.json(wrap(db.services.filter(s => (s.title || '').toLowerCase().includes(term))))
})

// Organizations search
app.get('/Organizations/search', (req, res) => {
  const term = (req.query.name || '').toLowerCase()
  res.json(wrap(db.organizations.filter(o => (o.name || '').toLowerCase().includes(term))))
})

// Languages active
app.get('/Languages/active', (_req, res) => {
  res.json(wrap(db.languages.filter(l => l.isActive !== false)))
})

// NewsData search
app.get('/NewsData/search', (req, res) => {
  const term = (req.query.title || '').toLowerCase()
  res.json(wrap(db.newsData.filter(n => (n.title || '').toLowerCase().includes(term))))
})

// headquarters search
app.get('/headquarters/search', (req, res) => {
  const term = (req.query.term || '').toLowerCase()
  res.json(wrap(db.headquarters.filter(h => (h.name || '').toLowerCase().includes(term))))
})

// TranslatedOrganizations sub-routes
app.get('/TranslatedOrganizations/search', (req, res) => {
  const term = (req.query.name || '').toLowerCase()
  res.json(wrap(db.translatedOrganizations.filter(t => (t.name || '').toLowerCase().includes(term))))
})
app.get('/TranslatedOrganizations/with-organization', (_req, res) => res.json(wrap(db.translatedOrganizations)))
app.get('/TranslatedOrganizations/with-organization-and-language', (_req, res) => res.json(wrap(db.translatedOrganizations)))
app.get('/TranslatedOrganizations/organization/:orgId', (req, res) => {
  const orgId = parseInt(req.params.orgId)
  res.json(wrap(db.translatedOrganizations.filter(t => t.organizationId === orgId)))
})

// ServiceCatalog sub-routes
app.get('/ServiceCatalog/with-organization', (_req, res) => res.json(wrap(db.serviceCatalog)))
app.get('/ServiceCatalog/with-language-and-organization', (_req, res) => res.json(wrap(db.serviceCatalog)))
app.get('/Organization/byCatalog', (_req, res) => res.json(wrap([])))

// ─── Citizen auth middleware ──────────────────────────────────────────────

function requireCitizenAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json(err('Unauthorized', 401))
  }
  const token = auth.split(' ')[1]
  try {
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    const citizen = db.citizens.find(c => c.id === payload.sub)
    if (!citizen) return res.status(401).json(err('Unauthorized', 401))
    req.citizen = citizen
    next()
  } catch {
    return res.status(401).json(err('Invalid token', 401))
  }
}

function makeCitizenToken(citizen) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: citizen.id, email: citizen.email, iat: Date.now() })).toString('base64url')
  const sig = crypto.createHmac('sha256', 'citizen-secret').update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${sig}`
}

// ─── Citizen routes ──────────────────────────────────────────────────────

app.post('/citizens/register', (req, res) => {
  const { firstName, lastName, email, phone, idNumber, password } = req.body
  if (db.citizens.find(c => c.email === email)) {
    return res.status(400).json(err('Email already registered'))
  }
  if (idNumber && db.citizens.find(c => c.idNumber === idNumber)) {
    return res.status(400).json(err('ID number already registered'))
  }
  const citizen = {
    id: db.citizens.length + 1,
    firstName, lastName, email, phone, idNumber, password,
    picture: '', googleId: null, googleData: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active'
  }
  db.citizens.push(citizen); saveDb()
  const token = makeCitizenToken(citizen)
  const { password: _, ...safe } = citizen
  res.json(wrap({ citizen: safe, accessToken: token, isNew: true }))
})

app.post('/citizens/login', (req, res) => {
  const { identifier, password } = req.body
  const citizen = db.citizens.find(c =>
    (c.email === identifier || c.idNumber === identifier) && c.password === password
  )
  if (!citizen) return res.status(401).json(err('Invalid credentials'))
  const token = makeCitizenToken(citizen)
  const { password: _, ...safe } = citizen
  res.json(wrap({ citizen: safe, accessToken: token }))
})

app.post('/citizens/google', (req, res) => {
  const { credential } = req.body
  if (!credential) return res.status(400).json(err('Missing credential'))
  try {
    const parts = credential.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    const googleData = {
      sub: payload.sub, email: payload.email, email_verified: payload.email_verified,
      name: payload.name, given_name: payload.given_name, family_name: payload.family_name,
      picture: payload.picture, locale: payload.locale, aud: payload.aud, iss: payload.iss
    }
    let citizen = db.citizens.find(c => c.email === payload.email)
    if (citizen) {
      Object.assign(citizen, {
        firstName: payload.given_name || citizen.firstName,
        lastName: payload.family_name || citizen.lastName,
        picture: payload.picture || citizen.picture,
        googleId: payload.sub, googleData,
        updatedAt: new Date().toISOString()
      })
      saveDb()
    } else {
      citizen = {
        id: db.citizens.length + 1,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        email: payload.email, phone: '', idNumber: '', password: '',
        picture: payload.picture || '',
        googleId: payload.sub, googleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      }
      db.citizens.push(citizen); saveDb()
    }
    const token = makeCitizenToken(citizen)
    const { password: _, ...safe } = citizen
    res.json(wrap({ citizen: safe, accessToken: token }))
  } catch {
    res.status(400).json(err('Invalid credential'))
  }
})

app.get('/citizens/session', requireCitizenAuth, (req, res) => {
  const { password: _, ...safe } = req.citizen
  res.json(wrap(safe))
})

app.put('/citizens/profile', requireCitizenAuth, (req, res) => {
  const citizen = req.citizen
  ;['firstName', 'lastName', 'email', 'phone', 'shareName', 'education', 'experience', 'skills', 'proxyEnabled'].forEach(field => {
    if (req.body[field] !== undefined) citizen[field] = req.body[field]
  })
  citizen.updatedAt = new Date().toISOString()
  saveDb()
  const { password: _, ...safe } = citizen
  res.json(wrap(safe))
})

app.post('/citizens/logout', (_req, res) => res.json(wrap(null, 'Logged out')))

app.get('/citizens/applications', requireCitizenAuth, (req, res) => {
  const apps = (db.citizenApplications || [])
    .filter(a => a.citizenId === req.citizen.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(wrap(apps))
})

app.post('/citizens/applications', requireCitizenAuth, (req, res) => {
  const { serviceId, serviceTitle, formData, documents } = req.body
  if (!db.citizenApplications) db.citizenApplications = []
  const appEntry = {
    id: Date.now().toString(36), citizenId: req.citizen.id,
    serviceId, serviceTitle, formData: formData || {},
    documents: documents || [], status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ status: 'submitted', date: new Date().toISOString(), note: 'Application submitted' }]
  }
  db.citizenApplications.push(appEntry); saveDb()

  // Auto-generate ticket for the application
  if (!db.tickets) db.tickets = []
  const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`
  const appointmentDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
  const ticket = {
    id: db.tickets.length + 1,
    ticketNumber,
    citizenId: req.citizen.id,
    citizenName: `${req.citizen.firstName} ${req.citizen.lastName}`,
    serviceId, serviceTitle,
    department: formData?.department || '',
    fee: formData?.fee ? Number(formData.fee) : Math.floor(Math.random() * 500) + 50,
    timestamp: new Date().toISOString(),
    appointmentDate: appointmentDate.toISOString(),
    appointmentTime: `${String(8 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
    status: 'active',
    createdAt: new Date().toISOString()
  }
  db.tickets.push(ticket); saveDb()

  res.json(wrap({ application: appEntry, ticket }, 'Application submitted with ticket'))
})

app.put('/citizens/applications/:id', requireCitizenAuth, (req, res) => {
  const id = req.params.id
  if (!db.citizenApplications) db.citizenApplications = []
  const idx = db.citizenApplications.findIndex(a => a.id === id && a.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Application not found', 404))
  const { formData, documents, serviceTitle } = req.body
  if (formData !== undefined) db.citizenApplications[idx].formData = formData
  if (documents !== undefined) db.citizenApplications[idx].documents = documents
  if (serviceTitle !== undefined) db.citizenApplications[idx].serviceTitle = serviceTitle
  db.citizenApplications[idx].updatedAt = new Date().toISOString()
  db.citizenApplications[idx].timeline.push({ status: 'updated', date: new Date().toISOString(), note: 'Application updated by citizen' })
  saveDb()
  res.json(wrap(db.citizenApplications[idx], 'Application updated'))
})

app.delete('/citizens/applications/:id', requireCitizenAuth, (req, res) => {
  const id = req.params.id
  if (!db.citizenApplications) db.citizenApplications = []
  const idx = db.citizenApplications.findIndex(a => a.id === id && a.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Application not found', 404))
  db.citizenApplications.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Application cancelled'))
})

app.get('/citizens/documents', requireCitizenAuth, (req, res) => {
  const docs = (db.citizenDocuments || [])
    .filter(d => d.citizenId === req.citizen.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(wrap(docs))
})

app.post('/citizens/documents', requireCitizenAuth, (req, res) => {
  const { name, size, type, dataUrl } = req.body
  if (!db.citizenDocuments) db.citizenDocuments = []
  const doc = { id: Date.now().toString(36), citizenId: req.citizen.id, name, size, type, dataUrl: dataUrl || null, createdAt: new Date().toISOString() }
  db.citizenDocuments.push(doc); saveDb()
  res.json(wrap(doc, 'Document uploaded'))
})

app.put('/citizens/documents/:id', requireCitizenAuth, (req, res) => {
  const id = req.params.id
  const idx = (db.citizenDocuments || []).findIndex(d => d.id === id && d.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Document not found', 404))
  const { name, type, extractedData } = req.body
  if (name !== undefined) db.citizenDocuments[idx].name = name
  if (type !== undefined) db.citizenDocuments[idx].type = type
  if (extractedData !== undefined) db.citizenDocuments[idx].extractedData = extractedData
  db.citizenDocuments[idx].updatedAt = new Date().toISOString()
  saveDb()
  res.json(wrap(db.citizenDocuments[idx], 'Document updated'))
})

app.delete('/citizens/documents/:id', requireCitizenAuth, (req, res) => {
  const id = req.params.id
  const idx = (db.citizenDocuments || []).findIndex(d => d.id === id && d.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Document not found', 404))
  db.citizenDocuments.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Document deleted'))
})

// ─── Citizen Tickets ────────────────────────────────────────────
app.get('/citizens/tickets', requireCitizenAuth, (req, res) => {
  if (!db.tickets) db.tickets = []
  const myTickets = db.tickets.filter(t => t.citizenId === req.citizen.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(wrap(myTickets))
})

// ─── Citizen Fayda ID ──────────────────────────────────────────
app.get('/citizens/fayda-id', requireCitizenAuth, (req, res) => {
  if (!db.citizenFaydaIds) db.citizenFaydaIds = []
  let entry = db.citizenFaydaIds.find(f => f.citizenId === req.citizen.id)
  if (!entry) {
    entry = { id: (db.citizenFaydaIds.length || 0) + 1, citizenId: req.citizen.id, fanNumber: '', finNumber: '', imageUrl: db.sampleFaydaImage || '', verifiedImageUrl: '', status: 'pending', submittedAt: new Date().toISOString() }
    db.citizenFaydaIds.push(entry); saveDb()
  }
  res.json(wrap(entry))
})

app.put('/citizens/fayda-id', requireCitizenAuth, (req, res) => {
  if (!db.citizenFaydaIds) db.citizenFaydaIds = []
  let entry = db.citizenFaydaIds.find(f => f.citizenId === req.citizen.id)
  if (!entry) {
    entry = { id: (db.citizenFaydaIds.length || 0) + 1, citizenId: req.citizen.id, fanNumber: '', finNumber: '', imageUrl: db.sampleFaydaImage || '', verifiedImageUrl: '', status: 'pending', submittedAt: new Date().toISOString() }
    db.citizenFaydaIds.push(entry)
  }
  const { fanNumber, finNumber, verifiedImageUrl } = req.body
  if (fanNumber !== undefined) entry.fanNumber = fanNumber
  if (finNumber !== undefined) entry.finNumber = finNumber
  if (verifiedImageUrl !== undefined) entry.verifiedImageUrl = verifiedImageUrl
  if ((fanNumber || entry.fanNumber) && (finNumber || entry.finNumber)) entry.status = 'submitted'
  saveDb()
  res.json(wrap(entry, 'Fayda ID updated'))
})

// ─── Citizen Verification ──────────────────────────────────────
app.get('/citizens/verifications', requireCitizenAuth, (req, res) => {
  if (!db.citizenVerifications) db.citizenVerifications = []
  const myVerifications = db.citizenVerifications.filter(v => v.citizenId === req.citizen.id)
  // Auto-create missing verification types
  const requiredTypes = ['national_id','passport','drivers_license','tin_certificate','tax_clearance','business_tax','vat_certificate']
  requiredTypes.forEach(type => {
    if (!myVerifications.find(v => v.documentType === type)) {
      const newV = { id: (db.citizenVerifications.length || 0) + 1, citizenId: req.citizen.id, documentType: type, documentName: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), fileUrl: '', status: 'not_submitted', submittedAt: null, verifiedAt: null, adminNotes: '' }
      db.citizenVerifications.push(newV)
      myVerifications.push(newV)
    }
  })
  saveDb()
  res.json(wrap(myVerifications))
})

app.post('/citizens/verifications/:type/submit', requireCitizenAuth, (req, res) => {
  if (!db.citizenVerifications) db.citizenVerifications = []
  const ver = db.citizenVerifications.find(v => v.citizenId === req.citizen.id && v.documentType === req.params.type)
  if (!ver) return res.status(404).json(err('Verification type not found', 404))
  const { fileUrl } = req.body
  ver.fileUrl = fileUrl || ver.fileUrl
  ver.status = 'pending'
  ver.submittedAt = new Date().toISOString()
  ver.adminNotes = ''
  saveDb()
  res.json(wrap(ver, 'Verification submitted'))
})

app.get('/citizens/verification-status', requireCitizenAuth, (req, res) => {
  const vers = (db.citizenVerifications || []).filter(v => v.citizenId === req.citizen.id)
  const verifiedCount = vers.filter(v => v.status === 'verified').length
  const totalDocs = vers.length
  const isMesobVerified = verifiedCount >= 2
  res.json(wrap({
    totalDocuments: totalDocs,
    verifiedDocuments: verifiedCount,
    pendingDocuments: vers.filter(v => v.status === 'pending').length,
    notSubmitted: vers.filter(v => v.status === 'not_submitted').length,
    isMesobVerified,
    allVerified: verifiedCount === totalDocs
  }))
})

// ─── Citizen TIN / Tax ─────────────────────────────────────────
app.get('/citizens/tin', requireCitizenAuth, (req, res) => {
  if (!db.citizenTins) db.citizenTins = []
  let tin = db.citizenTins.find(t => t.citizenId === req.citizen.id)
  if (!tin) {
    tin = { citizenId: req.citizen.id, tinNumber: '', fullName: `${req.citizen.firstName} ${req.citizen.lastName}`, isValid: false, verifiedAt: '', status: 'unregistered' }
    db.citizenTins.push(tin); saveDb()
  }
  res.json(wrap(tin))
})

app.put('/citizens/tin', requireCitizenAuth, (req, res) => {
  if (!db.citizenTins) db.citizenTins = []
  let tin = db.citizenTins.find(t => t.citizenId === req.citizen.id)
  if (!tin) {
    tin = { citizenId: req.citizen.id, tinNumber: '', fullName: `${req.citizen.firstName} ${req.citizen.lastName}`, isValid: false, verifiedAt: '', status: 'unregistered' }
    db.citizenTins.push(tin)
  }
  const { tinNumber } = req.body
  if (tinNumber) {
    tin.tinNumber = tinNumber
    tin.isValid = tinNumber.length >= 10
    tin.verifiedAt = tin.isValid ? new Date().toISOString() : ''
    tin.status = tin.isValid ? 'active' : 'pending'
  }
  saveDb()
  res.json(wrap(tin, tin.isValid ? 'TIN registered successfully' : 'Invalid TIN number'))
})

app.get('/citizens/tax-records', requireCitizenAuth, (req, res) => {
  if (!db.citizenTaxRecords) db.citizenTaxRecords = []
  const records = db.citizenTaxRecords.filter(t => t.citizenId === req.citizen.id)
  const totalPaid = records.reduce((s, t) => s + (t.status === 'paid' ? t.amount : 0), 0)
  const paidCount = records.filter(t => t.status === 'paid').length
  res.json(wrap({ records, totalPaid, paidCount, totalRecords: records.length }))
})

// ─── Citizen Badge / Economy Position ──────────────────────────
app.get('/citizens/badge', requireCitizenAuth, (req, res) => {
  const vers = (db.citizenVerifications || []).filter(v => v.citizenId === req.citizen.id)
  const verifiedDocs = vers.filter(v => v.status === 'verified').length
  const isMesobVerified = verifiedDocs >= 2

  const tin = (db.citizenTins || []).find(t => t.citizenId === req.citizen.id)
  const hasTaxPaid = (db.citizenTaxRecords || []).filter(t => t.citizenId === req.citizen.id && t.status === 'paid').length > 0

  // Economy position
  const rankings = [...(db.netWorth || [])].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
  const rank = rankings.findIndex(n => n.citizenId === req.citizen.id) + 1
  const ownEntry = rankings.find(n => n.citizenId === req.citizen.id)

  res.json(wrap({
    isMesobVerified,
    verifiedDocuments: verifiedDocs,
    hasTaxPaid,
    hasTin: !!(tin?.tinNumber),
    tinStatus: tin?.status || 'unregistered',
    economyRank: rank || 0,
    totalParticipants: rankings.length,
    netWorth: ownEntry?.netWorth || 0,
    badges: {
      mesobVerified: isMesobVerified,
      taxPayer: hasTaxPaid,
      tinRegistered: !!(tin?.tinNumber),
      documentVerified: verifiedDocs > 0
    }
  }))
})

// ─── Admin: Verified Users Dashboard ───────────────────────────
app.get('/admin/verified-stats', requireAuth, (_req, res) => {
  const tins = db.citizenTins || []
  const vers = db.citizenVerifications || []
  const citizens = db.citizens || []
  const verifiedCitizens = citizens.filter(c => {
    const cv = vers.filter(v => v.citizenId === c.id && v.status === 'verified').length
    return cv >= 2
  })
  res.json(wrap({
    totalCitizens: citizens.length,
    verifiedCitizens: verifiedCitizens.length,
    verificationRate: citizens.length > 0 ? ((verifiedCitizens.length / citizens.length) * 100).toFixed(1) : 0,
    tinRegistered: tins.filter(t => t.status === 'active').length,
    pendingVerifications: vers.filter(v => v.status === 'pending').length,
    taxPending: vers.filter(v => ['tin_certificate','tax_clearance','business_tax','vat_certificate'].includes(v.documentType) && v.status === 'pending').length,
    byType: {
      national_id: vers.filter(v => v.documentType === 'national_id' && v.status === 'verified').length,
      passport: vers.filter(v => v.documentType === 'passport' && v.status === 'verified').length,
      drivers_license: vers.filter(v => v.documentType === 'drivers_license' && v.status === 'verified').length,
      tin_certificate: vers.filter(v => v.documentType === 'tin_certificate' && v.status === 'verified').length,
      tax_clearance: vers.filter(v => v.documentType === 'tax_clearance' && v.status === 'verified').length,
      business_tax: vers.filter(v => v.documentType === 'business_tax' && v.status === 'verified').length,
      vat_certificate: vers.filter(v => v.documentType === 'vat_certificate' && v.status === 'verified').length
    }
  }))
})

app.get('/admin/verifications', requireAuth, (_req, res) => {
  const citizens = db.citizens || []
  const vers = (db.citizenVerifications || []).filter(v => v.status !== 'not_submitted').sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
  const enriched = vers.map(v => {
    const c = citizens.find(cit => cit.id === v.citizenId)
    return { ...v, citizenName: c ? `${c.firstName} ${c.lastName}` : 'Unknown', citizenEmail: c?.email || '', citizenPhone: c?.phone || '' }
  })
  res.json(wrap(enriched))
})

app.put('/admin/verifications/:id', requireAuth, (req, res) => {
  const vers = db.citizenVerifications || []
  const ver = vers.find(v => v.id === parseInt(req.params.id))
  if (!ver) return res.status(404).json(err('Verification not found', 404))
  const { status, adminNotes } = req.body
  if (status) ver.status = status
  if (adminNotes !== undefined) ver.adminNotes = adminNotes
  if (status === 'verified' || status === 'rejected') ver.verifiedAt = new Date().toISOString()
  saveDb()
  res.json(wrap(ver, `Verification ${status}`))
})

// ─── Admin: Users (real-time citizen data) ──────────────────────
app.get('/admin/users', requireAuth, (_req, res) => {
  const citizens = db.citizens || []
  const vers = db.citizenVerifications || []
  const tins = db.citizenTins || []
  const netWorth = db.netWorth || []
  const badges = db.verifiedUsers || []

  const enriched = citizens.map(c => {
    const cv = vers.filter(v => v.citizenId === c.id)
    const tin = tins.find(t => t.citizenId === c.id)
    const nw = netWorth.find(n => n.citizenId === c.id)
    const verifiedDocs = cv.filter(v => v.status === 'verified').length
    const badge = badges.find(b => b.citizenId === c.id)

    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: `${c.firstName} ${c.lastName}`,
      email: c.email,
      phone: c.phone,
      shareName: !!c.shareName,
      createdAt: c.createdAt,
      netWorth: nw?.netWorth || 0,
      verifiedDocuments: verifiedDocs,
      totalDocuments: cv.length,
      tinStatus: tin?.status || 'unregistered',
      tinNumber: tin?.tinNumber || '',
      isMesobVerified: verifiedDocs >= 2,
      hasBadge: !!badge,
      education: c.education || [],
      experience: c.experience || [],
      skills: c.skills || []
    }
  })

  res.json(wrap(enriched))
})

// ─── Tickets ────────────────────────────────────────────────────────
app.get('/tickets', requireAuth, (req, res) => {
  if (!db.tickets) db.tickets = []
  res.json(wrap(db.tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
})

app.get('/tickets/stats', requireAuth, (_req, res) => {
  if (!db.tickets) db.tickets = []
  const total = db.tickets.length
  const serviceCounts = {}
  let totalRevenue = 0
  db.tickets.forEach(t => {
    serviceCounts[t.serviceTitle] = (serviceCounts[t.serviceTitle] || 0) + 1
    totalRevenue += t.fee || 0
  })
  const deptSet = new Set(db.tickets.map(t => t.department || '').filter(Boolean))
  res.json(wrap({
    totalTickets: total,
    totalDepartments: deptSet.size,
    totalRevenue,
    serviceCounts,
    topServices: Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
  }))
})

// ─── Net Worth ───────────────────────────────────────────────────────

app.get('/net-worth/rankings', (_req, res) => {
  if (!db.netWorth) db.netWorth = []
  const rankings = [...db.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
  const anonymized = rankings.map((r, i) => ({
    ...r,
    displayName: r.shareName ? r.fullName : `Citizen #${i + 1}`,
    fullName: r.shareName ? r.fullName : `Citizen #${i + 1}`
  }))
  res.json(wrap(anonymized))
})

app.get('/citizens/net-worth', requireCitizenAuth, (req, res) => {
  if (!db.netWorth) db.netWorth = []
  let entry = db.netWorth.find(n => n.citizenId === req.citizen.id)
  if (!entry) {
    entry = { id: db.netWorth.length + 1, citizenId: req.citizen.id, fullName: `${req.citizen.firstName} ${req.citizen.lastName}`, email: req.citizen.email, netWorth: 0, assets: [], liabilities: [], shareName: !!req.citizen.shareName, updatedAt: new Date().toISOString() }
    db.netWorth.push(entry); saveDb()
  }
  const rankings = [...db.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
  const rank = rankings.findIndex(n => n.citizenId === req.citizen.id) + 1
  res.json(wrap({ ...entry, rank, totalParticipants: rankings.length }))
})

app.put('/citizens/net-worth', requireCitizenAuth, (req, res) => {
  if (!db.netWorth) db.netWorth = []
  const { netWorth, assets, liabilities } = req.body
  let entry = db.netWorth.find(n => n.citizenId === req.citizen.id)
  if (!entry) {
    entry = { id: db.netWorth.length + 1, citizenId: req.citizen.id, fullName: `${req.citizen.firstName} ${req.citizen.lastName}`, email: req.citizen.email, netWorth: 0, assets: [], liabilities: [], shareName: !!req.citizen.shareName };
    db.netWorth.push(entry)
  }
  if (netWorth !== undefined) entry.netWorth = Number(netWorth)
  if (assets !== undefined) entry.assets = assets
  if (liabilities !== undefined) entry.liabilities = liabilities
  entry.fullName = `${req.citizen.firstName} ${req.citizen.lastName}`
  entry.email = req.citizen.email
  entry.shareName = !!req.citizen.shareName
  entry.updatedAt = new Date().toISOString()
  saveDb()
  const rankings = [...db.netWorth].sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
  const rank = rankings.findIndex(n => n.citizenId === req.citizen.id) + 1
  res.json(wrap({ ...entry, rank, totalParticipants: rankings.length }))
})

// ─── Contributions ───────────────────────────────────────────────────

app.get('/contributions', (_req, res) => {
  if (!db.contributions) db.contributions = []
  res.json(wrap(db.contributions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
})

app.get('/contributions/stats', (_req, res) => {
  if (!db.contributions) db.contributions = []
  const total = db.contributions.reduce((s, c) => s + (c.amount || 0), 0)
  const byDept = {}
  db.contributions.forEach(c => {
    const dept = c.department || 'Other'
    byDept[dept] = (byDept[dept] || 0) + (c.amount || 0)
  })
  res.json(wrap({ totalContributions: total, contributionCount: db.contributions.length, byDepartment: byDept }))
})

app.post('/contributions', requireCitizenAuth, (req, res) => {
  const { department, amount, message } = req.body
  if (!db.contributions) db.contributions = []
  const contribution = {
    id: db.contributions.length + 1,
    citizenId: req.citizen.id,
    citizenName: `${req.citizen.firstName} ${req.citizen.lastName}`,
    department: department || 'General',
    amount: Number(amount) || 0,
    message: message || '',
    createdAt: new Date().toISOString()
  }
  db.contributions.push(contribution); saveDb()
  res.json(wrap(contribution, 'Contribution submitted'))
})

app.get('/citizens/contributions', requireCitizenAuth, (req, res) => {
  if (!db.contributions) db.contributions = []
  const userContributions = db.contributions.filter(c => c.citizenId === req.citizen.id)
  res.json(wrap(userContributions))
})

// ─── Economy Data ────────────────────────────────────────────────────

app.get('/economy', (_req, res) => {
  res.json(wrap(db.economyData || {}))
})

// ─── Department Budgets ───────────────────────────────────────────
app.get('/budgets', requireAuth, (_req, res) => {
  res.json(wrap(db.departmentBudgets || []))
})

app.get('/budgets/overview', requireAuth, (_req, res) => {
  res.json(wrap(db.budgetOverview || {}))
})

app.get('/budgets/department/:id', requireAuth, (req, res) => {
  const budget = (db.departmentBudgets || []).find(b => b.departmentId === parseInt(req.params.id) || b.id === parseInt(req.params.id))
  if (!budget) return res.status(404).json(err('Budget not found', 404))
  res.json(wrap(budget))
})

app.put('/budgets/department/:id', requireAuth, (req, res) => {
  const budgets = db.departmentBudgets || []
  const idx = budgets.findIndex(b => b.id === parseInt(req.params.id))
  if (idx === -1) return res.status(404).json(err('Budget not found', 404))
  Object.assign(budgets[idx], req.body, { id: budgets[idx].id })
  saveDb()
  res.json(wrap(budgets[idx], 'Budget updated'))
})

// ─── Department Controls ────────────────────────────────────────
app.get('/department-controls', requireAuth, (_req, res) => {
  res.json(wrap(db.departmentControls || {}))
})

app.put('/department-controls', requireAuth, (req, res) => {
  if (!db.departmentControls) db.departmentControls = { departments: [] }
  Object.assign(db.departmentControls, req.body)
  saveDb()
  res.json(wrap(db.departmentControls, 'Controls updated'))
})

app.put('/department-controls/department/:id', requireAuth, (req, res) => {
  if (!db.departmentControls) db.departmentControls = { departments: [] }
  const dept = (db.departmentControls.departments || []).find(d => d.id === parseInt(req.params.id))
  if (!dept) return res.status(404).json(err('Department not found', 404))
  Object.assign(dept, req.body)
  saveDb()
  res.json(wrap(dept, 'Department control updated'))
})

// ─── Population ────────────────────────────────────────────
app.get('/population', requireAuth, (_req, res) => {
  res.json(wrap(db.populationData || {}))
})

app.get('/population/digital-capability', requireAuth, (_req, res) => {
  res.json(wrap(db.digitalCapability || {}))
})

app.get('/population/telecom', requireAuth, (_req, res) => {
  res.json(wrap(db.telecomReach || {}))
})

// ─── Tax Data ──────────────────────────────────────────────
app.get('/tax', requireAuth, (req, res) => {
  let data = [...(db.taxData || [])]
  const { type, region, month, status, department } = req.query
  if (type) data = data.filter(t => t.type === type)
  if (region) data = data.filter(t => t.region === region)
  if (month) data = data.filter(t => t.month === month)
  if (status) data = data.filter(t => t.status === status)
  if (department) data = data.filter(t => t.department === department)
  res.json(wrap(data.sort((a, b) => b.id - a.id)))
})

app.get('/tax/stats', requireAuth, (_req, res) => {
  const taxes = db.taxData || []
  const totalCollected = taxes.reduce((s, t) => s + t.amount, 0)
  const totalTarget = taxes.reduce((s, t) => s + t.target, 0)
  const byType = {}
  const byRegion = {}
  const byMonth = {}
  taxes.forEach(t => {
    byType[t.type] = (byType[t.type] || 0) + t.amount
    byRegion[t.region] = (byRegion[t.region] || 0) + t.amount
    const monthKey = t.month
    byMonth[monthKey] = (byMonth[monthKey] || 0) + t.amount
  })
  res.json(wrap({
    totalCollected, totalTarget, collectionRate: totalTarget > 0 ? (totalCollected / totalTarget * 100).toFixed(1) : 0,
    byType: Object.entries(byType).map(([name, amount]) => ({ name, amount })),
    byRegion: Object.entries(byRegion).map(([name, amount]) => ({ name, amount })),
    byMonth: Object.entries(byMonth).map(([month, amount]) => ({ month, amount })).sort((a, b) => a.month.localeCompare(b.month))
  }))
})

// ─── Wealth Allocator ─────────────────────────────────────
app.get('/allocations', requireAuth, (_req, res) => {
  res.json(wrap((db.wealthAllocations || []).sort((a, b) => new Date(b.allocatedAt) - new Date(a.allocatedAt))))
})

app.get('/allocations/stats', requireAuth, (_req, res) => {
  const allocs = db.wealthAllocations || []
  const totalAllocated = allocs.reduce((s, a) => s + a.amount, 0)
  const approved = allocs.filter(a => a.status === 'approved').reduce((s, a) => s + a.amount, 0)
  const pending = allocs.filter(a => a.status === 'pending').reduce((s, a) => s + a.amount, 0)
  const rejected = allocs.filter(a => a.status === 'rejected').reduce((s, a) => s + a.amount, 0)
  const byType = {}
  const byDepartment = {}
  allocs.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + a.amount
    const dept = a.department || 'Other'
    byDepartment[dept] = (byDepartment[dept] || 0) + a.amount
  })
  res.json(wrap({ totalAllocated, approved, pending, rejected, count: allocs.length,
    byType: Object.entries(byType).map(([name, amount]) => ({ name, amount })),
    byDepartment: Object.entries(byDepartment).map(([name, amount]) => ({ name, amount })) }))
})

app.post('/allocations', requireAuth, (req, res) => {
  if (!db.wealthAllocations) db.wealthAllocations = []
  const { type, targetId, targetName, department, amount, purpose } = req.body
  const alloc = {
    id: (db.wealthAllocations.length || 0) + 1,
    type: type || 'department',
    targetId: targetId || null,
    targetName: targetName || '',
    department: department || '',
    amount: Number(amount) || 0,
    purpose: purpose || '',
    allocatedBy: 'admin',
    allocatedAt: new Date().toISOString(),
    status: 'pending'
  }
  db.wealthAllocations.push(alloc); saveDb()
  res.json(wrap(alloc, 'Allocation created'))
})

app.put('/allocations/:id/status', requireAuth, (req, res) => {
  const allocs = db.wealthAllocations || []
  const alloc = allocs.find(a => a.id === parseInt(req.params.id))
  if (!alloc) return res.status(404).json(err('Allocation not found', 404))
  alloc.status = req.body.status || alloc.status
  saveDb()
  res.json(wrap(alloc, `Allocation ${alloc.status}`))
})

// ─── Admin override: submit application also generates ticket ────────
const originalAppPost = app.post.bind(app)
// ─── Apache APISIX Admin API Simulation ─────────────────────
// Routes management
app.get('/apisix/routes', requireAuth, (_req, res) => {
  res.json(wrap({ total: (db.apisixRoutes || []).length, list: db.apisixRoutes || [] }))
})

app.get('/apisix/routes/:id', requireAuth, (req, res) => {
  const route = (db.apisixRoutes || []).find(r => r.id === req.params.id)
  if (!route) return res.status(404).json(err('Route not found', 404))
  res.json(wrap(route))
})

app.post('/apisix/routes', requireAuth, (req, res) => {
  if (!db.apisixRoutes) db.apisixRoutes = []
  const { name, uri, upstreamId, plugins, departmentId, departmentName, desc, priority } = req.body
  const route = {
    id: `route_${(db.apisixRoutes.length || 0) + 1}`,
    name: name || `route-${Date.now()}`,
    desc: desc || '',
    uri: uri || '/*',
    upstreamId: upstreamId || 'upstream_1',
    plugins: plugins || { cors: {} },
    status: 0,
    departmentId: departmentId || null,
    departmentName: departmentName || '',
    createTime: Math.floor(Date.now() / 1000),
    updateTime: Math.floor(Date.now() / 1000),
    priority: priority || 0
  }
  db.apisixRoutes.push(route); saveDb()
  res.json(wrap(route, 'Route created'))
})

app.put('/apisix/routes/:id', requireAuth, (req, res) => {
  const routes = db.apisixRoutes || []
  const idx = routes.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json(err('Route not found', 404))
  const upd = req.body
  delete upd.id
  Object.assign(routes[idx], upd, { updateTime: Math.floor(Date.now() / 1000) })
  saveDb()
  res.json(wrap(routes[idx], 'Route updated'))
})

app.delete('/apisix/routes/:id', requireAuth, (req, res) => {
  const routes = db.apisixRoutes || []
  const idx = routes.findIndex(r => r.id === req.params.id)
  if (idx === -1) return res.status(404).json(err('Route not found', 404))
  const removed = routes.splice(idx, 1)[0]; saveDb()
  res.json(wrap(removed, 'Route deleted'))
})

app.put('/apisix/routes/:id/status', requireAuth, (req, res) => {
  const routes = db.apisixRoutes || []
  const route = routes.find(r => r.id === req.params.id)
  if (!route) return res.status(404).json(err('Route not found', 404))
  route.status = req.body.status !== undefined ? req.body.status : (route.status ? 0 : 1)
  route.updateTime = Math.floor(Date.now() / 1000)
  saveDb()
  res.json(wrap(route, `Route ${route.status ? 'enabled' : 'disabled'}`))
})

// Upstreams management
app.get('/apisix/upstreams', requireAuth, (_req, res) => {
  res.json(wrap({ total: (db.apisixUpstreams || []).length, list: db.apisixUpstreams || [] }))
})

app.get('/apisix/upstreams/:id', requireAuth, (req, res) => {
  const us = (db.apisixUpstreams || []).find(u => u.id === req.params.id)
  if (!us) return res.status(404).json(err('Upstream not found', 404))
  res.json(wrap(us))
})

app.post('/apisix/upstreams', requireAuth, (req, res) => {
  if (!db.apisixUpstreams) db.apisixUpstreams = []
  const { name, type, nodes, desc } = req.body
  const upstream = {
    id: `upstream_${(db.apisixUpstreams.length || 0) + 1}`,
    name: name || `upstream-${Date.now()}`,
    type: type || 'roundrobin',
    nodes: nodes || [{ host: '127.0.0.1', port: 8080, weight: 1 }],
    timeout: { connect: 5, send: 10, read: 10 },
    desc: desc || ''
  }
  db.apisixUpstreams.push(upstream); saveDb()
  res.json(wrap(upstream, 'Upstream created'))
})

app.put('/apisix/upstreams/:id', requireAuth, (req, res) => {
  const upstreams = db.apisixUpstreams || []
  const idx = upstreams.findIndex(u => u.id === req.params.id)
  if (idx === -1) return res.status(404).json(err('Upstream not found', 404))
  const upd = req.body
  delete upd.id
  Object.assign(upstreams[idx], upd)
  saveDb()
  res.json(wrap(upstreams[idx], 'Upstream updated'))
})

app.delete('/apisix/upstreams/:id', requireAuth, (req, res) => {
  const upstreams = db.apisixUpstreams || []
  const idx = upstreams.findIndex(u => u.id === req.params.id)
  if (idx === -1) return res.status(404).json(err('Upstream not found', 404))
  const removed = upstreams.splice(idx, 1)[0]; saveDb()
  res.json(wrap(removed, 'Upstream deleted'))
})

// Consumers
app.get('/apisix/consumers', requireAuth, (_req, res) => {
  res.json(wrap({ total: (db.apisixConsumers || []).length, list: db.apisixConsumers || [] }))
})

// Plugins
app.get('/apisix/plugins', requireAuth, (_req, res) => {
  res.json(wrap({ total: (db.apisixPlugins || []).length, list: db.apisixPlugins || [] }))
})

// Dashboard stats
app.get('/apisix/dashboard', requireAuth, (_req, res) => {
  const routes = db.apisixRoutes || []
  const upstreams = db.apisixUpstreams || []
  const consumers = db.apisixConsumers || []
  const activeRoutes = routes.filter(r => r.status === 1).length
  const totalRateLimit = routes.reduce((s, r) => {
    const limit = r.plugins?.['rate-limit']
    return s + (limit?.count || 0)
  }, 0)
  res.json(wrap({
    totalRoutes: routes.length, activeRoutes, inactiveRoutes: routes.length - activeRoutes,
    totalUpstreams: upstreams.length, healthyUpstreams: upstreams.filter(u => u.checks?.active?.http_path).length,
    totalConsumers: consumers.length, totalPlugins: (db.apisixPlugins || []).length,
    totalRateLimit, routesByDept: routes.filter(r => r.departmentId).length
  }))
})

// ─── News Proxy (cached fallback + RSS proxy) ──────────────
const https = require('https')

let newsCache = { articles: null, videos: null, lastFetch: 0 }
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function fetchRssAsJson(rssUrl) {
  return new Promise((resolve, reject) => {
    https.get(rssUrl, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          // Simple RSS XML to JSON parser
          const items = []
          const itemRegex = /<item>([\s\S]*?)<\/item>/gi
          let match
          while ((match = itemRegex.exec(data)) !== null) {
            const itemXml = match[1]
            const getTag = (tag) => {
              const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(itemXml)
              return m ? m[1].trim() : ''
            }
            const getAttr = (tag, attr) => {
              const m = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, 'i').exec(itemXml)
              return m ? m[1].trim() : ''
            }
            const mediaMatch = /<media:content[^>]*url=["']([^"']*)["']/i.exec(itemXml)
            items.push({
              title: getTag('title'),
              link: getTag('link'),
              pubDate: getTag('pubDate'),
              description: getTag('description').replace(/<[^>]*>/g, '').substring(0, 300),
              source: getTag('source') || 'Google News',
              image: mediaMatch ? mediaMatch[1] : getAttr('media:thumbnail', 'url') || ''
            })
          }
          resolve(items.slice(0, 20))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

app.get('/news/ethiopia', async (_req, res) => {
  try {
    const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=Ethiopia+government+digital+economy&hl=en-US&gl=US&ceid=US:en')
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`
    const response = await fetch(proxyUrl)
    const json = await response.json()
    if (json && json.items && json.items.length > 0) {
      // Cache the fresh data
      newsCache.articles = json.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.description?.replace(/<[^>]*>/g, '').substring(0, 300) || '',
        source: 'Google News',
        image: item.thumbnail || item.enclosure?.link || ''
      }))
      newsCache.lastFetch = Date.now()
      return res.json(wrap(newsCache.articles))
    }
    throw new Error('No items from RSS')
  } catch {
    // Fallback to cached or db data
    if (newsCache.articles && (Date.now() - newsCache.lastFetch) < CACHE_TTL) {
      return res.json(wrap(newsCache.articles))
    }
    res.json(wrap(db.cachedNews || []))
  }
})

app.get('/news/videos', async (_req, res) => {
  try {
    // Try YouTube RSS via rss2json
    const rssUrl = encodeURIComponent('https://www.youtube.com/feeds/videos.xml?user=FANABroadcasting')
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`
    const response = await fetch(proxyUrl)
    const json = await response.json()
    if (json && json.items && json.items.length > 0) {
      newsCache.videos = json.items.slice(0, 10).map(item => ({
        title: item.title,
        videoId: item.link?.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1] || '',
        channel: item.author || 'YouTube',
        pubDate: item.pubDate,
        description: item.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
        thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.link?.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1] || ''}/hqdefault.jpg`
      })).filter(v => v.videoId)
      newsCache.lastFetch = Date.now()
      return res.json(wrap(newsCache.videos))
    }
    throw new Error('No videos from RSS')
  } catch {
    if (newsCache.videos && (Date.now() - newsCache.lastFetch) < CACHE_TTL) {
      return res.json(wrap(newsCache.videos))
    }
    res.json(wrap(db.cachedVideos || []))
  }
})

// Dashboard news - combined endpoint
app.get('/dashboard/news', async (_req, res) => {
  try {
    const rssUrl = encodeURIComponent('https://news.google.com/rss/search?q=Ethiopia&hl=en-US&gl=US&ceid=US:en')
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`)
    const json = await response.json()
    if (json && json.items && json.items.length > 0) {
      const articles = json.items.slice(0, 8).map(item => ({
        title: item.title, link: item.link, pubDate: item.pubDate,
        description: item.description?.replace(/<[^>]*>/g, '').substring(0, 300) || '',
        source: item.author || 'Google News',
        image: item.thumbnail || ''
      }))
      return res.json(wrap(articles))
    }
    throw new Error('fallback')
  } catch {
    res.json(wrap((db.cachedNews || []).slice(0, 8)))
  }
})

// ─── Citizen Properties ──────────────────────────────────────────────
app.get('/citizens/properties', requireCitizenAuth, (req, res) => {
  const props = (db.citizenProperties || []).filter(p => p.citizenId === req.citizen.id)
  res.json(wrap(props))
})

app.post('/citizens/properties', requireCitizenAuth, (req, res) => {
  if (!db.citizenProperties) db.citizenProperties = []
  const { name, type, location, size, value, status, description, rentalIncome } = req.body
  const p = { id: Date.now(), citizenId: req.citizen.id, name, type: type || 'Residential', location, size: size || '', value: Number(value) || 0, status: status || 'owned', description: description || '', rentalIncome: Number(rentalIncome) || 0, createdAt: new Date().toISOString() }
  db.citizenProperties.push(p); saveDb()
  res.json(wrap(p, 'Property added'))
})

app.put('/citizens/properties/:id', requireCitizenAuth, (req, res) => {
  const p = (db.citizenProperties || []).find(pp => pp.id === parseInt(req.params.id) && pp.citizenId === req.citizen.id)
  if (!p) return res.status(404).json(err('Property not found', 404))
  Object.assign(p, req.body, { updatedAt: new Date().toISOString() }); saveDb()
  res.json(wrap(p, 'Property updated'))
})

app.delete('/citizens/properties/:id', requireCitizenAuth, (req, res) => {
  const idx = (db.citizenProperties || []).findIndex(pp => pp.id === parseInt(req.params.id) && pp.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Property not found', 404))
  db.citizenProperties.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Property removed'))
})

app.post('/citizens/properties/estimate', requireCitizenAuth, (req, res) => {
  const { type, size, location } = req.body
  const baseRates = { Residential: 14000, Commercial: 28000, Land: 8000, Industrial: 22000, Agricultural: 5000 }
  const locationMultiplier = { addis: 1.8, bahir_dar: 1.2, dire_dawa: 1.15, hawassa: 1.1, mekelle: 1.0, adama: 0.95, other: 0.8 }
  const rate = baseRates[type] || 14000
  const locKey = location ? Object.keys(locationMultiplier).find(k => location.toLowerCase().includes(k.replace(/_/g, ' '))) || 'other' : 'other'
  const mult = locationMultiplier[locKey] || 0.8
  const sizeNum = parseInt(size) || 100
  const estimated = Math.round(rate * sizeNum * mult * (0.9 + Math.random() * 0.2))
  res.json(wrap({ estimatedValue: estimated, rate, multiplier: mult, calculation: `${rate} ETB/sqm × ${sizeNum} sqm × ${mult} location factor` }))
})

app.get('/citizens/properties/assets-worth', requireCitizenAuth, (req, res) => {
  const props = (db.citizenProperties || []).filter(p => p.citizenId === req.citizen.id)
  const vehicles = (db.citizenVehicles || []).filter(p => p.citizenId === req.citizen.id)
  const otherAssets = (db.citizenOtherAssets || []).filter(p => p.citizenId === req.citizen.id)
  const totalValue = props.reduce((s, p) => s + p.value, 0) + vehicles.reduce((s, v) => s + v.value, 0) + otherAssets.reduce((s, a) => s + a.value, 0)
  const totalRentalIncome = props.reduce((s, p) => s + (p.rentalIncome || 0), 0)
  const byStatus = { owned: props.filter(p => p.status === 'owned').reduce((s, p) => s + p.value, 0), mortgage: props.filter(p => p.status === 'mortgage').reduce((s, p) => s + p.value, 0), rental: props.filter(p => p.status === 'rental').reduce((s, p) => s + p.value, 0) }
  res.json(wrap({ totalValue, totalRentalIncome, propertyCount: props.length + vehicles.length + otherAssets.length, byStatus }))
})

// ─── Citizen Vehicles ────────────────────────────────────────────────
app.get('/citizens/vehicles', requireCitizenAuth, (req, res) => {
  res.json(wrap((db.citizenVehicles || []).filter(v => v.citizenId === req.citizen.id)))
})

app.post('/citizens/vehicles', requireCitizenAuth, (req, res) => {
  if (!db.citizenVehicles) db.citizenVehicles = []
  const { name, make, model, year, plate, type, value, status, documents, description } = req.body
  const v = { id: Date.now(), citizenId: req.citizen.id, name, make, model, year: year || new Date().getFullYear(), plate: plate || '', type: type || 'Sedan', value: Number(value) || 0, status: status || 'owned', documents: documents || [], description: description || '', createdAt: new Date().toISOString() }
  db.citizenVehicles.push(v); saveDb()
  res.json(wrap(v, 'Vehicle added'))
})

app.put('/citizens/vehicles/:id', requireCitizenAuth, (req, res) => {
  const v = (db.citizenVehicles || []).find(vv => vv.id === parseInt(req.params.id) && vv.citizenId === req.citizen.id)
  if (!v) return res.status(404).json(err('Vehicle not found', 404))
  Object.assign(v, req.body, { updatedAt: new Date().toISOString() }); saveDb()
  res.json(wrap(v, 'Vehicle updated'))
})

app.delete('/citizens/vehicles/:id', requireCitizenAuth, (req, res) => {
  const idx = (db.citizenVehicles || []).findIndex(vv => vv.id === parseInt(req.params.id) && vv.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Vehicle not found', 404))
  db.citizenVehicles.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Vehicle removed'))
})

app.post('/citizens/vehicles/documents/:id', requireCitizenAuth, (req, res) => {
  const v = (db.citizenVehicles || []).find(vv => vv.id === parseInt(req.params.id) && vv.citizenId === req.citizen.id)
  if (!v) return res.status(404).json(err('Vehicle not found', 404))
  if (!v.documents) v.documents = []
  v.documents.push({ id: v.documents.length + 1, name: req.body.name, type: req.body.type, fileUrl: req.body.fileUrl || '', uploadedAt: new Date().toISOString() })
  saveDb()
  res.json(wrap(v, 'Document added'))
})

// ─── Other Assets ────────────────────────────────────────────────────
app.get('/citizens/other-assets', requireCitizenAuth, (req, res) => {
  res.json(wrap((db.citizenOtherAssets || []).filter(a => a.citizenId === req.citizen.id)))
})

app.post('/citizens/other-assets', requireCitizenAuth, (req, res) => {
  if (!db.citizenOtherAssets) db.citizenOtherAssets = []
  const { name, category, value, description, documents } = req.body
  const a = { id: Date.now(), citizenId: req.citizen.id, name, category: category || 'Jewelry', value: Number(value) || 0, description: description || '', documents: documents || [], createdAt: new Date().toISOString() }
  db.citizenOtherAssets.push(a); saveDb()
  res.json(wrap(a, 'Asset added'))
})

app.put('/citizens/other-assets/:id', requireCitizenAuth, (req, res) => {
  const a = (db.citizenOtherAssets || []).find(aa => aa.id === parseInt(req.params.id) && aa.citizenId === req.citizen.id)
  if (!a) return res.status(404).json(err('Asset not found', 404))
  Object.assign(a, req.body, { updatedAt: new Date().toISOString() }); saveDb()
  res.json(wrap(a, 'Asset updated'))
})

app.delete('/citizens/other-assets/:id', requireCitizenAuth, (req, res) => {
  const idx = (db.citizenOtherAssets || []).findIndex(aa => aa.id === parseInt(req.params.id) && aa.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Asset not found', 404))
  db.citizenOtherAssets.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Asset removed'))
})

// ─── Citizen Available Services ──────────────────────────────────────
app.get('/citizens/available-services', requireCitizenAuth, (req, res) => {
  const services = (db.services || []).filter(s => s.isActive !== false).map(s => ({ id: s.id, name: s.name, description: s.description, category: s.category, department: s.department, estimatedCost: s.estimatedCost || 'Free', processingTime: s.processingTime || '3-5 days' }))
  res.json(wrap(services))
})

// ─── Trading ─────────────────────────────────────────────────────────
app.get('/trading/account', requireCitizenAuth, (req, res) => {
  const acct = (db.tradingAccounts || []).find(a => a.citizenId === req.citizen.id)
  res.json(wrap(acct || null))
})

app.post('/trading/account', requireCitizenAuth, (req, res) => {
  if (!db.tradingAccounts) db.tradingAccounts = []
  const existing = db.tradingAccounts.find(a => a.citizenId === req.citizen.id)
  if (existing) return res.status(400).json(err('Account already exists', 400))
  const a = { id: Date.now(), citizenId: req.citizen.id, accountNumber: `MES-TRD-${Date.now().toString(36).toUpperCase()}`, balance: 0, portfolioValue: 0, totalReturn: 0, status: 'active', createdAt: new Date().toISOString() }
  db.tradingAccounts.push(a); saveDb()
  res.json(wrap(a, 'Trading account created'))
})

app.post('/trading/account/deposit', requireCitizenAuth, (req, res) => {
  const acct = (db.tradingAccounts || []).find(a => a.citizenId === req.citizen.id)
  if (!acct) return res.status(404).json(err('No trading account', 404))
  const amount = Number(req.body.amount) || 0
  if (amount <= 0) return res.status(400).json(err('Invalid amount', 400))
  acct.balance += amount; saveDb()
  res.json(wrap(acct, `${amount} ETB deposited`))
})

app.post('/trading/account/withdraw', requireCitizenAuth, (req, res) => {
  const acct = (db.tradingAccounts || []).find(a => a.citizenId === req.citizen.id)
  if (!acct) return res.status(404).json(err('No trading account', 404))
  const amount = Number(req.body.amount) || 0
  if (amount <= 0 || amount > acct.balance) return res.status(400).json(err('Invalid amount or insufficient balance', 400))
  acct.balance -= amount; saveDb()
  res.json(wrap(acct, `${amount} ETB withdrawn`))
})

app.get('/trading/commodities', (_req, res) => {
  res.json(wrap(db.tradingCommodities || []))
})

app.get('/trading/exchange-rates', (_req, res) => {
  res.json(wrap(db.exchangeRates || []))
})

app.post('/trading/orders', requireCitizenAuth, (req, res) => {
  const acct = (db.tradingAccounts || []).find(a => a.citizenId === req.citizen.id)
  if (!acct) return res.status(404).json(err('No trading account', 404))
  if (!db.tradingOrders) db.tradingOrders = []
  const { commodityId, type, quantity, price } = req.body
  const commodity = (db.tradingCommodities || []).find(c => c.id === commodityId)
  if (!commodity) return res.status(404).json(err('Commodity not found', 404))
  const total = quantity * price
  if (type === 'buy' && total > acct.balance) return res.status(400).json(err('Insufficient balance', 400))
  if (type === 'sell') {
    const holding = (db.tradingPortfolio || []).find(h => h.citizenId === req.citizen.id && h.commodityId === commodityId)
    if (!holding || holding.quantity < quantity) return res.status(400).json(err('Insufficient holdings', 400))
  }
  const order = { id: Date.now(), citizenId: req.citizen.id, commodityId, commodityName: commodity.name, type, quantity, price, total, status: 'filled', createdAt: new Date().toISOString() }
  db.tradingOrders.push(order)
  if (type === 'buy') { acct.balance -= total; acct.portfolioValue += total } else { acct.balance += total; acct.portfolioValue -= total }
  if (!db.tradingPortfolio) db.tradingPortfolio = []
  const holding = db.tradingPortfolio.find(h => h.citizenId === req.citizen.id && h.commodityId === commodityId)
  if (holding) { holding.quantity += (type === 'buy' ? quantity : -quantity); holding.avgPrice = ((holding.avgPrice * (holding.quantity - (type === 'buy' ? quantity : -quantity))) + (price * quantity)) / holding.quantity; if (holding.quantity <= 0) db.tradingPortfolio = db.tradingPortfolio.filter(h => h.id !== holding.id) }
  else if (type === 'buy') { db.tradingPortfolio.push({ id: Date.now(), citizenId: req.citizen.id, commodityId, commodityName: commodity.name, quantity, avgPrice: price, currentPrice: commodity.currentPrice }) }
  acct.totalReturn = db.tradingPortfolio.filter(h => h.citizenId === req.citizen.id).reduce((s, h) => s + (h.quantity * (h.currentPrice - h.avgPrice)), 0)
  saveDb()
  res.json(wrap({ order, account: acct, portfolio: db.tradingPortfolio.filter(h => h.citizenId === req.citizen.id) }, `${type} order filled`))
})

app.get('/trading/orders', requireCitizenAuth, (req, res) => {
  res.json(wrap((db.tradingOrders || []).filter(o => o.citizenId === req.citizen.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
})

app.get('/trading/portfolio', requireCitizenAuth, (req, res) => {
  const portfolio = (db.tradingPortfolio || []).filter(h => h.citizenId === req.citizen.id)
  const totalValue = portfolio.reduce((s, h) => s + (h.quantity * h.currentPrice), 0)
  const totalCost = portfolio.reduce((s, h) => s + (h.quantity * h.avgPrice), 0)
  res.json(wrap({ holdings: portfolio, totalValue, totalCost, totalReturn: totalValue - totalCost }))
})

app.get('/trading/all-orders', (_req, res) => {
  res.json(wrap((db.tradingOrders || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50)))
})

// ─── Banks ────────────────────────────────────────────────────────────
const BANKS_LIST = [
  { id: 0, name: 'National Bank of Ethiopia', code: 'NBE', type: 'central', founded: 1906, website: 'https://nbe.gov.et' },
  { id: 1, name: 'Commercial Bank of Ethiopia', code: 'CBE', type: 'public', founded: 1942, website: 'https://www.combanketh.et' },
  { id: 2, name: 'Dashen Bank', code: 'DB', type: 'private', founded: 1995, website: 'https://dashenbanksc.com' },
  { id: 3, name: 'Bank of Abyssinia', code: 'BOA', type: 'private', founded: 1996, website: 'https://www.bankofabyssinia.com' },
  { id: 4, name: 'Wegagen Bank', code: 'WEG', type: 'private', founded: 1997, website: 'https://www.wegagen.com' },
  { id: 5, name: 'United Bank', code: 'UB', type: 'private', founded: 1998, website: 'https://www.unitedbank.com.et' },
  { id: 6, name: 'Nib International Bank', code: 'NIB', type: 'private', founded: 1999, website: 'https://www.nibbank.com' },
  { id: 7, name: 'Awash International Bank', code: 'AIB', type: 'private', founded: 1994, website: 'https://www.awashbank.com' },
  { id: 8, name: 'Abay Bank', code: 'AB', type: 'private', founded: 2010, website: 'https://www.abaybank.com.et' },
  { id: 9, name: 'Zemen Bank', code: 'ZB', type: 'private', founded: 2008, website: 'https://www.zemenbank.com' },
  { id: 10, name: 'Berhan International Bank', code: 'BIB', type: 'private', founded: 2010, website: 'https://www.berhanbank.com' },
  { id: 11, name: 'Buna International Bank', code: 'BUN', type: 'private', founded: 2017, website: 'https://www.bunabank.com' },
  { id: 12, name: 'Oromia International Bank', code: 'OIB', type: 'private', founded: 2008, website: 'https://www.oromiabank.com' },
  { id: 13, name: 'Debub Global Bank', code: 'DGB', type: 'private', founded: 2012, website: 'https://www.debubglobalbank.com' },
  { id: 14, name: 'Enat Bank', code: 'ENAT', type: 'private', founded: 2013, website: 'https://www.enatbank.com' },
  { id: 15, name: 'Lion International Bank', code: 'LIB', type: 'private', founded: 2014, website: 'https://www.lionbank.com' },
  { id: 16, name: 'Gadaa Bank', code: 'GAD', type: 'private', founded: 2021, website: 'https://gadaabank.com.et' }
]

app.get('/banks', (_req, res) => { res.json(wrap(BANKS_LIST)) })

app.get('/citizens/bank-portfolio', requireCitizenAuth, (req, res) => {
  res.json(wrap((db.citizenBankPortfolio || []).filter(b => b.citizenId === req.citizen.id).map(b => { const bk = BANKS_LIST.find(bb => bb.id === b.bankId); return { ...b, bank: bk || null } })))
})

app.post('/citizens/bank-portfolio', requireCitizenAuth, (req, res) => {
  if (!db.citizenBankPortfolio) db.citizenBankPortfolio = []
  const { bankId, accountType, notes } = req.body
  const existing = db.citizenBankPortfolio.find(b => b.citizenId === req.citizen.id && b.bankId === bankId)
  if (existing) return res.status(400).json(err('Bank already in portfolio', 400))
  const bk = BANKS_LIST.find(bb => bb.id === bankId)
  if (!bk) return res.status(404).json(err('Bank not found', 404))
  const entry = { id: Date.now(), citizenId: req.citizen.id, bankId, accountType: accountType || 'savings', notes: notes || '', createdAt: new Date().toISOString() }
  db.citizenBankPortfolio.push(entry); saveDb()
  res.json(wrap({ ...entry, bank: bk }, 'Bank added to portfolio'))
})

app.delete('/citizens/bank-portfolio/:bankId', requireCitizenAuth, (req, res) => {
  const idx = (db.citizenBankPortfolio || []).findIndex(b => b.citizenId === req.citizen.id && b.bankId === parseInt(req.params.bankId))
  if (idx === -1) return res.status(404).json(err('Bank not in portfolio', 404))
  db.citizenBankPortfolio.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Bank removed from portfolio'))
})

app.get('/proxy/bank', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).send('Missing url param')
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    let html = await response.text()
    html = html.replace(/<meta[^>]*X-Frame-Options[^>]*>/gi, '').replace(/<meta[^>]*frame-ancestors[^>]*>/gi, '').replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')
    res.set('X-Frame-Options', '').set('Content-Security-Policy', '').send(html)
  } catch { res.status(502).send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Unable to load bank website</h2></body></html>') }
})

// ─── Business News Proxy ──────────────────────────────────────────────
app.get('/business-news', async (_req, res) => {
  const cache = db.cachedBusinessNews || []
  if (cache.length > 0 && (Date.now() - (cache._lastFetch || 0)) < 1800000) {
    const { _lastFetch, ...items } = cache
    return res.json(wrap(items))
  }
  const fallback = [
    { title: 'Ethiopia\'s Economy Grows 6.5% in Fiscal Year', source: 'Ethiopian News Agency', publishedAt: new Date().toISOString(), url: 'https://www.ena.et', description: 'The National Bank of Ethiopia reports steady economic growth driven by agriculture and services sectors.', category: 'economy' },
    { title: 'Coffee Exports Reach Record $1.4B', source: 'Ethiopian Commodity Exchange', publishedAt: new Date().toISOString(), url: 'https://www.ecx.com.et', description: 'Ethiopian coffee exports hit an all-time high as global demand for specialty coffee continues to rise.', category: 'commodities' },
    { title: 'New Banking Regulation Opens Sector to Foreign Investors', source: 'The Reporter', publishedAt: new Date().toISOString(), url: 'https://www.thereporterethiopia.com', description: 'Ethiopian parliament passes law allowing foreign banks to establish operations in the country.', category: 'finance' },
    { title: 'Ethiopia Launches Digital Currency Pilot', source: 'Capital Ethiopia', publishedAt: new Date().toISOString(), url: 'https://www.capitalethiopia.com', description: 'The National Bank of Ethiopia launches a central bank digital currency pilot program.', category: 'technology' },
    { title: 'Construction Sector Booms with New Infrastructure Projects', source: 'Fortune Ethiopia', publishedAt: new Date().toISOString(), url: 'https://www.fortuneethiopia.com', description: 'Major infrastructure investments drive growth in Ethiopia\'s construction sector.', category: 'economy' },
    { title: 'Ethiopian Airlines Reports Record Revenue', source: 'Addis Fortune', publishedAt: new Date().toISOString(), url: 'https://www.addisfortune.com', description: 'Africa\'s largest carrier posts record revenue, expands routes to new destinations.', category: 'business' },
    { title: 'Gold Mining Output Increases 15% Year-over-Year', source: 'Mining Ethiopia', publishedAt: new Date().toISOString(), url: '#', description: 'Ethiopia\'s gold production sees significant increase as new mining operations come online.', category: 'commodities' },
    { title: 'Stock Market Development: Ethiopia Prepares for Exchange Launch', source: 'Bloomberg', publishedAt: new Date().toISOString(), url: '#', description: 'Ethiopia moves forward with plans to establish a securities exchange, aiming to boost capital markets.', category: 'finance' }
  ]
  db.cachedBusinessNews = [...fallback, { _lastFetch: Date.now() }]; saveDb()
  res.json(wrap(fallback))
})

// ─── Mekina.net Proxy ────────────────────────────────────────────────
app.get('/proxy/mekina', async (_req, res) => {
  try {
    const response = await fetch('https://mekina.net', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    let html = await response.text()
    html = html.replace(/<meta[^>]*X-Frame-Options[^>]*>/gi, '').replace(/<meta[^>]*frame-ancestors[^>]*>/gi, '').replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')
    res.set('X-Frame-Options', '').set('Content-Security-Policy', '').send(html)
  } catch {
    res.status(502).send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Unable to load Mekina listings</h2><p>Please visit <a href="https://mekina.net" target="_blank">mekina.net</a> directly.</p></body></html>')
  }
})

// ─── Legal Cases ────────────────────────────────────────────────────
app.get('/citizens/legal-cases', requireCitizenAuth, (req, res) => {
  const cases = (db.legalCases || []).filter(c => c.citizenId === req.citizen.id || c.lawyers?.includes(req.citizen.id) || c.guardians?.includes(req.citizen.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json(wrap(cases))
})

app.post('/citizens/legal-cases', requireCitizenAuth, (req, res) => {
  if (!db.legalCases) db.legalCases = []
  const c = { id: Date.now(), citizenId: req.citizen.id, caseNumber: `LEG-${Date.now().toString(36).toUpperCase()}`, title: req.body.title, description: req.body.description || '', type: req.body.type || 'civil', status: 'open', lawyers: req.body.lawyers || [], guardians: req.body.guardians || [], documents: req.body.documents || [], courtDecisions: [], hearings: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  db.legalCases.push(c); saveDb()
  res.json(wrap(c, 'Case created'))
})

app.put('/citizens/legal-cases/:id', requireCitizenAuth, (req, res) => {
  const c = (db.legalCases || []).find(caseItem => caseItem.id === parseInt(req.params.id) && caseItem.citizenId === req.citizen.id)
  if (!c) return res.status(404).json(err('Case not found', 404))
  ;['title','description','type','lawyers','guardians','documents'].forEach(f => { if (req.body[f] !== undefined) c[f] = req.body[f] })
  c.updatedAt = new Date().toISOString(); saveDb()
  res.json(wrap(c, 'Case updated'))
})

app.put('/citizens/legal-cases/:id/decisions', requireCitizenAuth, (req, res) => {
  const c = (db.legalCases || []).find(caseItem => caseItem.id === parseInt(req.params.id))
  if (!c) return res.status(404).json(err('Case not found', 404))
  if (!c.courtDecisions) c.courtDecisions = []
  c.courtDecisions.push({ id: c.courtDecisions.length + 1, decision: req.body.decision, date: req.body.date || new Date().toISOString(), by: req.body.by || 'Court', note: req.body.note || '', createdAt: new Date().toISOString() })
  if (req.body.status) c.status = req.body.status
  c.updatedAt = new Date().toISOString(); saveDb()
  res.json(wrap(c, 'Decision added'))
})

app.post('/citizens/legal-cases/:id/hearings', requireCitizenAuth, (req, res) => {
  const c = (db.legalCases || []).find(caseItem => caseItem.id === parseInt(req.params.id))
  if (!c) return res.status(404).json(err('Case not found', 404))
  if (!c.hearings) c.hearings = []
  c.hearings.push({ id: c.hearings.length + 1, date: req.body.date, time: req.body.time || '10:00', location: req.body.location || 'Court', notes: req.body.notes || '', createdAt: new Date().toISOString() })
  c.updatedAt = new Date().toISOString(); saveDb()
  res.json(wrap(c, 'Hearing scheduled'))
})

// ─── Proxies / Lawyers / Guardians ─────────────────────────────────
app.get('/citizens/proxies', requireCitizenAuth, (req, res) => {
  const proxies = (db.proxies || []).filter(p => p.citizenId === req.citizen.id || p.proxyId === req.citizen.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const enriched = proxies.map(p => { const proxyCitizen = (db.citizens || []).find(c => c.id === p.proxyId); const owner = (db.citizens || []).find(c => c.id === p.citizenId); return { ...p, proxyName: proxyCitizen ? `${proxyCitizen.firstName} ${proxyCitizen.lastName}` : 'Unknown', proxyEmail: proxyCitizen?.email || '', ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown', ownerEmail: owner?.email || '' } })
  res.json(wrap(enriched))
})

app.post('/citizens/proxies', requireCitizenAuth, (req, res) => {
  if (!db.proxies) db.proxies = []
  const { proxyId, type, permissions } = req.body
  if (!proxyId) return res.status(400).json(err('proxyId required', 400))
  const existing = db.proxies.find(p => p.citizenId === req.citizen.id && p.proxyId === parseInt(proxyId))
  if (existing) return res.status(400).json(err('Proxy already exists', 400))
  const proxyEntry = { id: Date.now(), citizenId: req.citizen.id, proxyId: parseInt(proxyId), type: type || 'proxy', permissions: permissions || [], status: 'active', createdAt: new Date().toISOString() }
  db.proxies.push(proxyEntry); saveDb()
  res.json(wrap(proxyEntry, 'Proxy added'))
})

app.put('/citizens/proxies/:id/status', requireCitizenAuth, (req, res) => {
  const p = (db.proxies || []).find(proxy => proxy.id === parseInt(req.params.id) && (proxy.citizenId === req.citizen.id || proxy.proxyId === req.citizen.id))
  if (!p) return res.status(404).json(err('Proxy not found', 404))
  const { status } = req.body
  if (status) p.status = status
  saveDb()
  res.json(wrap(p, `Proxy ${status}`))
})

// Users with proxy enabled (for adding as proxy)
app.get('/citizens/available-proxies', requireCitizenAuth, (_req, res) => {
  const citizens = (db.citizens || []).filter(c => c.proxyEnabled && c.id !== _req.citizen.id)
  const result = citizens.map(c => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, fullName: `${c.firstName} ${c.lastName}`, email: c.email }))
  res.json(wrap(result))
})

// ─── Document Linking ───────────────────────────────────────────────
app.get('/citizens/linked-documents', requireCitizenAuth, (req, res) => {
  const linked = (db.linkedDocuments || []).filter(l => l.citizenId === req.citizen.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const enriched = linked.map(l => { const doc = (db.citizenVerifications || []).find(v => v.id === l.documentId); return { ...l, document: doc || null } })
  res.json(wrap(enriched))
})

app.post('/citizens/linked-documents', requireCitizenAuth, (req, res) => {
  if (!db.linkedDocuments) db.linkedDocuments = []
  const { documentId, serviceType, department } = req.body
  const existing = db.linkedDocuments.find(l => l.citizenId === req.citizen.id && l.documentId === documentId && l.serviceType === serviceType)
  if (existing) return res.status(400).json(err('Document already linked to this service', 400))
  const link = { id: Date.now(), citizenId: req.citizen.id, documentId, serviceType: serviceType || 'general', department: department || '', status: 'linked', createdAt: new Date().toISOString() }
  db.linkedDocuments.push(link); saveDb()
  res.json(wrap(link, 'Document linked'))
})

app.delete('/citizens/linked-documents/:id', requireCitizenAuth, (req, res) => {
  const idx = (db.linkedDocuments || []).findIndex(l => l.id === parseInt(req.params.id) && l.citizenId === req.citizen.id)
  if (idx === -1) return res.status(404).json(err('Link not found', 404))
  db.linkedDocuments.splice(idx, 1); saveDb()
  res.json(wrap(null, 'Link removed'))
})

// ─── Jobs ────────────────────────────────────────────────────────────
app.get('/jobs', (_req, res) => {
  const { category, search, type } = _req.query
  let jobs = [...(db.jobs || [])].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
  if (category) jobs = jobs.filter(j => j.category === category)
  if (type) jobs = jobs.filter(j => j.type === type)
  if (search) { const q = search.toLowerCase(); jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.description.toLowerCase().includes(q)) }
  res.json(wrap(jobs))
})

app.get('/jobs/:id', (_req, res) => {
  const job = (db.jobs || []).find(j => j.id === parseInt(_req.params.id))
  if (!job) return res.status(404).json(err('Job not found', 404))
  res.json(wrap(job))
})

app.post('/jobs/apply', requireCitizenAuth, (req, res) => {
  if (!db.jobApplications) db.jobApplications = []
  const { jobId, coverLetter } = req.body
  const job = (db.jobs || []).find(j => j.id === jobId)
  if (!job) return res.status(404).json(err('Job not found', 404))
  const existing = db.jobApplications.find(a => a.jobId === jobId && a.citizenId === req.citizen.id)
  if (existing) return res.status(400).json(err('Already applied', 400))
  const app = { id: Date.now(), jobId, citizenId: req.citizen.id, fullName: `${req.citizen.firstName} ${req.citizen.lastName}`, email: req.citizen.email, coverLetter: coverLetter || '', status: 'submitted', createdAt: new Date().toISOString(), citizenData: { education: req.citizen.education || [], experience: req.citizen.experience || [], skills: req.citizen.skills || [] } }
  db.jobApplications.push(app); saveDb()
  res.json(wrap(app, 'Application submitted'))
})

app.get('/citizens/job-applications', requireCitizenAuth, (req, res) => {
  const apps = (db.jobApplications || []).filter(a => a.citizenId === req.citizen.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const enriched = apps.map(a => { const j = (db.jobs || []).find(jj => jj.id === a.jobId); return { ...a, job: j || null } })
  res.json(wrap(enriched))
})

app.get('/citizens/job-suggestions', requireCitizenAuth, (req, res) => {
  const vers = (db.citizenVerifications || []).filter(v => v.citizenId === req.citizen.id && v.status === 'verified')
  const docTypes = vers.map(v => v.documentType)
  const skills = req.citizen.skills || []
  const edu = req.citizen.education || []
  const hasDrivingLicense = docTypes.includes('drivers_license')
  const hasTinCert = docTypes.includes('tin_certificate')
  const hasTaxClearance = docTypes.includes('tax_clearance')
  const eduLevels = edu.map(e => (e.level || '').toLowerCase())
  const isDegree = eduLevels.some(l => ['bachelor','master','phd','degree','bsc','msc'].includes(l))
  const isDiploma = eduLevels.some(l => ['diploma','certificate'].includes(l))
  let jobs = [...(db.jobs || [])]
  const scored = jobs.map(j => {
    let score = 0
    const title = (j.title || '').toLowerCase()
    const desc = ((j.description || '') + ' ' + (j.requirements || '')).toLowerCase()
    if (hasDrivingLicense && (title.includes('driver') || desc.includes('driver') || desc.includes('driving') || desc.includes('transport'))) score += 3
    if (hasTinCert && (title.includes('account') || title.includes('tax') || title.includes('finance') || desc.includes('tax') || desc.includes('accounting'))) score += 3
    if (hasTaxClearance && (desc.includes('tax') || desc.includes('clearance') || desc.includes('compliance'))) score += 2
    if (isDegree && (desc.includes('degree') || desc.includes('bachelor') || desc.includes('graduate'))) score += 3
    if (isDiploma && (desc.includes('diploma') || desc.includes('certificate'))) score += 2
    skills.forEach(s => { if (desc.includes(s.toLowerCase())) score += 2 })
    edu.forEach(e => { if (e.field && desc.includes(e.field.toLowerCase())) score += 2 })
    return { ...j, matchScore: score }
  })
  const sorted = scored.filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore)
  res.json(wrap({ suggestions: sorted.slice(0, 10), totalJobs: jobs.length, matchedCount: sorted.length }))
})

app.get('/admin/job-applications', requireAuth, (_req, res) => {
  const apps = (db.jobApplications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const enriched = apps.map(a => { const j = (db.jobs || []).find(jj => jj.id === a.jobId); const c = (db.citizens || []).find(cc => cc.id === a.citizenId); return { ...a, job: j || null, citizen: c ? { firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, education: c.education || [], experience: c.experience || [], skills: c.skills || [] } : null } })
  res.json(wrap(enriched))
})

app.put('/admin/job-applications/:id', requireAuth, (req, res) => {
  const app = (db.jobApplications || []).find(a => a.id === parseInt(req.params.id))
  if (!app) return res.status(404).json(err('Application not found', 404))
  const { status, adminNotes } = req.body
  if (status) app.status = status
  if (adminNotes !== undefined) app.adminNotes = adminNotes
  app.updatedAt = new Date().toISOString(); saveDb()
  res.json(wrap(app, `Application ${status}`))
})

// ─── Admin Legal Routes ──────────────────────────────────────────────
app.get('/admin/legal-cases', requireAuth, (_req, res) => {
  const cases = (db.legalCases || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  const enriched = cases.map(c => { const ct = (db.citizens || []).find(cc => cc.id === c.citizenId); return { ...c, citizenName: ct ? `${ct.firstName} ${ct.lastName}` : null } })
  res.json(wrap(enriched))
})

app.put('/admin/legal-cases/:id/status', requireAuth, (req, res) => {
  const c = (db.legalCases || []).find(cc => cc.id === parseInt(req.params.id))
  if (!c) return res.status(404).json(err('Case not found', 404))
  c.status = req.body.status; c.updatedAt = new Date().toISOString(); saveDb()
  res.json(wrap(c, `Status updated to ${req.body.status}`))
})

app.get('/admin/proxies', requireAuth, (_req, res) => {
  const proxies = (db.proxies || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const enriched = proxies.map(p => { const ct = (db.citizens || []).find(cc => cc.id === p.citizenId); const pr = (db.citizens || []).find(cc => cc.id === p.proxyId); return { ...p, ownerName: ct ? `${ct.firstName} ${ct.lastName}` : null, proxyName: pr ? `${pr.firstName} ${pr.lastName}` : 'Unknown', proxyEmail: pr ? pr.email : '' } })
  res.json(wrap(enriched))
})

app.get('/admin/linked-documents', requireAuth, (_req, res) => {
  const links = (db.linkedDocuments || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const enriched = links.map(l => { const ct = (db.citizens || []).find(cc => cc.id === l.citizenId); const doc = (db.citizenDocuments || []).find(d => d.id === l.documentId); return { ...l, citizenName: ct ? `${ct.firstName} ${ct.lastName}` : null, document: doc || null } })
  res.json(wrap(enriched))
})

// ─── EthioJobs Proxy ────────────────────────────────────────────────
app.get('/jobs/external', async (_req, res) => {
  const cache = db.jobsCache || { jobs: [], lastFetch: 0 }
  if (cache.jobs.length > 0 && (Date.now() - cache.lastFetch) < 3600000) return res.json(wrap(cache.jobs))
  try {
    const response = await fetch('https://www.ethiojobs.net/api/jobs?limit=10')
    const json = await response.json()
    if (json && json.length > 0) { db.jobsCache = { jobs: json, lastFetch: Date.now() }; saveDb(); return res.json(wrap(json)) }
    throw new Error('fallback')
  } catch { res.json(wrap(cache.jobs || [])) }
})

// ─── E-Services Proxy ──────────────────────────────────────────────
app.get('/proxy/eservices', async (_req, res) => {
  try {
    const response = await fetch('https://www.eservices.gov.et/en', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    let html = await response.text()
    html = html.replace(/<meta[^>]*X-Frame-Options[^>]*>/gi, '')
    html = html.replace(/<meta[^>]*frame-ancestors[^>]*>/gi, '')
    html = html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '')
    res.set('X-Frame-Options', '').set('Content-Security-Policy', '').send(html)
  } catch {
    res.status(502).send('<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Unable to load E-Services portal</h2><p>Please visit <a href="https://www.eservices.gov.et/en" target="_blank">eservices.gov.et</a> directly.</p></body></html>')
  }
})

// Error handler
app.use((_req, res) => res.status(404).json(err('Not found', 404)))

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`)
  console.log(`Demo admin: admin / admin123`)
})
