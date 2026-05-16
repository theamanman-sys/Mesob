import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, CheckCircle, XCircle, ToggleLeft, ToggleRight, Shield, Activity, Globe, Users as UsersIcon, Target, Settings, Save, Route } from 'lucide-react'
import { citizenService } from '../services/citizenService'
import api from '../services/api'

const STATUS_COLORS = { fully_operational: 'text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-300', partially_operational: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900 dark:text-yellow-300', closed: 'text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-300' }
const TIER_COLORS = { tier_1: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', tier_2: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
const ROUTE_STATUS = { 1: 'text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-300', 0: 'text-gray-400 bg-gray-100 dark:bg-gray-700 dark:text-gray-400' }

export default function AdminDepartments() {
  const [controls, setControls] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [apisixRoutes, setApisixRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([
      citizenService.getDepartmentControls(),
      citizenService.getBudgets(),
      api.get('/apisix/routes').then(r => r.data.data?.list || []).catch(() => [])
    ]).then(([c, b, ar]) => {
      setControls(c || { departments: [] })
      setBudgets(b || [])
      setApisixRoutes(ar || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const toggleApisixRoute = async (deptId) => {
    const route = apisixRoutes.find(r => r.departmentId === deptId)
    if (!route) return
    try {
      const { data } = await api.put(`/apisix/routes/${route.id}/status`)
      setApisixRoutes(prev => prev.map(r => r.id === route.id ? data.data : r))
    } catch (e) { console.error(e) }
  }

  const toggleDept = (id, field) => {
    if (!controls?.departments) return
    const updated = {
      ...controls,
      departments: controls.departments.map(d => d.id === id ? { ...d, [field]: !d[field] } : d)
    }
    setControls(updated)
  }

  const updateDept = (id, field, value) => {
    if (!controls?.departments) return
    setControls({
      ...controls,
      departments: controls.departments.map(d => d.id === id ? { ...d, [field]: value } : d)
    })
  }

  const saveControls = async () => {
    setSaving(true)
    setMessage('')
    try {
      await citizenService.updateDepartmentControls(controls)
      setMessage('Department controls saved successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      setMessage('Failed to save controls')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const totalDepts = controls?.departments?.length || 0
  const activeDepts = controls?.departments?.filter(d => d.isActive).length || 0
  const approvedBudgets = controls?.departments?.filter(d => d.budgetApproved).length || 0
  const canAllocate = controls?.departments?.filter(d => d.canReceiveAllocation).length || 0

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Department Controls</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all government departments and their operational settings</p>
        </div>
        <button onClick={saveControls} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </motion.div>

      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
          {message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"><Building2 className="w-5 h-5" /></div><span className="text-sm text-gray-500">Total Departments</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{totalDepts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300"><Activity className="w-5 h-5" /></div><span className="text-sm text-gray-500">Active</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{activeDepts} / {totalDepts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300"><CheckCircle className="w-5 h-5" /></div><span className="text-sm text-gray-500">Budget Approved</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{approvedBudgets} / {totalDepts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300"><Target className="w-5 h-5" /></div><span className="text-sm text-gray-500">Can Receive Allocation</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{canAllocate} / {totalDepts}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Department Control Panel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="text-left py-2">Department</th>
                <th className="text-center py-2">Active</th>
                <th className="text-center py-2">Budget Approved</th>
                <th className="text-center py-2">Can Receive</th>
                <th className="text-center py-2">APISIX Route</th>
                <th className="text-right py-2">Max Staff</th>
                <th className="text-center py-2">Status</th>
                <th className="text-center py-2">Tier</th>
              </tr>
            </thead>
            <tbody>
              {controls?.departments?.map((d) => {
                const budget = budgets.find(b => b.departmentId === d.id)
                return (
                  <tr key={d.id} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-gray-400">{d.shortName} • {d.region}</div>
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => toggleDept(d.id, 'isActive')} className="mx-auto">
                        {d.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => toggleDept(d.id, 'budgetApproved')} className="mx-auto">
                        {d.budgetApproved ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <button onClick={() => toggleDept(d.id, 'canReceiveAllocation')} className="mx-auto">
                        {d.canReceiveAllocation ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      {(() => {
                        const route = apisixRoutes.find(r => r.departmentId === d.id)
                        return route ? (
                          <button onClick={() => toggleApisixRoute(d.id)} className="mx-auto" title={`${route.name} - ${route.status ? 'Active' : 'Inactive'}`}>
                            <div className="flex items-center gap-1">
                              <Route className={`w-3.5 h-3.5 ${route.status ? 'text-blue-500' : 'text-gray-300'}`} />
                              {route.status ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                            </div>
                          </button>
                        ) : <span className="text-xs text-gray-400">—</span>
                      })()}
                    </td>
                    <td className="py-3 text-right">
                      <input type="number" value={d.maxStaff} onChange={e => updateDept(d.id, 'maxStaff', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-right border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </td>
                    <td className="py-3 text-center">
                      <select value={d.operationalStatus} onChange={e => updateDept(d.id, 'operationalStatus', e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 ${STATUS_COLORS[d.operationalStatus] || ''}`}>
                        <option value="fully_operational">Fully Operational</option>
                        <option value="partially_operational">Partial</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[d.serviceTier] || ''}`}>
                        {d.serviceTier === 'tier_1' ? 'Tier 1' : 'Tier 2'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Global Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 cursor-pointer">
            <input type="checkbox" checked={controls?.budgetApprovalRequired ?? true} onChange={() => setControls({ ...controls, budgetApprovalRequired: !controls?.budgetApprovalRequired })} className="w-4 h-4" />
            <div><div className="font-medium text-gray-700 dark:text-gray-300">Budget Approval Required</div><div className="text-xs text-gray-500">Departments need approval for budget allocation</div></div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 cursor-pointer">
            <input type="checkbox" checked={controls?.automaticAllocation ?? false} onChange={() => setControls({ ...controls, automaticAllocation: !controls?.automaticAllocation })} className="w-4 h-4" />
            <div><div className="font-medium text-gray-700 dark:text-gray-300">Automatic Allocation</div><div className="text-xs text-gray-500">Auto-allocate budget based on department size</div></div>
          </label>
          <div className="p-3 rounded-lg border dark:border-gray-700">
            <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Max Allocation %</div>
            <input type="number" value={controls?.maxAllocationPercent ?? 20} onChange={e => setControls({ ...controls, maxAllocationPercent: parseInt(e.target.value) || 0 })}
              className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PageLoader() { return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div> }
