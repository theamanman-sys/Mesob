import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Scale, FileText, Search, Users, Gavel, Calendar, CheckCircle, X, ChevronRight, AlertCircle, UserPlus, Plus, Globe } from 'lucide-react'
import api from '../services/api'

const STATUS_STYLES = { open: 'bg-blue-100 text-blue-700', active: 'bg-yellow-100 text-yellow-700', pending: 'bg-purple-100 text-purple-700', closed: 'bg-gray-100 text-gray-600', resolved: 'bg-green-100 text-green-700' }

export default function AdminLegal() {
  const [cases, setCases] = useState([])
  const [proxies, setProxies] = useState([])
  const [linkedDocs, setLinkedDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cases')
  const [search, setSearch] = useState('')
  const [selectedCase, setSelectedCase] = useState(null)
  const [decisionModal, setDecisionModal] = useState(null)
  const [newDecision, setNewDecision] = useState({ decision: '', note: '' })
  const [hearingModal, setHearingModal] = useState(null)
  const [newHearing, setNewHearing] = useState({ date: '', time: '', location: '', notes: '' })

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/legal-cases').then(r => r.data.data || []).catch(() => []),
      api.get('/admin/proxies').then(r => r.data.data || []).catch(() => []),
      api.get('/admin/linked-documents').then(r => r.data.data || []).catch(() => [])
    ]).then(([c, p, l]) => { setCases(c); setProxies(p); setLinkedDocs(l) }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleAddDecision = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/citizens/legal-cases/${decisionModal.id}/decisions`, newDecision)
      setDecisionModal(null); setNewDecision({ decision: '', note: '' }); fetchAll()
    } catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleAddHearing = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/citizens/legal-cases/${hearingModal.id}/hearings`, newHearing)
      setHearingModal(null); setNewHearing({ date: '', time: '', location: '', notes: '' }); fetchAll()
    } catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleUpdateStatus = async (id, status) => {
    try { await api.put(`/admin/legal-cases/${id}/status`, { status }); fetchAll() }
    catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleProxyStatus = async (id, status) => {
    try { await api.put(`/citizens/proxies/${id}/status`, { status }); fetchAll() }
    catch (err) { alert(err.response?.data?.message || err.message) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>

  const filteredCases = cases.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.caseNumber?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Legal &amp; Proxy Management</h1><p className="text-gray-500 text-sm mt-1">Manage legal cases, proxies, and document linking across all citizens</p></div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('cases')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'cases' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Gavel className="w-4 h-4 inline mr-1" />Cases ({cases.length})</button>
          <button onClick={() => setActiveTab('proxies')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'proxies' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Users className="w-4 h-4 inline mr-1" />Proxies ({proxies.length})</button>
          <button onClick={() => setActiveTab('documents')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText className="w-4 h-4 inline mr-1" />Linked Docs ({linkedDocs.length})</button>
        </div>
      </div>

      {activeTab === 'cases' && (
        <div>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases by title or case number..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
          </div>

          {selectedCase ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button onClick={() => setSelectedCase(null)} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mb-4 hover:text-blue-700"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div><h2 className="text-xl font-bold text-gray-900">{selectedCase.title}</h2><p className="text-sm text-gray-500">{selectedCase.caseNumber} <span className="mx-1">•</span> {selectedCase.type} <span className="mx-1">•</span> Citizen #{selectedCase.citizenId}{selectedCase.citizenName ? ` (${selectedCase.citizenName})` : ''}</p></div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[selectedCase.status] || ''}`}>{selectedCase.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{selectedCase.description}</p>

                <div className="flex gap-2 mb-6">
                  <select value={selectedCase.status} onChange={e => handleUpdateStatus(selectedCase.id, e.target.value)} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white"><option value="open">Open</option><option value="active">Active</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
                  <button onClick={() => setDecisionModal(selectedCase)} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"><Gavel className="w-3.5 h-3.5 inline mr-1" />Add Decision</button>
                  <button onClick={() => setHearingModal(selectedCase)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"><Calendar className="w-3.5 h-3.5 inline mr-1" />Schedule Hearing</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedCase.courtDecisions?.length > 0 && <div><h3 className="font-semibold text-gray-700 mb-2 text-sm">Court Decisions</h3>{selectedCase.courtDecisions.map(d => <div key={d.id} className="p-2.5 bg-green-50 rounded-lg border border-green-100 mb-2"><p className="text-sm font-medium">{d.decision}</p><p className="text-xs text-gray-500">{d.by} <span className="mx-1">•</span> {new Date(d.date).toLocaleDateString()}{d.note ? <span className="mx-1">•</span> : ''}{d.note}</p></div>)}</div>}
                  {selectedCase.hearings?.length > 0 && <div><h3 className="font-semibold text-gray-700 mb-2 text-sm">Hearings</h3>{selectedCase.hearings.map(h => <div key={h.id} className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 mb-2"><p className="text-sm font-medium">{new Date(h.date).toLocaleDateString()} at {h.time}</p><p className="text-xs text-gray-500">{h.location}{h.notes ? <span className="mx-1">•</span> : ''}{h.notes}</p></div>)}</div>}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredCases.length === 0 ? <div className="p-12 text-center text-gray-400"><Scale className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No legal cases found.</p></div> :
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left p-3 font-semibold text-gray-600">Case</th><th className="text-left p-3 font-semibold text-gray-600">Citizen</th><th className="text-left p-3 font-semibold text-gray-600">Type</th><th className="text-left p-3 font-semibold text-gray-600">Status</th><th className="text-left p-3 font-semibold text-gray-600">Hearings</th><th className="text-left p-3 font-semibold text-gray-600">Updated</th></tr></thead>
              <tbody>{filteredCases.map(c => <tr key={c.id} onClick={() => setSelectedCase(c)} className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer"><td className="p-3"><div className="font-medium text-gray-900">{c.title}</div><div className="text-xs text-gray-400">{c.caseNumber}</div></td><td className="p-3 text-gray-600">#{c.citizenId}{c.citizenName ? ` ${c.citizenName}` : ''}</td><td className="p-3"><span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{c.type}</span></td><td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status] || ''}`}>{c.status}</span></td><td className="p-3 text-gray-600">{c.hearings?.length || 0}</td><td className="p-3 text-gray-500 text-xs">{new Date(c.updatedAt).toLocaleDateString()}</td></tr>)}</tbody></table>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'proxies' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {proxies.length === 0 ? <div className="text-center py-12 text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No proxy assignments found.</p></div> :
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100"><th className="text-left p-3 font-semibold text-gray-600">Proxy</th><th className="text-left p-3 font-semibold text-gray-600">Appointed By</th><th className="text-left p-3 font-semibold text-gray-600">Type</th><th className="text-left p-3 font-semibold text-gray-600">Permissions</th><th className="text-left p-3 font-semibold text-gray-600">Status</th><th className="text-left p-3 font-semibold text-gray-600">Actions</th></tr></thead>
          <tbody>{proxies.map(p => <tr key={p.id} className="border-b border-gray-50"><td className="p-3"><div className="font-medium">{p.proxyName}</div><div className="text-xs text-gray-400">{p.proxyEmail}</div></td><td className="p-3 text-gray-600">{p.ownerName || `Citizen #${p.citizenId}`}</td><td className="p-3"><span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded capitalize">{p.type}</span></td><td className="p-3"><div className="flex flex-wrap gap-1">{p.permissions?.map((perm, i) => <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{perm}</span>)}</div></td><td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span></td><td className="p-3"><select value={p.status} onChange={e => handleProxyStatus(p.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"><option value="active">Active</option><option value="suspended">Suspend</option><option value="revoked">Revoke</option></select></td></tr>)}</tbody></table>}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {linkedDocs.length === 0 ? <div className="text-center py-12 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No linked documents.</p></div> :
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100"><th className="text-left p-3 font-semibold text-gray-600">Citizen</th><th className="text-left p-3 font-semibold text-gray-600">Service</th><th className="text-left p-3 font-semibold text-gray-600">Department</th><th className="text-left p-3 font-semibold text-gray-600">Document</th><th className="text-left p-3 font-semibold text-gray-600">Status</th><th className="text-left p-3 font-semibold text-gray-600">Date</th></tr></thead>
          <tbody>{linkedDocs.map(l => <tr key={l.id} className="border-b border-gray-50"><td className="p-3">#{l.citizenId}{l.citizenName ? ` ${l.citizenName}` : ''}</td><td className="p-3 capitalize text-gray-800">{l.serviceType}</td><td className="p-3 text-gray-600">{l.department || '-'}</td><td className="p-3 text-gray-600">{l.document?.documentName || `Doc #${l.documentId}`}</td><td className="p-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${l.status === 'linked' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{l.status}</span></td><td className="p-3 text-xs text-gray-500">{new Date(l.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}
        </div>
      )}

      {decisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDecisionModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Add Court Decision</h3><button onClick={() => setDecisionModal(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <p className="text-sm text-gray-500 mb-2">Case: {decisionModal.caseNumber} - {decisionModal.title}</p>
            <form onSubmit={handleAddDecision} className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Decision</label><textarea value={newDecision.decision} onChange={e => setNewDecision({...newDecision, decision: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label><input type="text" value={newDecision.note} onChange={e => setNewDecision({...newDecision, note: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-amber-700">Submit Decision</button>
            </form>
          </div>
        </div>
      )}

      {hearingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHearingModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Schedule Hearing</h3><button onClick={() => setHearingModal(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <p className="text-sm text-gray-500 mb-2">Case: {hearingModal.caseNumber} - {hearingModal.title}</p>
            <form onSubmit={handleAddHearing} className="space-y-3">
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" value={newHearing.date} onChange={e => setNewHearing({...newHearing, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="time" value={newHearing.time} onChange={e => setNewHearing({...newHearing, time: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input type="text" value={newHearing.location} onChange={e => setNewHearing({...newHearing, location: e.target.value})} placeholder="e.g. Federal High Court" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><input type="text" value={newHearing.notes} onChange={e => setNewHearing({...newHearing, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700">Schedule Hearing</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
