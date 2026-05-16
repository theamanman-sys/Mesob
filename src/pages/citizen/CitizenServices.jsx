import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Building2, Clock, DollarSign, FileText, CheckCircle, X, ArrowRight, Upload, Loader, AlertCircle, ChevronDown, Filter, Ticket, Calendar } from 'lucide-react'
import { services, organizations } from '../../data/seedData'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'
import { getTranslatedService } from '../../i18n/serviceTranslations'

export default function CitizenServices() {
  const { currentLanguage } = useLanguage()
  const [citizen, setCitizen] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedOrg, setSelectedOrg] = useState('all')
  const [showApply, setShowApply] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [appTicket, setAppTicket] = useState(null)
  const [appForm, setAppForm] = useState({})
  const [appDocs, setAppDocs] = useState([])
  const [expandedOrg, setExpandedOrg] = useState(null)

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) setCitizen(session)
  }, [])

  const translatedServices = useMemo(() => {
    return services.map(s => getTranslatedService(s, currentLanguage))
  }, [currentLanguage])

  const filteredServices = useMemo(() => {
    let result = translatedServices
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    if (selectedOrg !== 'all') {
      result = result.filter(s => s.organizationId === parseInt(selectedOrg))
    }
    return result
  }, [translatedServices, search, selectedOrg])

  const getOrg = (orgId) => organizations.find(o => o.id === orgId)

  const groupedByOrg = useMemo(() => {
    const map = {}
    filteredServices.forEach(s => {
      const orgId = s.organizationId
      if (!map[orgId]) map[orgId] = []
      map[orgId].push(s)
    })
    return map
  }, [filteredServices])

  const handleApply = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await citizenService.submitApplication(showApply.id, showApply.title, appForm, appDocs)
      if (result.ticket) setAppTicket(result.ticket)
      setSuccess(true)
      setStep(3)
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setLoading(false)
  }

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setAppDocs(prev => [...prev, { name: file.name, size: file.size, dataUrl: reader.result }])
      }
      reader.readAsDataURL(file)
    })
  }

  const resetApply = () => {
    setShowApply(null)
    setStep(1)
    setAppForm({})
    setAppDocs([])
    setSuccess(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Government Services</h1>
        <p className="text-gray-500 mt-1">Browse and apply for services from all government departments.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
            className="pl-11 pr-8 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white appearance-none cursor-pointer min-w-[200px]">
            <option value="all">All Departments</option>
            {organizations.map(o => (
              <option key={o.id} value={o.id}>{o.shortName || o.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByOrg).map(([orgId, orgServices]) => {
          const org = getOrg(parseInt(orgId))
          if (!org) return null
          return (
            <motion.div key={orgId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setExpandedOrg(expandedOrg === orgId ? null : orgId)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  {org.icon ? (
                    <img src={org.icon} alt="" className="w-10 h-10 object-contain" onError={(e) => { e.target.style.display = 'none' }} />
                  ) : <Building2 className="w-10 h-10 text-gray-400" />}
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">{orgServices.length} service{orgServices.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrg === orgId ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {expandedOrg === orgId && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-100">
                    <div className="divide-y divide-gray-50">
                      {orgServices.map((service) => (
                        <div key={service.id} className="p-5 hover:bg-gray-50 transition">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900">{service.title}</h4>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                              <div className="flex flex-wrap gap-3 mt-3">
                                {service.processingTime && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" /> {service.processingTime}
                                  </span>
                                )}
                                {service.ServiceFee && service.ServiceFee !== '-' && (
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <DollarSign className="w-3.5 h-3.5" /> {service.ServiceFee}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button onClick={() => { setShowApply(service); setStep(1); setAppForm({}); setAppDocs([]); setSuccess(false) }}
                              className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
        {Object.keys(groupedByOrg).length === 0 && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No services found matching your search.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showApply && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && resetApply()}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="font-bold text-gray-900">{success ? 'Application Submitted' : 'Apply for Service'}</h2>
                  <p className="text-sm text-gray-500">{success ? '' : showApply.title}</p>
                </div>
                <button onClick={resetApply} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>

              {!success && (
                <div className="flex items-center gap-2 px-5 py-4 bg-gray-50 border-b border-gray-100">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                      </div>
                      <span className={`text-xs font-medium ${step >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                        {s === 1 ? 'Details' : 'Documents'}
                      </span>
                      {s < 2 && <div className={`w-8 h-0.5 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-5">
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Application Submitted!</h3>
                    <p className="text-gray-500 text-sm mb-4">Your application has been received. You can track its status in My Applications.</p>
                    {appTicket && (
                      <div className="bg-blue-50 rounded-xl p-4 mb-4 text-left max-w-sm mx-auto border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2"><Ticket className="w-4 h-4" /> Appointment Ticket Generated</div>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">Ticket #</span><span className="font-bold text-gray-800">{appTicket.ticketNumber}</span></div>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">Date</span><span className="font-medium text-gray-800">{new Date(appTicket.appointmentDate).toLocaleDateString()}</span></div>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">Time</span><span className="font-medium text-gray-800">{appTicket.appointmentTime}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">Fee</span><span className="font-medium text-gray-800">{appTicket.fee} ETB</span></div>
                      </div>
                    )}
                    <div className="flex gap-3 justify-center">
                      <button onClick={resetApply} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Close</button>
                      <Link to="/citizen/tickets" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                        onClick={resetApply}>View Tickets</Link>
                    </div>
                  </div>
                ) : step === 1 ? (
                  <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-4">
                    <p className="text-sm text-gray-600">Please provide additional details for your application.</p>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <input type="text" value={appForm.fullName || citizen?.firstName + ' ' + citizen?.lastName || ''}
                        onChange={e => setAppForm({ ...appForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <input type="email" value={appForm.email || citizen?.email || ''}
                        onChange={e => setAppForm({ ...appForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                      <input type="tel" value={appForm.phone || citizen?.phone || ''}
                        onChange={e => setAppForm({ ...appForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes</label>
                      <textarea value={appForm.notes || ''} onChange={e => setAppForm({ ...appForm, notes: e.target.value })}
                        rows={3} placeholder="Any additional information..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetApply} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                        Next: Documents <ArrowRight className="w-4 h-4 inline ml-1" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4">
                    <p className="text-sm text-gray-600">Upload any required documents for this application.</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition">
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">Drag files here or click to browse</p>
                      <input type="file" multiple onChange={handleFileAdd} className="hidden" id="file-upload" />
                      <label htmlFor="file-upload" className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-100 transition">
                        Browse Files
                      </label>
                    </div>
                    {appDocs.length > 0 && (
                      <div className="space-y-2">
                        {appDocs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                              <span className="text-xs text-gray-400">({(doc.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button type="button" onClick={() => setAppDocs(prev => prev.filter((_, j) => j !== i))}
                              className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                        Back
                      </button>
                      <button type="submit" disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>Submit Application <CheckCircle className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
