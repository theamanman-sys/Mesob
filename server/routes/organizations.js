import express from 'express'
import Organization from '../models/Organization.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    let items = await Organization.find()
    const page = parseInt(req.query.page)
    const limit = parseInt(req.query.limit)
    if (page && limit) {
      const start = (page - 1) * limit
      const paged = items.slice(start, start + limit)
      return res.json({ data: paged, total: items.length, success: true })
    }
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/active', async (req, res) => {
  try {
    const items = await Organization.find({ isActive: true })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/search', async (req, res) => {
  try {
    const term = (req.query.name || req.query.term || '').toLowerCase()
    const items = await Organization.find({
      name: { $regex: term, $options: 'i' }
    })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/organization/:orgId', async (req, res) => {
  try {
    const orgId = parseInt(req.params.orgId)
    const items = await Organization.find({ organizationId: orgId })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

export default router