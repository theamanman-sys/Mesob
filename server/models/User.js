import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, sparse: true },
  username: { type: String, unique: true },
  email: String,
  password: String,
  role: { type: String, default: 'citizen' },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false }
}, { strict: false })

export default mongoose.model('User', userSchema)