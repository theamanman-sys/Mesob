import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, FileText, Calendar, Clock, Building2, UserPlus, Users, Gavel, CheckCircle, XCircle, AlertCircle, ChevronRight, X, Plus, Search, ExternalLink, BookOpen, Briefcase, Shield, UserCheck, Globe } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

const STATUS_STYLES = { open: 'bg-blue-100 text-blue-700', active: 'bg-yellow-100 text-yellow-700', pending: 'bg-purple-100 text-purple-700', closed: 'bg-gray-100 text-gray-600', resolved: 'bg-green-100 text-green-700' }

export default function CitizenLegal() {
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [proxies, setProxies] = useState([])
  const [availableProxies, setAvailableProxies] = useState([])
  const [linkedDocs, setLinkedDocs] = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cases')
  const [selectedCase, setSelectedCase] = useState(null)
  const [search, setSearch] = useState('')
  const [showAddCase, setShowAddCase] = useState(false)
  const [showAddProxy, setShowAddProxy] = useState(false)
  const [showLinkDoc, setShowLinkDoc] = useState(false)
  const [newCase, setNewCase] = useState({ title: '', description: '', type: 'civil' })

  const fetchAll = () => {
    Promise.all([
      citizenService.getLegalCases().catch(() => []),
      citizenService.getProxies().catch(() => []),
      citizenService.getLinkedDocuments().catch(() => []),
      citizenService.getVerifications().catch(() => [])
    ]).then(([c, p, l, v]) => { setCases(c || []); setProxies(p || []); setLinkedDocs(l || []); setVerifications(v || []) }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (showAddProxy) citizenService.getAvailableProxies().then(a => setAvailableProxies(a || [])).catch(() => {})
  }, [showAddProxy])

  const handleCreateCase = async (e) => {
    e.preventDefault()
    try { await citizenService.createLegalCase(newCase); setShowAddCase(false); setNewCase({ title: '', description: '', type: 'civil' }); fetchAll() }
    catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleAddProxy = async (proxyId, type) => {
    try { await citizenService.addProxy(proxyId, type); setShowAddProxy(false); fetchAll() }
    catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleLinkDoc = async (documentId, serviceType) => {
    try { await citizenService.linkDocument(documentId, serviceType); setShowLinkDoc(false); fetchAll() }
    catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleRemoveLink = async (id) => { try { await citizenService.unlinkDocument(id); fetchAll() } catch {} }

  const filtered = cases.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.caseNumber.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900">{t('Legal & Representation')}</h1><p className="text-gray-500 text-sm mt-1">{t('Manage your legal cases, proxies, and linked documents')}</p></div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('cases')} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${activeTab === 'cases' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Scale className="w-4 h-4 inline mr-1" />{t('Cases')}</button>
          <button onClick={() => setActiveTab('proxies')} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${activeTab === 'proxies' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Users className="w-4 h-4 inline mr-1" />{t('Proxies')} ({proxies.length})</button>
          <button onClick={() => setActiveTab('documents')} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText className="w-4 h-4 inline mr-1" />{t('Linked Docs')} ({linkedDocs.length})</button>
        </div>
      </div>

      {activeTab === 'cases' && (
        <div>
          {selectedCase ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => setSelectedCase(null)} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mb-4 hover:text-blue-700"><ChevronRight className="w-4 h-4 rotate-180" /> {t('Back')}</button>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div><h2 className="text-xl font-bold text-gray-900">{selectedCase.title}</h2><p className="text-sm text-gray-500">{selectedCase.caseNumber} • {selectedCase.type} {t('case')}</p></div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLES[selectedCase.status] || ''}`}>{selectedCase.status}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-xl"><div className="text-lg font-black text-blue-700">{selectedCase.hearings?.length || 0}</div><div className="text-xs text-blue-500">{t('Hearings')}</div></div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl"><div className="text-lg font-black text-amber-700">{selectedCase.courtDecisions?.length || 0}</div><div className="text-xs text-amber-500">{t('Decisions')}</div></div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl"><div className="text-lg font-black text-purple-700">{selectedCase.lawyers?.length || 0}</div><div className="text-xs text-purple-500">{t('Lawyers')}</div></div>
                  <div className="text-center p-3 bg-green-50 rounded-xl"><div className="text-lg font-black text-green-700">{selectedCase.documents?.length || 0}</div><div className="text-xs text-green-500">{t('Documents')}</div></div>
                </div>

                <div className="mb-4"><h3 className="font-semibold text-gray-700 mb-2">{t('Description')}</h3><p className="text-sm text-gray-600">{selectedCase.description}</p></div>

                {selectedCase.courtDecisions?.length > 0 && (
                  <div className="mb-4"><h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Gavel className="w-4 h-4 text-amber-500" /> {t('Court Decisions')}</h3>
                    <div className="space-y-2">{selectedCase.courtDecisions.map(d => <div key={d.id} className="p-3 bg-green-50 rounded-xl border border-green-100"><div className="text-sm font-medium text-gray-800">{d.decision}</div><div className="flex gap-3 mt-1 text-xs text-gray-500"><span>{d.by}</span><span>{new Date(d.date).toLocaleDateString()}</span>{d.note && <span>• {d.note}</span>}</div></div>)}</div>
                  </div>
                )}

                {selectedCase.hearings?.length > 0 && (
                  <div><h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {t('Hearings')}</h3>
                    <div className="space-y-2">{selectedCase.hearings.map(h => <div key={h.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl"><div><div className="text-sm font-medium text-gray-800">{new Date(h.date).toLocaleDateString()} at {h.time}</div><div className="text-xs text-gray-500">{h.location}{h.notes ? ` • ${h.notes}` : ''}</div></div></div>)}</div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-md"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search cases...')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm" /></div>
                <button onClick={() => setShowAddCase(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5"><Plus className="w-4 h-4" />{t('New Case')}</button>
              </div>
              {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400"><Scale className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('No legal cases found.')}</p></div> : <div className="space-y-3">{filtered.map(c => <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setSelectedCase(c)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition cursor-pointer"><div className="flex items-start justify-between"><div><h3 className="font-semibold text-gray-900">{c.title}</h3><p className="text-xs text-gray-500">{c.caseNumber} • {c.type} • {t('Updated')} {new Date(c.updatedAt).toLocaleDateString()}</p></div><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span></div><div className="flex gap-4 mt-3 text-xs text-gray-500"><span>{c.hearings?.length || 0} {t('hearings')}</span><span>{c.courtDecisions?.length || 0} {t('decisions')}</span><span>{c.documents?.length || 0} {t('documents')}</span></div></motion.div>)}</div>}
            </>
          )}
        </div>
      )}

      {activeTab === 'proxies' && (
        <div>
          <div className="flex gap-3 mb-4"><button onClick={() => setShowAddProxy(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5"><UserPlus className="w-4 h-4" />{t('Add Proxy / Lawyer')}</button></div>
          {proxies.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('No proxies or lawyers assigned. Add someone to act on your behalf.')}</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{proxies.map(p => <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">{(p.proxyName?.[0] || '?')}</div><div><div className="font-semibold text-gray-900">{p.proxyName}</div><div className="text-xs text-gray-500">{p.proxyEmail}<span className="ml-2 capitalize px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">{p.type}</span></div></div></div><div className="flex flex-wrap gap-1.5 mb-3">{p.permissions?.map((perm, i) => <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{perm}</span>)}</div><div className="flex items-center justify-between"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span><span className="text-xs text-gray-400">{p.ownerName ? `${t('Appointed by')} ${p.ownerName}` : ''}</span></div></motion.div>)}</div>}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <div className="flex gap-3 mb-4"><button onClick={() => setShowLinkDoc(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5"><Plus className="w-4 h-4" />{t('Link Document to Service')}</button></div>
          {linkedDocs.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('No linked documents. Link your verified documents to services and departments.')}</p></div> : <div className="space-y-3">{linkedDocs.map(l => <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between"><div><div className="font-semibold text-gray-900 capitalize">{l.serviceType} {t('Service')}</div><div className="text-sm text-gray-500">{l.department || t('General')} • Document #{l.documentId}{l.document?.documentName ? ` • ${l.document.documentName}` : ''}</div></div><div className="flex items-center gap-3"><span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-medium">{l.status}</span><button onClick={() => handleRemoveLink(l.id)} className="text-red-400 hover:text-red-600 text-xs">{t('Remove')}</button></div></motion.div>)}</div>}
        </div>
      )}

      <AnimatePresence>
        {showAddCase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddCase(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">{t('New Legal Case')}</h3><button onClick={() => setShowAddCase(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
              <form onSubmit={handleCreateCase} className="space-y-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('Case Title')}</label><input type="text" value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('Description')}</label><textarea value={newCase.description} onChange={e => setNewCase({...newCase, description: e.target.value})} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">{t('Type')}</label><select value={newCase.type} onChange={e => setNewCase({...newCase, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white"><option value="civil">{t('Civil')}</option><option value="family">{t('Family')}</option><option value="criminal">{t('Criminal')}</option><option value="property">{t('Property')}</option><option value="tax">{t('Tax')}</option><option value="labor">{t('Labor')}</option></select></div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition">{t('Create Case')}</button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showAddProxy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddProxy(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">{t('Add Proxy or Lawyer')}</h3><button onClick={() => setShowAddProxy(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
              <p className="text-sm text-gray-500 mb-4">{t('Select a user who has enabled proxy access. They will be able to act on your behalf for selected permissions.')}</p>
              {availableProxies.length === 0 ? <div className="text-center py-6 text-gray-400 text-sm"><UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>{t('No users available as proxies. Users must enable proxy settings in their profile first.')}</p></div> : <div className="space-y-2 max-h-64 overflow-y-auto">{availableProxies.map(ap => <div key={ap.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">{ap.firstName?.[0]}{ap.lastName?.[0]}</div><div><div className="text-sm font-medium text-gray-800">{ap.fullName}</div><div className="text-xs text-gray-500">{ap.email}</div></div></div><div className="flex gap-1.5"><button onClick={() => handleAddProxy(ap.id, 'lawyer')} className="text-xs px-2.5 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700">{t('Lawyer')}</button><button onClick={() => handleAddProxy(ap.id, 'proxy')} className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('Proxy')}</button></div></div>)}</div>}
            </motion.div>
          </motion.div>
        )}

        {showLinkDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLinkDoc(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">{t('Link Document to Service')}</h3><button onClick={() => setShowLinkDoc(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
              <p className="text-sm text-gray-500 mb-4">{t('Link your verified documents to specific services so MESOB can verify them across departments.')}</p>
              {verifications.filter(v => v.status === 'verified').length === 0 ? <div className="text-center py-6 text-gray-400 text-sm"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>{t('No verified documents.')} <button onClick={() => navigate('/citizen/verification')} className="text-blue-600 hover:underline text-sm">{t('Verify your documents first.')}</button></p></div> : <div className="space-y-2 max-h-64 overflow-y-auto">{verifications.filter(v => v.status === 'verified').map(v => <div key={v.id} className="p-3 bg-gray-50 rounded-xl"><div className="flex items-center justify-between mb-2"><div className="text-sm font-medium text-gray-800 capitalize">{v.documentType?.replace(/_/g, ' ')}</div><CheckCircle className="w-4 h-4 text-green-500" /></div><div className="flex flex-wrap gap-1.5">{[{key:'property',label:t('Property')},{key:'tax',label:t('Tax')},{key:'legal',label:t('Legal')},{key:'business',label:t('Business')},{key:'education',label:t('Education')}].map(s => <button key={s.key} onClick={() => handleLinkDoc(v.id, s.key)} className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 capitalize">{s.label}</button>)}</div></div>)}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-800">{t('Ministry of Justice Portal')}</h2>
        </div>
        <div className="bg-gray-50">
          <iframe
            src={currentLanguage === 'am' ? 'https://justice.gov.et/am/' : 'https://justice.gov.et/en/'}
            title={t('Ministry of Justice')}
            className="w-full min-h-[300px] md:min-h-[450px] lg:min-h-[600px] border-0"
            loading="lazy" referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </motion.div>
    </div>
  )
}
