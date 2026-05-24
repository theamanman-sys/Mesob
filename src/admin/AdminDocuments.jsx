import { useState, useEffect, useCallback } from 'react'
import { FileText, Search, Eye, ExternalLink, X, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import usePolling from '../hooks/usePolling'

export default function AdminDocuments() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState(null)

  const fetchDocs = useCallback(async (silent) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/admin/documents')
      setDocs(Array.isArray(data) ? data : (data?.data || []))
    } catch { setDocs([]) }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  usePolling(() => fetchDocs(true), 5000)

  const types = ['all', ...new Set(docs.map(d => d.documentType || 'other'))]

  const filtered = docs.filter(d => {
    if (filterType !== 'all' && d.documentType !== filterType) return false
    const q = search.toLowerCase()
    return !q || (d.fileName || '').toLowerCase().includes(q) || (d.documentType || '').toLowerCase().includes(q)
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Citizen Documents</h1>
        </div>
        <span className="text-sm text-gray-500">{filtered.length} of {docs.length} documents</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by file name or type..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition ${filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc, i) => (
            <div key={doc.id || doc._id || i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{doc.fileName || 'Unnamed document'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{doc.documentType || 'other'} {(doc.uploadedAt || doc.createdAt) ? `· ${new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.dataUrl && (
                  <a href={doc.dataUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => setSelectedDoc(doc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents found</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{selectedDoc.fileName || 'Document'}</h2>
                <button onClick={() => setSelectedDoc(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">Type</div><div className="text-sm font-semibold text-gray-800 dark:text-white capitalize">{selectedDoc.documentType || 'other'}</div></div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">Uploaded</div><div className="text-sm font-semibold text-gray-800 dark:text-white">{selectedDoc.uploadedAt ? new Date(selectedDoc.uploadedAt).toLocaleDateString() : selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleDateString() : '—'}</div></div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">File name</div><div className="text-sm font-semibold text-gray-800 dark:text-white break-all">{selectedDoc.fileName || '—'}</div></div>
                  {selectedDoc.confidence != null && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"><div className="text-xs text-gray-500">OCR Confidence</div><div className="text-sm font-semibold text-gray-800 dark:text-white">{selectedDoc.confidence}%</div></div>
                  )}
                </div>

                {selectedDoc.text && (
                  <div><h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">OCR Text</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{selectedDoc.text}</div>
                  </div>
                )}

                {selectedDoc.fields && Object.keys(selectedDoc.fields).length > 0 && (
                  <div><h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Extracted Fields</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 space-y-1.5">
                      {Object.entries(selectedDoc.fields).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-sm"><span className="font-medium text-gray-500 dark:text-gray-400 min-w-[100px] capitalize">{k.replace(/_/g, ' ')}:</span><span className="text-gray-800 dark:text-white">{String(v)}</span></div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDoc.dataUrl && (
                  <div className="pt-2">
                    <a href={selectedDoc.dataUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition">
                      <ExternalLink className="w-4 h-4" /> Open Document
                    </a>
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
