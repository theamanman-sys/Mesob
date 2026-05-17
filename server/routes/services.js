import express from 'express'
import Service from '../models/Service.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    let items = await Service.find()
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

router.get('/organization/:orgId', async (req, res) => {
  try {
    const orgId = parseInt(req.params.orgId)
    const items = await Service.find({ organizationId: orgId })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/search', async (req, res) => {
  try {
    const term = (req.query.title || req.query.term || '').toLowerCase()
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

router.get('/search/title', async (req, res) => {
  try {
    const term = (req.query.title || '').toLowerCase()
    const items = await Service.find({ title: { $regex: term, $options: 'i' } })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/search/description', async (req, res) => {
  try {
    const term = (req.query.description || '').toLowerCase()
    const items = await Service.find({ description: { $regex: term, $options: 'i' } })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = isNaN(req.params.id) ? req.params.id : parseInt(req.params.id)
    const item = await Service.findOne({ id: id })
    if (!item) return res.status(404).json({ message: 'Not found', success: false })
    res.json({ data: item, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

export default router