import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()

const generateToken = (user) => {
  return jwt.sign(
    { sub: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  )
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) return res.status(401).json({ message: 'Invalid credentials', success: false })
    
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials', success: false })
    
    const token = generateToken(user)
    const { password: _, ...safe } = user.toObject()
    res.json({ data: { user: safe, accessToken: token }, success: true })
  } catch (err) {
    res.status(500).json({ message: err.message, success: false })
  }
})

export default router