import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, CheckCircle, Clock, XCircle, Search, BadgeCheck, X, Hash, DollarSign, ChevronLeft, Receipt, FileText, UserCheck, UserX, Edit3 } from 'lucide-react'
import { adminService } from '../services/adminService'
import { useToast } from '../context/ToastContext'
import usePolling from '../hooks/usePolling'

function formatBirr(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}><Icon className="w-6 h-6" /></div>
      <div><div className="text-sm text-gray-500">{label}</div><div className="text-2xl font-black text-gray-900">{sub ? `${value} (${sub}%)` : value}</div></div>
    </motion.div>
  )
}

function BadgePill({ status }) {
  const s = {
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    not_submitted: 'bg-gray-100 text-gray-400',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    unregistered: 'bg-gray-100 text-gray-400'
  }[status] || 'bg-gray-100 text-gray-500'
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s}`}>{status}</span>
}

export default function AdminVerifications() {
  const { showToast } = useToast()
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedVer, setSelectedVer] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('documents')
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})

  const fetchAll = useCallback(async () => {
    const [u, s, v] = await Promise.all([
      adminService.getCitizenUsers(),
      adminService.getVerifiedStats(),
      adminService.getVerifications()
    ])
    setUsers(u || [])
    setStats(s || {})
    setVerifications(v || [])
  }, [])

  const loadData = useCallback(() => {
    setLoading(true)
    fetchAll().catch(console.error).finally(() => setLoading(false))
  }, [fetchAll])

  const refreshData = useCallback(() => {
    fetchAll().catch(console.error)
  }, [fetchAll])

  useEffect(() => { loadData() }, [loadData])

  usePolling(refreshData, 5000)

  const filtered = users.filter(u => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase()
    const email = (u.email || '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  const userVerdocs = (userId) => verifications.filter(v => v.citizenId === userId)

  const updateVerStatus = async (verId, status) => {
    setProcessing(true)
    try {
      await adminService.updateVerification(verId, { status, adminNotes: adminNotes || undefined })
      setVerifications(prev => prev.map(v => v.id === verId ? { ...v, status, adminNotes: adminNotes || v.adminNotes, verifiedAt: ['verified','rejected'].includes(status) ? new Date().toISOString() : v.verifiedAt } : v))
      setSelectedVer(null)
      setAdminNotes('')
      const [updated, updatedStats, updatedVers] = await Promise.all([
        adminService.getCitizenUsers(),
        adminService.getVerifiedStats(),
        adminService.getVerifications()
      ])
      setUsers(updated)
      setStats(updatedStats)
      setVerifications(updatedVers)
      showToast(`Verification ${status} successfully`, 'success')
    } catch (err) { showToast(err.message, 'error') }
    setProcessing(false)
  }

  const toggleVerifiedBadge = async (user, value) => {
    try {
      await adminService.updateUserBadge(user.id, { isMesobVerified: value })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isMesobVerified: value } : u))
      if (selectedUser?.id === user.id) setSelectedUser(prev => ({ ...prev, isMesobVerified: value }))
      showToast(`Verified badge ${value ? 'added' : 'removed'} for ${user.firstName} ${user.lastName}`, 'success')
    } catch (err) { showToast(err.message, 'error') }
  }

  const updateUserDetails = async () => {
    setProcessing(true)
    try {
      await adminService.updateCitizenUser(editUser.id, editForm)
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editForm } : u))
      if (selectedUser?.id === editUser.id) setSelectedUser(prev => ({ ...prev, ...editForm }))
      setEditUser(null)
      showToast('User details updated', 'success')
    } catch (err) { showToast(err.message, 'error') }
    setProcessing(false)
  }

  const deleteCitizenUser = async (user) => {
    if (!window.confirm(`Delete citizen "${user.firstName} ${user.lastName}"? This cannot be undone.`)) return
    try {
      await adminService.deleteCitizenUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      if (selectedUser?.id === user.id) setSelectedUser(null)
      showToast('User deleted', 'success')
    } catch (err) { showToast(err.message, 'error') }
  }

  if (loading) return <div className="min-h-[400px] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900">Citizen Verifications</h1><p className="text-gray-500 text-sm mt-1">Review and manage citizen identity verifications, tax, TIN, and badges</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Users} label="Total Citizens" value={stats.totalCitizens || 0} sub={stats.verificationRate} color="blue" />
        <StatCard icon={BadgeCheck} label="MESOB Verified" value={stats.verifiedCitizens || 0} color="green" />
        <StatCard icon={Clock} label="Pending Review" value={stats.pendingVerifications || 0} color="yellow" />
        <StatCard icon={Hash} label="TIN Registered" value={stats.tinRegistered || 0} color="purple" />
        <StatCard icon={Receipt} label="Tax Pending" value={stats.taxPending || 0} color="amber" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'documents' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Shield className="w-4 h-4 inline mr-1.5" />Documents</button>
        <button onClick={() => setActiveTab('tax')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'tax' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Receipt className="w-4 h-4 inline mr-1.5" />Tax Verification</button>
        <button onClick={() => setActiveTab('tin')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'tin' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Hash className="w-4 h-4 inline mr-1.5" />TIN Registrations</button>
        <button onClick={() => setActiveTab('badges')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'badges' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><BadgeCheck className="w-4 h-4 inline mr-1.5" />Verified Badges</button>
      </div>

      {activeTab === 'tax' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><div className="text-sm text-amber-600">Tax Clearance</div><div className="text-2xl font-bold text-amber-800">{stats.byType?.tax_clearance || 0} verified</div></div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200"><div className="text-sm text-blue-600">Business Tax</div><div className="text-2xl font-bold text-blue-800">{stats.byType?.business_tax || 0} verified</div></div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200"><div className="text-sm text-purple-600">VAT Certificate</div><div className="text-2xl font-bold text-purple-800">{stats.byType?.vat_certificate || 0} verified</div></div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-500" /> Pending Tax Document Verifications</h3>
            {(() => {
              const taxVers = verifications.filter(v => ['tin_certificate','tax_clearance','business_tax','vat_certificate'].includes(v.documentType))
              return taxVers.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No tax-related document verifications.</p> : (
                <div className="space-y-3">{taxVers.map(v => <div key={v.id} className="flex items-center justify-between p-4 rounded-xl border border-amber-100 bg-amber-50"><div><div className="font-semibold text-gray-800 text-sm capitalize">{v.documentType?.replace(/_/g, ' ')}</div><div className="text-xs text-gray-500">{v.citizenName || 'Unknown'} • Submitted {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : '—'}</div></div><div className="flex items-center gap-2"><BadgePill status={v.status} />{v.status === 'pending' && <button onClick={() => setSelectedVer(v)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Review</button>}</div></div>)}</div>
              )
            })()}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Approve Tax Verification</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b text-gray-500"><th className="text-left py-2">Citizen</th><th className="text-left py-2">Tax Type</th><th className="text-center py-2">Status</th><th className="text-center py-2">Action</th></tr></thead>
                <tbody>{(() => {
                  const taxUsers = users.filter(u => u.tinStatus === 'active' || verifications.some(v => v.citizenId === u.id && ['tin_certificate','tax_clearance','business_tax','vat_certificate'].includes(v.documentType)))
                  return taxUsers.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No tax records found.</td></tr> :
                    taxUsers.slice(0, 20).map(u => {
                      const userTaxVers = verifications.filter(v => v.citizenId === u.id && ['tin_certificate','tax_clearance','business_tax','vat_certificate'].includes(v.documentType))
                      const pendingCount = userTaxVers.filter(v => v.status === 'pending').length
                      return <tr key={u.id} className="border-b hover:bg-gray-50"><td className="py-2 font-medium">{u.firstName} {u.lastName}</td><td className="py-2 text-gray-500">{userTaxVers.map(v => v.documentType?.replace(/_/g, ' ')).join(', ') || '—'}</td><td className="py-2 text-center">{pendingCount > 0 ? <span className="text-yellow-600 text-xs font-medium">{pendingCount} pending</span> : <span className="text-green-600 text-xs font-medium">Verified</span>}</td><td className="py-2 text-center"><button onClick={() => { setSelectedUser(u); setActiveTab('documents') }} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Manage</button></td></tr>
                    })
                })()}</tbody></table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'tin' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-purple-500" /> TIN Registration Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b text-gray-500"><th className="text-left py-2">Citizen</th><th className="text-left py-2">TIN Number</th><th className="text-center py-2">Status</th><th className="text-center py-2">Verified Docs</th><th className="text-center py-2">Approve TIN</th></tr></thead>
                <tbody>{users.filter(u => u.tinNumber || u.tinStatus !== 'unregistered').map(u => <tr key={u.id} className="border-b hover:bg-gray-50"><td className="py-2 font-medium">{u.firstName} {u.lastName}</td><td className="py-2 text-gray-500">{u.tinNumber || '—'}</td><td className="py-2 text-center"><BadgePill status={u.tinStatus} /></td><td className="py-2 text-center">{u.verifiedDocuments}/{u.totalDocuments || 0}</td><td className="py-2 text-center"><div className="flex items-center justify-center gap-2">{u.tinStatus === 'pending' && <button onClick={async () => { const tinVer = verifications.find(v => v.citizenId === u.id && ['tin_certificate', 'tin'].includes(v.documentType) && v.status === 'pending'); if (tinVer) { await updateVerStatus(tinVer.id, 'verified') } else { await adminService.updateUserBadge(u.id, { tinStatus: 'active' }); setUsers(prev => prev.map(x => x.id === u.id ? { ...x, tinStatus: 'active' } : x)) } showToast('TIN approved', 'success') }} className="text-xs px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle className="w-3 h-3 inline mr-1" />Approve</button>}{u.tinStatus === 'active' && <CheckCircle className="w-5 h-5 text-green-500" />}</div></td></tr>)}
                {users.filter(u => u.tinNumber || u.tinStatus !== 'unregistered').length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No TIN registrations found.</td></tr>}
              </tbody></table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'badges' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search citizens..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
              </div>
              <div className="text-sm text-gray-500">{filtered.length} citizens</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-600">Citizen</th>
                  <th className="text-center p-3 font-semibold text-gray-600">MESOB Verified</th>
                  <th className="text-center p-3 font-semibold text-gray-600">TIN Status</th>
                  <th className="text-center p-3 font-semibold text-gray-600">Toggle Badge</th>
                </tr></thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                          <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {u.isMesobVerified ? <BadgeCheck className="w-5 h-5 text-yellow-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}
                      </td>
                      <td className="p-3 text-center"><BadgePill status={u.tinStatus} /></td>
                      <td className="p-3 text-center">
                        <button onClick={() => toggleVerifiedBadge(u, !u.isMesobVerified)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${u.isMesobVerified ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {u.isMesobVerified ? 'Remove Badge' : 'Add Badge'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-gray-400">No citizens found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'documents' && (selectedUser ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setSelectedUser(null)} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mb-4 hover:text-blue-700"><ChevronLeft className="w-4 h-4" /> Back to all users</button>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-sm text-gray-500">{selectedUser.email} {selectedUser.phone ? `• ${selectedUser.phone}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setEditUser(selectedUser); setEditForm({ firstName: selectedUser.firstName, lastName: selectedUser.lastName, email: selectedUser.email, phone: selectedUser.phone || '' }) }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><Edit3 className="w-3.5 h-3.5" /> Edit User</button>
                <button onClick={() => deleteCitizenUser(selectedUser)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"><UserX className="w-3.5 h-3.5" /> Delete</button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => toggleVerifiedBadge(selectedUser, !selectedUser.isMesobVerified)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedUser.isMesobVerified ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                <BadgeCheck className="w-3.5 h-3.5" /> {selectedUser.isMesobVerified ? 'Remove MESOB Verified Badge' : 'Add MESOB Verified Badge'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-xl"><div className="text-2xl font-black text-blue-700">{selectedUser.verifiedDocuments || 0}</div><div className="text-xs text-blue-500">Verified Docs</div></div>
              <div className="text-center p-3 bg-purple-50 rounded-xl"><div className="text-2xl font-black text-purple-700 capitalize">{selectedUser.tinStatus}</div><div className="text-xs text-purple-500">TIN Status</div></div>
              <div className="text-center p-3 bg-green-50 rounded-xl"><div className="text-2xl font-black text-green-700">{formatBirr(selectedUser.netWorth)}</div><div className="text-xs text-green-500">Net Worth</div></div>
              <div className="text-center p-3 bg-gray-50 rounded-xl"><div className="text-2xl font-black text-gray-700">{selectedUser.totalDocuments || 0}</div><div className="text-xs text-gray-500">Total Docs</div></div>
            </div>

            <h3 className="font-semibold text-gray-700 mb-3">Document Verifications</h3>
            <div className="space-y-3">
              {userVerdocs(selectedUser.id).length === 0 && <p className="text-sm text-gray-400 text-center py-6">No verification documents submitted.</p>}
              {userVerdocs(selectedUser.id).map(v => (
                <div key={v.id} className={`flex items-center justify-between p-4 rounded-xl border ${v.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm capitalize">{v.documentType?.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{v.fileName || 'No file'} • Submitted {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : '—'}{v.adminNotes ? ` • Note: ${v.adminNotes}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgePill status={v.status} />
                    {v.status === 'pending' && (
                      <button onClick={() => setSelectedVer(v)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Review</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left p-3 font-semibold text-gray-600">Citizen</th>
                <th className="text-left p-3 font-semibold text-gray-600">Contact</th>
                <th className="text-center p-3 font-semibold text-gray-600">Verified Docs</th>
                <th className="text-center p-3 font-semibold text-gray-600">TIN Status</th>
                <th className="text-center p-3 font-semibold text-gray-600">MESOB Verified</th>
                <th className="text-right p-3 font-semibold text-gray-600">Net Worth</th>
                <th className="text-center p-3 font-semibold text-gray-600">Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                        <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{u.email}<br />{u.phone || '—'}</td>
                    <td className="p-3 text-center">
                      <span className={`font-bold ${u.verifiedDocuments >= 2 ? 'text-green-600' : u.verifiedDocuments > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{u.verifiedDocuments}</span>
                      <span className="text-gray-400">/{u.totalDocuments}</span>
                    </td>
                    <td className="p-3 text-center"><BadgePill status={u.tinStatus} /></td>
                    <td className="p-3 text-center">
                      {u.isMesobVerified ? <BadgeCheck className="w-5 h-5 text-yellow-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-900">{formatBirr(u.netWorth)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => setSelectedUser(u)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">View</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No citizens found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Edit User Details</h3>
                <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="block text-xs font-medium text-gray-500 mb-1">First Name</label><input type="text" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label><input type="text" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label><input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={updateUserDetails} disabled={processing}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"><UserCheck className="w-4 h-4 inline mr-1.5" /> Save Changes</button>
                <button onClick={() => setEditUser(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Review Modal */}
      <AnimatePresence>
        {selectedVer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 capitalize">Review {selectedVer.documentType?.replace(/_/g, ' ')}</h3>
                <button onClick={() => setSelectedVer(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 mb-5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Citizen</span><span className="font-medium">{selectedVer.citizenName || 'Unknown'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{selectedVer.citizenEmail || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Document</span><span className="font-medium capitalize">{selectedVer.documentType?.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">File</span><span className="font-medium">{selectedVer.fileName || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span className="font-medium">{selectedVer.submittedAt ? new Date(selectedVer.submittedAt).toLocaleString() : '—'}</span></div>
              </div>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Admin notes (optional)..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm mb-4" rows={3} />
              <div className="flex gap-3">
                <button onClick={() => updateVerStatus(selectedVer.id, 'verified')} disabled={processing}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition"><CheckCircle className="w-4 h-4 inline mr-1.5" /> Approve</button>
                <button onClick={() => updateVerStatus(selectedVer.id, 'rejected')} disabled={processing}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition"><XCircle className="w-4 h-4 inline mr-1.5" /> Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}