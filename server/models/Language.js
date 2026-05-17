import mongoose from 'mongoose'

const languageSchema = new mongoose.Schema({
  id: { type: Number, unique: true, sparse: true },
  code: String,
  name: String,
  isActive: { type: Boolean, default: true }
}, { strict: false })

export default mongoose.model('Language', languageSchema)