import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET
const isDev = process.env.NODE_ENV !== 'production'

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set')
  process.exit(1)
}

const corsOrigins = isDev
  ? ['http://localhost:3000', 'http://localhost:5173']
  : (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)

app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '0')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  if (!isDev) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'")
  }
  next()
})

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/users/login', loginLimiter)
app.use(apiLimiter)

// Load the Vercel serverless handler as catch-all for citizen/ticket/other routes
const _apiModule = await import(pathToFileURL(path.join(__dirname, '..', 'api', 'index.cjs')))
const apiHandler = _apiModule.default

// Strip /with-language and /with-language-and-organization suffixes so existing routes handle them
app.use((req, _res, next) => {
  const p = req.path
  if (p.endsWith('/with-language-and-organization')) {
    req.url = p.replace(/\/with-language-and-organization$/, '')
  } else if (p.endsWith('/with-language')) {
    req.url = p.replace(/\/with-language$/, '')
  }
  next()
})

// Import MongoDB models
import Organization from './models/Organization.js'
import Service from './models/Service.js'
import User from './models/User.js'
import Language from './models/Language.js'

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MongoDB API Server' })
})

// Organizations routes
app.get('/Organizations', async (req, res) => {
  try {
    const items = await Organization.find()
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Organizations/active', async (req, res) => {
  try {
    const items = await Organization.find({ isActive: true })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Organizations/search', async (req, res) => {
  try {
    const term = (req.query.name || req.query.term || '').toLowerCase()
    const items = await Organization.find({ name: { $regex: term, $options: 'i' } })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Organizations/:id', async (req, res) => {
  try {
    const item = await Organization.findOne({ id: parseInt(req.params.id) })
    if (!item) return res.status(404).json({ message: 'Not found', success: false })
    res.json({ data: item, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

// Services routes
app.get('/Services', async (req, res) => {
  try {
    const items = await Service.find()
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Services/organization/:orgId', async (req, res) => {
  try {
    const items = await Service.find({ organizationId: parseInt(req.params.orgId) })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Services/search', async (req, res) => {
  try {
    const term = (req.query.term || '').toLowerCase()
    const items = await Service.find({
      $or: [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ]
    })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Services/search/title', async (req, res) => {
  try {
    const term = (req.query.title || '').toLowerCase()
    const items = await Service.find({ title: { $regex: term, $options: 'i' } })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Services/search/description', async (req, res) => {
  try {
    const term = (req.query.description || '').toLowerCase()
    const items = await Service.find({ description: { $regex: term, $options: 'i' } })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Services/:id', async (req, res) => {
  try {
    const item = await Service.findOne({ id: parseInt(req.params.id) })
    if (!item) return res.status(404).json({ message: 'Not found', success: false })
    res.json({ data: item, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

// Languages routes
app.get('/Languages', async (req, res) => {
  try {
    const items = await Language.find()
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Languages/active', async (req, res) => {
  try {
    const items = await Language.find({ isActive: true })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.get('/Languages/code/:code', async (req, res) => {
  try {
    const lang = await Language.findOne({ code: req.params.code })
    res.json({ data: lang, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

// Users routes
app.post('/users/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ message: 'Username and password required', success: false })

    const user = await User.findOne({ username }).collation({ locale: 'en', strength: 2 })
    if (!user) return res.status(401).json({ message: 'Invalid credentials', success: false })

    const isBcrypt = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))
    const isMatch = isBcrypt
      ? await bcrypt.compare(password, user.password)
      : user.password === password
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials', success: false })
    if (!isBcrypt) {
      user.password = await bcrypt.hash(password, 12)
      await user.save()
    }

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    )
    const { password: _, ...safe } = user.toObject()
    res.json({ data: { user: safe, accessToken: token }, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})
app.post('/users/seed', async (req, res) => {
  try {
    const { secret, username, password, role } = req.body
    if (secret !== process.env.SEED_SECRET) return res.status(403).json({ message: 'Invalid seed secret', success: false })
    const hashed = await bcrypt.hash(password, 12)
    const existing = await User.findOne({ username })
    if (existing) {
      existing.password = hashed
      if (role) existing.role = role
      await existing.save()
      return res.json({ message: 'User updated with hashed password', success: true })
    }
    await User.create({ username, password: hashed, role: role || 'admin', isActive: true })
    res.json({ message: 'User created with hashed password', success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.post('/users/logout', (_req, res) => res.json({ data: null, message: 'Logged out', success: true }))

// Catch-all: forward unhandled routes to the Vercel API handler (citizens, tickets, applications, etc.)
app.use((req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/Organizations') || req.path.startsWith('/Services') || req.path.startsWith('/Languages') || req.path.startsWith('/users/')) return next()
  apiHandler(req, res)
})

// Start server
const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 })
      console.log('Connected to MongoDB')
    }
    app.listen(PORT, () => {
      console.log(`MongoDB API server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Server error:', err.message)
  }
}

startServer()