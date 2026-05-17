import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ticket, Calendar, Clock, FileText, Search, ExternalLink, X, ChevronDown } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

const statusConfig = {
  active: { color: 'text-green-700', bg: 'bg-green-100' },
  completed: { color: 'text-gray-600', bg: 'bg-gray-100' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100' }
}

export default function CitizenTickets() {
  const [tickets, setTickets] = useState([])
  const [citizen, setCitizen] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const { t } = useLanguage()

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) {
      setCitizen(session)
      citizenService.getMyTickets().then(setTickets).catch(() => {})
    }
  }, [])

  const filtered = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.ticketNumber?.toLowerCase().includes(q) && !t.serviceTitle?.toLowerCase().includes(q))
        return false
    }
    return true
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">{t('My Tickets')}</h1>
        <p className="text-gray-500 mt-1">{t('View your appointment tickets and book new ones')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className={selected ? 'hidden lg:block lg:col-span-1' : 'lg:col-span-3'}>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('Search tickets...')} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition bg-white" />
            </div>
            <div className="relative">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="pl-4 pr-8 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition bg-white appearance-none cursor-pointer min-w-[120px] sm:min-w-[160px]">
                <option value="all">{t('All Status')}</option>
                <option value="active">{t('Active')}</option>
                <option value="completed">{t('Completed')}</option>
                <option value="cancelled">{t('Cancelled')}</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('No tickets found.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((ticket, i) => {
                const cfg = statusConfig[ticket.status] || statusConfig.active
                return (
                  <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition hover:shadow-md ${
                      selected?.id === ticket.id ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'
                    }`}
                    onClick={() => setSelected(selected?.id === ticket.id ? null : ticket)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                          <Ticket className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{ticket.ticketNumber}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{ticket.serviceTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{ticket.appointmentDate ? new Date(ticket.appointmentDate).toLocaleDateString() : t('TBD')}</span>
                      </div>
                      <p className="text-lg font-black text-purple-700 shrink-0">{ticket.fee?.toLocaleString()} ETB</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-purple-600" />
                    <h2 className="font-bold text-gray-900">{selected.ticketNumber}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selected.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{selected.status}</span>
                  </div>
                  <button onClick={() => setSelected(null)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selected.serviceTitle}</p>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('Appointment Details')}</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('Ticket Number')}</span>
                      <span className="font-medium text-gray-900">{selected.ticketNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('Service')}</span>
                      <span className="font-medium text-gray-900">{selected.serviceTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('Status')}</span>
                      <span className={`font-medium ${selected.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{selected.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('Date')}</span>
                      <span className="font-medium text-gray-900">{selected.appointmentDate ? new Date(selected.appointmentDate).toLocaleDateString() : t('TBD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('Time')}</span>
                      <span className="font-medium text-gray-900">{selected.appointmentTime || t('TBD')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('Fee')}</span>
                      <span className="font-medium text-purple-700">{selected.fee?.toLocaleString()} ETB</span>
                    </div>
                  </div>
                </div>

                {selected.documents?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      {t('Attached Documents')} ({selected.documents.length})
                    </h3>
                    <div className="space-y-2">
                      {selected.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-gray-700 truncate">{doc.name}</span>
                          {doc.size && <span className="text-xs text-gray-400 shrink-0">({(doc.size / 1024).toFixed(1)} KB)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50">
          <Calendar className="w-5 h-5 text-blue-600" /><h2 className="font-semibold text-gray-800">{t('Book New Appointment')}</h2>
        </div>
        <div className="bg-gray-50 p-2">
          <iframe src="https://qetero.com" title="Qetero Appointment Booking" className="w-full min-h-[300px] md:min-h-[450px] lg:min-h-[600px] rounded-xl border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
        <div className="p-3 bg-blue-50 text-xs text-blue-700 flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> {t('Qetero is a third-party appointment booking platform integrated for your convenience.')}</div>
      </motion.div>
    </div>
  )
}
