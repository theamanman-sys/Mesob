import { motion } from 'framer-motion'
import { Globe, ArrowUpRight } from 'lucide-react'

export default function CitizenEservices() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">E-Services</h1>
        <p className="text-gray-500 mt-1">Access Ethiopian government e-services</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto">
        <Globe className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">eservices.gov.et</h2>
        <p className="text-gray-500 mb-6">Ethiopian government e-services portal for online service delivery.</p>
        <a href="https://www.eservices.gov.et/en" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200">Open E-Services Portal <ArrowUpRight className="w-5 h-5" /></a>
      </motion.div>
    </div>
  )
}
