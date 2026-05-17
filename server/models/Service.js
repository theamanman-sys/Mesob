import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema({
  id: { type: Number, unique: true, sparse: true },
  organizationId: Number,
  title: String,
  description: String,
  processingTime: String,
  ServiceFee: String,
  requirements: [String],
  steps: [{ title: String, desc: String }]
}, { strict: false })

export default mongoose.model('Service', serviceSchema)