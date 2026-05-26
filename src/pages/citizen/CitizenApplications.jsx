import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Search, ChevronDown, Building2, Calendar, ArrowRight, Plus, Trash2, Edit3, Upload, X, Loader, Ticket, Download } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'
import { Barcode, downloadTicketImage, downloadTicketPDF } from '../../utils/barcode'

const statusConfig = {
  submitted: { icon: Clock, label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  processing: { icon: AlertCircle, label: 'Processing', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
}

export default function CitizenApplications() {
  const [applications, setApplications] = useState([])
  const [citizen, setCitizen] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editDocs, setEditDocs] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) {
      setCitizen(session)
      fetchApplications()
    }
  }, [])

  const fetchApplications = async () => {
    try {
      const data = await citizenService.getApplications()
      setApplications(data)
    } catch {}
  }

  const handleDelete = async (appId, e) => {
    e.stopPropagation()
    if (!confirm(t('Cancel this application?'))) return
    setLoading(true)
    try {
      await citizenService.deleteApplication(appId)
      setApplications(prev => prev.filter(a => a.id !== appId))
      if (selected?.id === appId) setSelected(null)
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setLoading(false)
  }

  const filtered = applications.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search && !a.serviceTitle.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('My Applications')}</h1>
          <p className="text-gray-500 mt-1">{t('Track the status of your submitted applications.')}</p>
        </div>
        <Link to="/citizen/services" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> {t('New Application')}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input id="app-search" name="search" type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search applications...')} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white" />
        </div>
        <div className="relative">
          <select id="app-filter" name="filter" value={filter} onChange={e => setFilter(e.target.value)}
            className="pl-4 pr-8 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white appearance-none cursor-pointer min-w-[120px] sm:min-w-[160px]">
            <option value="all">{t('All Status')}</option>
            <option value="submitted">{t('Submitted')}</option>
            <option value="processing">{t('Processing')}</option>
            <option value="approved">{t('Approved')}</option>
            <option value="rejected">{t('Rejected')}</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selected ? 'hidden lg:block lg:col-span-1' : 'lg:col-span-3'}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('No applications found.')}</p>
              <Link to="/citizen/services" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
                {t('Browse services')} →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((app, i) => {
                const cfg = statusConfig[app.status] || statusConfig.submitted
                const StatusIcon = cfg.icon
                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition hover:shadow-md group ${
                      selected?.id === app.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
                    }`}
                    onClick={() => setSelected(selected?.id === app.id ? null : app)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
                          <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{app.serviceTitle}</p>
                          <p className="text-xs text-gray-500">
                            {t('Submitted')} {new Date(app.createdAt).toLocaleDateString()} • {t('ID:')} {app.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        {t(cfg.label)}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setEditing(app); setEditForm(app.formData || {}); setEditDocs(app.documents || []) }}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDelete(app.id, e)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                  <h2 className="font-bold text-gray-900">{selected.serviceTitle}</h2>
                  <button onClick={() => setSelected(null)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('Application ID:')} {selected.id}</p>
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('Application Details')}</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    {Object.entries(selected.formData || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium text-gray-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.ticketNumber && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm mb-2">
                      <Ticket className="w-4 h-4" /> {t('Appointment Ticket')}
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">{t('Ticket Number')}</span>
                      <span className="font-bold text-gray-800">{selected.ticketNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">{t('Reference')}</span>
                      <span className="font-medium text-gray-800">{selected.referenceNumber}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <Barcode value={selected.ticketNumber} height={30} />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => downloadTicketImage({ ticketNumber: selected.ticketNumber, serviceTitle: selected.serviceTitle, fee: 0, status: selected.status, appointmentDate: selected.createdAt })}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition">
                          <Download className="w-3 h-3" /> {t('Image')}
                        </button>
                        <button onClick={() => downloadTicketPDF({ ticketNumber: selected.ticketNumber, serviceTitle: selected.serviceTitle, fee: 0, status: selected.status, appointmentDate: selected.createdAt })}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selected.documents?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('Documents')} ({selected.documents.length})</h3>
                    <div className="space-y-2">
                      {selected.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 truncate">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('Timeline')}</h3>
                  <div className="relative pl-6 space-y-4">
                    {selected.timeline?.map((event, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute left-[-22px] top-1 w-3 h-3 rounded-full border-2 ${
                          i === selected.timeline.length - 1 ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                        }`} />
                        {i < selected.timeline.length - 1 && (
                          <div className="absolute left-[-18.5px] top-4 bottom-[-18px] w-0.5 bg-gray-200" />
                        )}
                        <p className="text-sm font-medium text-gray-900 capitalize">{event.status.replace('-', ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(event.date).toLocaleString()}</p>
                        {event.note && <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="font-bold text-gray-900">{t('Edit Application')}</h2>
                <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600 font-medium">{editing.serviceTitle}</p>
                <div>
                  <label htmlFor="edit-full-name" className="block text-sm font-semibold text-gray-700 mb-1">{t('Full Name')}</label>
                  <input id="edit-full-name" name="fullName" type="text" value={editForm.fullName || ''} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-semibold text-gray-700 mb-1">{t('Email')}</label>
                  <input id="edit-email" name="email" type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
                <div>
                  <label htmlFor="edit-phone" className="block text-sm font-semibold text-gray-700 mb-1">{t('Phone')}</label>
                  <input id="edit-phone" name="phone" type="tel" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-semibold text-gray-700 mb-1">{t('Additional Notes')}</label>
                  <textarea id="edit-notes" name="notes" value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Documents')} ({editDocs.length})</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition">
                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                    <input type="file" multiple onChange={(e) => {
                      Array.from(e.target.files).forEach(f => {
                        const reader = new FileReader()
                        reader.onload = () => setEditDocs(prev => [...prev, { name: f.name, size: f.size, dataUrl: reader.result }])
                        reader.readAsDataURL(f)
                      })
                    }} className="hidden" id="edit-file-upload" />
                    <label htmlFor="edit-file-upload" className="text-sm text-blue-600 cursor-pointer font-medium hover:underline">{t('Add files')}</label>
                  </div>
                  {editDocs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {editDocs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                          <span className="truncate text-gray-700">{doc.name}</span>
                          <button onClick={() => setEditDocs(prev => prev.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 shrink-0 ml-2">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-gray-100">
                <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                  {t('Cancel')}
                </button>
                <button onClick={async () => {
                  setSaving(true)
                  try {
                    const updated = await citizenService.updateApplication(editing.id, { formData: editForm, documents: editDocs })
                    setApplications(prev => prev.map(a => a.id === editing.id ? { ...a, ...updated, formData: editForm, documents: editDocs } : a))
                    setEditing(null)
                  } catch (err) {
                    alert(err.response?.data?.message || err.message)
                  }
                  setSaving(false)
                }} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  {t('Save Changes')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
