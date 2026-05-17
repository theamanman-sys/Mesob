import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Trash2, Search, Calendar, Pencil, X, Save } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { citizenService } from '../../services/citizenService'

const docTypes = [
  { value: 'id', label: 'National ID / Fayda' },
  { value: 'passport', label: 'Passport' },
  { value: 'birth', label: 'Birth Certificate' },
  { value: 'photo', label: 'Passport Photo' },
  { value: 'letter', label: 'Supporting Letter' },
  { value: 'other', label: 'Other' }
]

function EditDocModal({ doc, open, onClose, onSave }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('id')
  const [extractedData, setExtractedData] = useState({})
  const [saving, setSaving] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (doc) {
      setName(doc.name || '')
      setType(doc.type || 'id')
      setExtractedData(doc.extractedData ? { ...doc.extractedData } : {})
    }
  }, [doc])

  const addField = () => {
    const key = prompt(t('fieldNamePrompt'))
    if (key) setExtractedData(prev => ({ ...prev, [key]: '' }))
  }

  const removeField = (key) => {
    const { [key]: _, ...rest } = extractedData
    setExtractedData(rest)
  }

  const handleSave = async () => {
    if (!doc) return
    setSaving(true)
    try {
      const clean = Object.fromEntries(Object.entries(extractedData).filter(([, v]) => v))
      const updated = await citizenService.updateDocument(doc.id, { name, type, extractedData: clean })
      onSave(updated)
      onClose()
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setSaving(false)
  }

  if (!open || !doc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">{t('editDocument')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {doc.dataUrl && (
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <img src={doc.dataUrl} alt={doc.name} className="w-full h-48 object-contain" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('documentName')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-sm" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('documentType')}</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-sm">
              {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">{t('extractedFields')}</label>
              <button onClick={addField}
                className="text-xs text-blue-600 font-medium hover:underline">{t('addField')}</button>
            </div>
            <div className="space-y-2">
              {Object.entries(extractedData).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input type="text" value={key} readOnly
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-500 bg-gray-50 mb-1" />
                    <input type="text" value={value} onChange={e => setExtractedData(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
                  </div>
                  <button onClick={() => removeField(key)}
                    className="p-2 mt-5 rounded-lg hover:bg-red-50 text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
            {t('cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('saving')}</>
              : <><Save className="w-4 h-4" /> {t('saveChanges')}</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function CitizenDocuments() {
  const [citizen, setCitizen] = useState(null)
  const [documents, setDocuments] = useState([])
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [type, setType] = useState('id')
  const [editingDoc, setEditingDoc] = useState(null)
  const { t } = useLanguage()

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) {
      setCitizen(session)
      citizenService.getDocuments().then(setDocuments).catch(() => {})
    }
  }, [])

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  )

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !citizen) return
    setUploading(true)
    try {
      const doc = await citizenService.uploadDocument(file, type)
      setDocuments(prev => [doc, ...prev])
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (docId) => {
    if (!confirm(t('deleteDocumentConfirm'))) return
    try {
      await citizenService.deleteDocument(docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
  }

  const handleEditSave = (updated) => {
    setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  if (!citizen) return null

  return (
    <div>
      <EditDocModal doc={editingDoc} open={!!editingDoc} onClose={() => setEditingDoc(null)} onSave={handleEditSave} />

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">{t('myDocuments')}</h1>
        <p className="text-gray-500 mt-1">{t('uploadAndManageDocuments')}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">{t('uploadNewDocument')}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white text-sm min-w-[120px] sm:min-w-[180px]">
            {docTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex-1 relative">
            <input type="file" onChange={handleUpload} disabled={uploading}
              className="hidden" id="doc-upload" />
            <label htmlFor="doc-upload"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 cursor-pointer transition">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Upload className="w-4 h-4" /> {t('chooseFileToUpload')}</>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('searchDocuments')}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{documents.length === 0 ? t('noDocumentsUploaded') : t('noDocumentsMatch')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition group overflow-hidden">
              {doc.dataUrl && (
                <div className="h-36 bg-gray-100 overflow-hidden">
                  <img src={doc.dataUrl} alt={doc.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    {doc.dataUrl ? (
                      <img src={doc.dataUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingDoc(doc)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(doc.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md capitalize">{docTypes.find(t => t.value === doc.type)?.label || doc.type}</span>
                  <span>•</span>
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
                {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {Object.entries(doc.extractedData).filter(([, v]) => v).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-500">{key}</span>
                        <span className="text-gray-800 font-medium truncate ml-2">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
