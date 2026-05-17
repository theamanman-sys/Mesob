import mongoose from 'mongoose'

const organizationSchema = new mongoose.Schema({
  id: { type: Number, unique: true, sparse: true },
  name: String,
  shortName: String,
  description: String,
  color: String,
  isActive: { type: Boolean, default: true },
  url: String,
  icon: String
}, { strict: false })

export default mongoose.model('Organization', organizationSchema)