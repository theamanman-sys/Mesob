import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePagination } from '../hooks/usePagination'
import { Briefcase, GraduationCap, Star, CheckCircle, XCircle, Clock, Search, Filter, Eye, BadgeCheck, DollarSign, FileText, ExternalLink, ChevronDown, ChevronLeft, UserCheck, Send, Users, Edit3, UserX, X } from 'lucide-react'
import { adminService } from '../services/adminService'

function formatBirr(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function PasswordResetModal({ isOpen, username, password, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!isOpen) return null
  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { const el = document.createElement('textarea'); el.value = password; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }
  return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 w-full max-w-md"><h2 className="text-xl font-semibold mb-4">Password Reset</h2><p className="mb-2">New password for <strong>{username}</strong>:</p><div className="flex items-center space-x-2 bg-gray-100 p-3 rounded mb-4"><code className="flex-1 text-sm">{password}</code><button onClick={copyToClipboard} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">{copied ? 'Copied!' : 'Copy'}</button></div><button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-md">Close</button></div></div>)
}

function CitizenProfileCard({ citizen, onBack, onToggleBadge, onEdit, onDelete }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mb-4 hover:text-blue-700"><ChevronLeft className="w-4 h-4" /> Back to users</button>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">{citizen.firstName?.[0]}{citizen.lastName?.[0]}</div>
              <div><h2 className="text-xl font-bold">{citizen.firstName} {citizen.lastName}</h2><p className="text-blue-200 text-sm">{citizen.email} {citizen.phone ? `• ${citizen.phone}` : ''}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(citizen)} className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white rounded-lg text-xs font-medium hover:bg-white/30 transition"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => onDelete(citizen)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/80 text-white rounded-lg text-xs font-medium hover:bg-red-500 transition"><UserX className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => onToggleBadge(citizen)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${citizen.isMesobVerified ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
              <BadgeCheck className="w-4 h-4" /> {citizen.isMesobVerified ? 'Remove Verified Badge' : 'Add Verified Badge'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-xl"><div className="text-lg font-black text-yellow-700">{citizen.isMesobVerified ? 'Yes' : 'No'}</div><div className="text-xs text-yellow-500"><BadgeCheck className="w-3 h-3 inline" /> MESOB Verified</div></div>
            <div className="text-center p-3 bg-green-50 rounded-xl"><div className="text-lg font-black text-green-700">{citizen.verifiedDocuments}/{citizen.totalDocuments || 0}</div><div className="text-xs text-green-500">Verified Docs</div></div>
            <div className="text-center p-3 bg-purple-50 rounded-xl"><div className="text-lg font-black text-purple-700 capitalize">{citizen.tinStatus}</div><div className="text-xs text-purple-500">TIN Status</div></div>
            <div className="text-center p-3 bg-blue-50 rounded-xl"><div className="text-lg font-black text-blue-700">{formatBirr(citizen.netWorth)}</div><div className="text-xs text-blue-500">Net Worth</div></div>
          </div>

          <div><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" /> Education ({citizen.education?.length || 0})</h3>
            {citizen.education?.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{citizen.education.map((e, i) => <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm"><div className="font-medium text-gray-800">{e.level} in {e.field}</div><div className="text-xs text-gray-500">{e.institution} • {e.year}</div></div>)}</div> : <p className="text-sm text-gray-400">No education data</p>}</div>

          <div><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-600" /> Work Experience ({citizen.experience?.length || 0})</h3>
            {citizen.experience?.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{citizen.experience.map((e, i) => <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm"><div className="font-medium text-gray-800">{e.title}</div><div className="text-xs text-gray-500">{e.company} • {e.years} years</div></div>)}</div> : <p className="text-sm text-gray-400">No experience data</p>}</div>

          <div><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Skills {citizen.skills?.length > 0 ? <span className="text-xs font-normal text-gray-400">({citizen.skills.join(', ')})</span> : ''}</h3>
            {citizen.skills?.length > 0 ? <div className="flex flex-wrap gap-2">{citizen.skills.map((s, i) => <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s}</span>)}</div> : <p className="text-sm text-gray-400">No skills listed</p>}</div>

          <div><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-blue-600" /> Job Suggestions</h3>
            <p className="text-sm text-gray-500">Based on their documents and profile, suggest jobs from the <a href="/citizen/jobs" className="text-blue-600 hover:underline">jobs board</a>.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {citizen.verifiedDocuments >= 2 && <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"><BadgeCheck className="w-3 h-3 inline" /> MESOB Verified - can apply to all jobs</span>}
              {citizen.tinStatus === 'active' && <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"><DollarSign className="w-3 h-3 inline" /> TIN Active - finance/tax jobs</span>}
              {citizen.skills?.some(s => s.toLowerCase().includes('driver') || s.toLowerCase().includes('driving')) && <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"><Briefcase className="w-3 h-3 inline" /> Driving skills - transport jobs</span>}
              {citizen.education?.some(e => e.field?.toLowerCase().includes('account') || e.field?.toLowerCase().includes('financ')) && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"><FileText className="w-3 h-3 inline" /> Finance education - accounting jobs</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminUserManagement() {
  const { user: currentUser, getAllUsers, deactivateUser, activateUser, unblockUser, deleteUser, resetUserPassword, isAdmin } = useAuth()
  const { showToast } = useToast()
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, username: '', password: '' })
  const { data: users, pagination, loading, refresh, page, setPage } = usePagination(getAllUsers, 10)
  const [citizenUsers, setCitizenUsers] = useState([])
  const [selectedCitizen, setSelectedCitizen] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [jobApps, setJobApps] = useState([])
  const [editUser, setEditUser] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    if (activeTab === 'citizens') {
      Promise.all([
        fetch('/api/admin/users').then(r => r.json()).then(r => r.data || []).catch(() => []),
        fetch('/api/admin/job-applications').then(r => r.json()).then(r => r.data || []).catch(() => [])
      ]).then(([c, j]) => { setCitizenUsers(c || []); setJobApps(j || []) })
    }
  }, [activeTab])

  const handleEditUser = async () => {
    if (!editUser) return
    setSavingEdit(true)
    try {
      await adminService.updateCitizenUser(editUser.id, editForm)
      setCitizenUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...editForm } : u))
      if (selectedCitizen?.id === editUser.id) setSelectedCitizen(prev => ({ ...prev, ...editForm }))
      setEditUser(null)
      showToast('User details updated', 'success')
    } catch (err) { showToast(err.message, 'error') }
    setSavingEdit(false)
  }

  if (!isAdmin()) return (<div className="flex items-center justify-center h-64"><div className="text-center"><h3 className="text-lg font-semibold mb-2">Access Denied</h3><p className="text-gray-600">You need admin privileges to access user management.</p></div></div>)

  const filteredCitizens = citizenUsers.filter(c => {
    const q = search.toLowerCase()
    return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  const handleDeactivate = async (id, username) => {
    if (username === currentUser?.username) { showToast('You cannot deactivate your own account', 'error'); return }
    try { await deactivateUser(id); showToast('User deactivated', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }
  const handleActivate = async (id) => {
    try { await activateUser(id); showToast('User activated', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }
  const handleUnblock = async (id) => {
    try { await unblockUser(id); showToast('User unblocked', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }
  const handleResetPassword = async (id, username) => {
    if (username === currentUser?.username) { showToast('You cannot reset your own password', 'error'); return }
    if (!window.confirm(`Reset password for "${username}"?`)) return
    try { const result = await resetUserPassword(id); result?.newPassword && setPasswordModal({ isOpen: true, username, password: result.newPassword }) }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }
  const handleDelete = async (id, username) => {
    if (username === currentUser?.username) { showToast('You cannot delete your own account', 'error'); return }
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try { await deleteUser(id); showToast('User deleted', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }
  const isBlocked = (u) => u.blockedUntil ? new Date(u.blockedUntil) > new Date() : false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('system')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><UserCheck className="w-4 h-4 inline mr-1" />System Users</button>
          <button onClick={() => setActiveTab('citizens')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'citizens' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Users className="w-4 h-4 inline mr-1" />Citizens & Jobs</button>
        </div>
      </div>

      {activeTab === 'system' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{u.username}</td>
                  <td className="px-6 py-4 text-sm">{u.email}</td>
                  <td className="px-6 py-4 text-sm capitalize">{u.role}</td>
                  <td className="px-6 py-4">{isBlocked(u) ? <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Blocked</span> : u.isActive !== false ? <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span> : <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {u.isActive !== false ? <button onClick={() => handleDeactivate(u.id, u.username)} className="text-yellow-600">Deactivate</button> : <button onClick={() => handleActivate(u.id)} className="text-green-600">Activate</button>}
                    {isBlocked(u) && <button onClick={() => handleUnblock(u.id)} className="text-blue-600">Unblock</button>}
                    <button onClick={() => handleResetPassword(u.id, u.username)} className="text-purple-600">Reset Pwd</button>
                    <button onClick={() => handleDelete(u.id, u.username)} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && <div className="text-center py-8 text-gray-500">No users found.</div>}
          {pagination?.totalPages > 1 && (<div className="flex justify-center space-x-2 p-4">{Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (<button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{p}</button>))}</div>)}
          <PasswordResetModal {...passwordModal} onClose={() => setPasswordModal({ isOpen: false, username: '', password: '' })} />
        </div>
      )}

      {activeTab === 'citizens' && (
        <div>
          {selectedCitizen ? (
            <CitizenProfileCard citizen={selectedCitizen} onBack={() => setSelectedCitizen(null)}
              onToggleBadge={async (u) => {
                try {
                  await adminService.updateUserBadge(u.id, { isMesobVerified: !u.isMesobVerified })
                  setCitizenUsers(prev => prev.map(c => c.id === u.id ? { ...c, isMesobVerified: !u.isMesobVerified } : c))
                  setSelectedCitizen(prev => ({ ...prev, isMesobVerified: !u.isMesobVerified }))
                  showToast(`Verified badge ${!u.isMesobVerified ? 'added' : 'removed'}`, 'success')
                } catch (err) { showToast(err.message, 'error') }
              }}
              onEdit={(u) => { setEditUser(u); setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '' }) }}
              onDelete={async (u) => {
                if (!window.confirm(`Delete citizen "${u.firstName} ${u.lastName}"? This cannot be undone.`)) return
                try { await adminService.deleteCitizenUser(u.id); setCitizenUsers(prev => prev.filter(c => c.id !== u.id)); setSelectedCitizen(null); showToast('User deleted', 'success') } catch (err) { showToast(err.message, 'error') }
              }} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search citizens..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" /></div>
                <div className="text-sm text-gray-500">{filteredCitizens.length} citizens</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left p-3 font-semibold text-gray-600">Citizen</th><th className="text-left p-3 font-semibold text-gray-600">Contact</th><th className="text-center p-3 font-semibold text-gray-600">Docs</th><th className="text-center p-3 font-semibold text-gray-600">TIN</th><th className="text-center p-3 font-semibold text-gray-600">Education</th><th className="text-center p-3 font-semibold text-gray-600">Experience</th><th className="text-center p-3 font-semibold text-gray-600">Skills</th><th className="text-right p-3 font-semibold text-gray-600">Net Worth</th><th className="text-center p-3 font-semibold text-gray-600">Action</th></tr></thead>
                  <tbody>
                    {filteredCitizens.map(c => (
                      <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                        <td className="p-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">{c.firstName?.[0]}{c.lastName?.[0]}</div><div className="font-medium text-gray-900">{c.firstName} {c.lastName}</div></div></td>
                        <td className="p-3 text-gray-500 text-xs">{c.email}<br />{c.phone || '—'}</td>
                        <td className="p-3 text-center"><span className={`font-bold ${c.verifiedDocuments >= 2 ? 'text-green-600' : c.verifiedDocuments > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{c.verifiedDocuments}</span></td>
                        <td className="p-3 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.tinStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.tinStatus}</span></td>
                        <td className="p-3 text-center">{c.education?.length > 0 ? <GraduationCap className="w-4 h-4 text-blue-500 mx-auto" title={c.education.map(e => `${e.level} ${e.field}`).join(', ')} /> : '—'}</td>
                        <td className="p-3 text-center">{c.experience?.length > 0 ? <Briefcase className="w-4 h-4 text-green-500 mx-auto" title={c.experience.map(e => `${e.title} at ${e.company}`).join(', ')} /> : '—'}</td>
                        <td className="p-3 text-center">{c.skills?.length > 0 ? <div className="flex flex-wrap gap-1 justify-center">{c.skills.slice(0, 3).map((s, i) => <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{s}</span>)}</div> : '—'}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">{formatBirr(c.netWorth)}</td>
                        <td className="p-3 text-center"><button onClick={() => setSelectedCitizen(c)} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">View Profile</button></td>
                      </tr>
                    ))}
                    {filteredCitizens.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-gray-400">No citizens found.</td></tr>}
                  </tbody>
                </table>
              </div>

              {jobApps.length > 0 && (
                <div className="border-t border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-blue-600" /> Recent Job Applications ({jobApps.length})</h3>
                  <div className="space-y-2">{jobApps.slice(0, 5).map(app => <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><div className="text-sm font-medium text-gray-800">{app.fullName}</div><div className="text-xs text-gray-500">{app.job?.title || 'Unknown'} at {app.job?.company || 'Unknown'}</div></div><div className="flex items-center gap-2"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${app.status === 'submitted' ? 'bg-blue-100 text-blue-700' : app.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' : app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{app.status}</span><button onClick={() => setSelectedCitizen(citizenUsers.find(c => c.id === app.citizenId))} className="text-xs text-blue-600 hover:underline">View</button></div></div>)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Citizen User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Edit3 className="w-4 h-4 text-blue-600" /> Edit Citizen Details</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">First Name</label><input type="text" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label><input type="text" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Phone</label><input type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEditUser} disabled={savingEdit}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"><UserCheck className="w-4 h-4 inline mr-1.5" /> Save Changes</button>
              <button onClick={() => setEditUser(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
