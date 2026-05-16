import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Plus, CheckCircle, XCircle, Clock, Building2, Users, TrendingUp, Send, Ban } from 'lucide-react'
import { citizenService } from '../services/citizenService'

const COLORS = ['#1e40af','#047857','#b45309','#7c3aed','#be123c']

function formatBirr(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

export default function AdminWealthAllocator() {
  const [allocations, setAllocations] = useState([])
  const [stats, setStats] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ type: 'department', targetId: '', targetName: '', department: '', amount: '', purpose: '' })

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      citizenService.getAllocations(),
      citizenService.getAllocationStats(),
      citizenService.getDepartmentControls()
    ]).then(([a, s, c]) => {
      setAllocations(a || [])
      setStats(s || {})
      setDepartments(c?.departments || [])
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || !form.targetName) return
    setSubmitting(true)
    try {
      await citizenService.createAllocation({
        type: form.type,
        targetId: form.targetId ? parseInt(form.targetId) : null,
        targetName: form.targetName,
        department: form.department || (form.type === 'department' ? form.targetName : ''),
        amount: parseFloat(form.amount),
        purpose: form.purpose
      })
      setShowForm(false)
      setForm({ type: 'department', targetId: '', targetName: '', department: '', amount: '', purpose: '' })
      fetchData()
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const handleStatus = async (id, status) => {
    try {
      await citizenService.updateAllocationStatus(id, status)
      fetchData()
    } catch (e) { console.error(e) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Wealth Allocator</h1>
          <p className="text-gray-500 dark:text-gray-400">Allocate national wealth to departments and population programs</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> New Allocation
        </button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Create New Allocation</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, targetId: '', targetName: '' })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="department">Department</option>
                <option value="population">Population Program</option>
              </select>
            </div>
            {form.type === 'department' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <select value={form.targetId} onChange={e => {
                  const dept = departments.find(d => d.id === parseInt(e.target.value))
                  setForm({ ...form, targetId: e.target.value, targetName: dept?.name || '', department: dept?.name || '' })
                }} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program Name</label>
                <input type="text" value={form.targetName} onChange={e => setForm({ ...form, targetName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Rural Electrification" />
              </div>
            )}
            {form.type === 'population' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsible Department</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (ETB)</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 500000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
              <input type="text" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Infrastructure development" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Allocation'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">Cancel</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"><Wallet className="w-5 h-5" /></div><span className="text-sm text-gray-500">Total Allocated</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{formatBirr(stats?.totalAllocated)}</div>
          <div className="text-xs text-gray-400 mt-1">{stats?.count || 0} allocations</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300"><CheckCircle className="w-5 h-5" /></div><span className="text-sm text-gray-500">Approved</span></div>
          <div className="text-2xl font-bold text-green-600">{formatBirr(stats?.approved)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"><Clock className="w-5 h-5" /></div><span className="text-sm text-gray-500">Pending</span></div>
          <div className="text-2xl font-bold text-yellow-600">{formatBirr(stats?.pending)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300"><Ban className="w-5 h-5" /></div><span className="text-sm text-gray-500">Rejected</span></div>
          <div className="text-2xl font-bold text-red-600">{formatBirr(stats?.rejected)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Allocation History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-gray-500">
                  <th className="text-left py-2">Target</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2">Purpose</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-center py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.id} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2">
                      <div className="font-medium">{a.targetName}</div>
                      <div className="text-xs text-gray-400">{a.department}</div>
                    </td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${a.type === 'department' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
                        {a.type === 'department' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {a.type}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold">{formatBirr(a.amount)} ETB</td>
                    <td className="py-2 text-xs text-gray-500 max-w-[150px] truncate">{a.purpose}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${a.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : a.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                        {a.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : a.status === 'pending' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-gray-500">{new Date(a.allocatedAt).toLocaleDateString()}</td>
                    <td className="py-2 text-center">
                      {a.status === 'pending' && (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleStatus(a.id, 'approved')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => handleStatus(a.id, 'rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">By Type</h2>
            <div className="space-y-3">
              {stats?.byType?.map((t, i) => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      {t.name === 'department' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {t.name}
                    </span>
                    <span className="font-semibold">{formatBirr(t.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${stats?.totalAllocated > 0 ? (t.amount / stats.totalAllocated) * 100 : 0}%`, backgroundColor: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">By Department</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {stats?.byDepartment?.map((d, i) => (
                <div key={d.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400 truncate">{d.name}</span>
                    <span className="font-semibold text-xs">{formatBirr(d.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${stats?.totalAllocated > 0 ? (d.amount / stats.totalAllocated) * 100 : 0}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PageLoader() { return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div> }
