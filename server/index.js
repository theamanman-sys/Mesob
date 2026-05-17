import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true }))

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
    const user = await User.findOne({ username, password })
    if (!user) return res.status(401).json({ message: 'Invalid credentials', success: false })
    const token = Buffer.from(JSON.stringify({ sub: user._id, username: user.username, role: user.role })).toString('base64url')
    const { password: _, ...safe } = user.toObject()
    res.json({ data: { user: safe, accessToken: token }, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

app.post('/users/logout', (_req, res) => res.json({ data: null, message: 'Logged out', success: true }))

// Start server
const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
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