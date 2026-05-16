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
  ;['firstName', 'lastName', 'email', 'phone'].forEach(field => {
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
  const app = {
    id: Date.now().toString(36), citizenId: req.citizen.id,
    serviceId, serviceTitle, formData: formData || {},
    documents: documents || [], status: 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [{ status: 'submitted', date: new Date().toISOString(), note: 'Application submitted' }]
  }
  db.citizenApplications.push(app); saveDb()
  res.json(wrap(app, 'Application submitted'))
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

// Error handler
app.use((_req, res) => res.status(404).json(err('Not found', 404)))

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`)
  console.log(`Demo admin: admin / admin123`)
})
