import { useState, useEffect, useCallback } from 'react'
import { FileText, CheckCircle, Clock, AlertCircle, XCircle, Eye, Search, X, ChevronLeft, ExternalLink, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { citizenService } from '../services/citizenService'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import usePolling from '../hooks/usePolling'

const statusConfig = {
  submitted: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Submitted' },
  processing: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Processing' },
  approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Rejected' },
}

export default function AdminApplications() {
  const { showToast } = useToast()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState(null)
  const [processing, setProcessing] = useState(false)

  const fetchApps = useCallback(async (silent) => {
    if (!silent) setLoading(true)
    try {
      const result = await citizenService.getAllApplications()
      setApps(Array.isArray(result) ? result : [])
    } catch { setApps([]) }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  usePolling(() => fetchApps(true), 5000)

  const updateStatus = async (appId, status) => {
    setProcessing(true)
    try {
      await api.put(`/applications/${appId}`, { status })
      setApps(prev => prev.map(a => (a.id === appId || a._id === appId) ? { ...a, status } : a))
      if (selectedApp && (selectedApp.id === appId || selectedApp._id === appId)) setSelectedApp(prev => ({ ...prev, status }))
      showToast(`Application ${status} successfully`, 'success')
    } catch (err) { showToast(err?.response?.data?.message || 'Failed to update', 'error') }
    setProcessing(false)
  }

  const filtered = apps.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false
    const q = search.toLowerCase()
    return !q || (a.serviceTitle || '').toLowerCase().includes(q) || (a.referenceNumber || '').toLowerCase().includes(q) || (a.citizenName || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
        </div>
        <span className="text-sm text-gray-500">{filtered.length} of {apps.length} applications</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by title, reference, or citizen..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', 'submitted', 'processing', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const stat = statusConfig[app.status] || statusConfig.submitted
            const StatIcon = stat.icon
            return (
              <div key={app.id || app._id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-full ${stat.bg}`}>
                    <StatIcon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{app.serviceTitle || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{app.citizenName || `Citizen #${app.citizenId}`} &middot; {app.referenceNumber || app.id}</p>
                    <p className="text-xs text-gray-400">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${stat.bg} ${stat.color}`}>{app.status}</span>
                  <button onClick={() => setSelectedApp(app)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No applications found</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedApp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedApp(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${statusConfig[selectedApp.status]?.bg || statusConfig.submitted.bg}`}>
                    {(() => { const Icon = statusConfig[selectedApp.status]?.icon || Clock; return <Icon className={`w-5 h-5 ${statusConfig[selectedApp.status]?.color}`} /> })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedApp.serviceTitle || 'Application'}</h2>
                    <p className="text-xs text-gray-500">{selectedApp.referenceNumber || selectedApp.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">Citizen</div><div className="text-sm font-semibold text-gray-800 dark:text-white">{selectedApp.citizenName || 'Unknown'}</div></div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">Submitted</div><div className="text-sm font-semibold text-gray-800 dark:text-white">{selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString() : '—'}</div></div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">Status</div><div className="text-sm font-semibold"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedApp.status]?.bg} ${statusConfig[selectedApp.status]?.color}`}>{selectedApp.status}</span></div></div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">Last Updated</div><div className="text-sm font-semibold text-gray-800 dark:text-white">{selectedApp.updatedAt ? new Date(selectedApp.updatedAt).toLocaleDateString() : '—'}</div></div>
                </div>

                {selectedApp.formData && Object.keys(selectedApp.formData).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Form Data</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
                      {Object.entries(selectedApp.formData).map(([key, val]) => (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="font-medium text-gray-500 dark:text-gray-400 min-w-[120px] capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-gray-800 dark:text-white">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.documents && selectedApp.documents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Attached Documents ({selectedApp.documents.length})</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedApp.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="truncate text-gray-700 dark:text-gray-300">{doc.name || doc.fileName || `Document ${i + 1}`}</span>
                          {doc.dataUrl && (
                            <a href={doc.dataUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-blue-600 hover:text-blue-800 shrink-0">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.status !== 'approved' && selectedApp.status !== 'rejected' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Update Status</h3>
                    <div className="flex gap-3">
                      {selectedApp.status === 'submitted' && (
                        <button onClick={() => updateStatus(selectedApp.id || selectedApp._id, 'processing')} disabled={processing}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-xl font-semibold text-sm hover:bg-yellow-700 disabled:opacity-50 transition">
                          <AlertCircle className="w-4 h-4" /> Mark Processing
                        </button>
                      )}
                      {(selectedApp.status === 'submitted' || selectedApp.status === 'processing') && (
                        <>
                          <button onClick={() => updateStatus(selectedApp.id || selectedApp._id, 'approved')} disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition">
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => updateStatus(selectedApp.id || selectedApp._id, 'rejected')} disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition">
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedApp.timeline && selectedApp.timeline.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timeline</h3>
                    <div className="space-y-2">
                      {selectedApp.timeline.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <span className={`font-medium capitalize ${statusConfig[t.status]?.color || 'text-gray-600'}`}>{t.status}</span>
                            {t.note && <span className="text-gray-500"> — {t.note}</span>}
                            <div className="text-xs text-gray-400">{t.date ? new Date(t.date).toLocaleString() : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
