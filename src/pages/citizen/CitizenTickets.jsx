import { motion } from 'framer-motion'
import { Calendar, ExternalLink } from 'lucide-react'

export default function CitizenTickets() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Book Appointment</h1>
        <p className="text-gray-500 mt-1">Schedule your service appointments via Qetero</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50">
          <Calendar className="w-5 h-5 text-blue-600" /><h2 className="font-semibold text-gray-800">Qetero Appointment Booking</h2>
        </div>
        <div className="bg-gray-50 p-2">
          <iframe src="https://qetero.com" title="Qetero Appointment Booking" className="w-full h-[600px] rounded-xl border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
        <div className="p-3 bg-blue-50 text-xs text-blue-700 flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Qetero is a third-party appointment booking platform integrated for your convenience.</div>
      </motion.div>
    </div>
  )
}
