import express from 'express'
import Language from '../models/Language.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    let items = await Language.find()
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/active', async (req, res) => {
  try {
    const items = await Language.find({ isActive: true })
    res.json({ data: items, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

router.get('/code/:code', async (req, res) => {
  try {
    const lang = await Language.findOne({ code: req.params.code })
    res.json({ data: lang, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

export default router