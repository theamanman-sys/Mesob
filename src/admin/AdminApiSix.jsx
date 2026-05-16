import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Route, Server, Plug, Key, Users, Activity, Plus, Trash2, Edit3, ToggleLeft, ToggleRight,
  Globe, Shield, Zap, RefreshCw, Save, X, CheckCircle, XCircle, ExternalLink, Search,
  Sliders, Power, PowerOff, ChevronDown, ChevronUp, Network, Layers
} from 'lucide-react'
import api from '../services/api'

const PLUGIN_COLORS = {
  'rate-limit': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'key-auth': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  cors: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'ip-restriction': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'basic-auth': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  prometheus: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'log-rotate': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  redirect: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'response-rewrite': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'proxy-cache': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
}

export default function AdminApiSix() {
  const [routes, setRoutes] = useState([])
  const [upstreams, setUpstreams] = useState([])
  const [plugins, setPlugins] = useState([])
  const [consumers, setConsumers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedRoute, setExpandedRoute] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', uri: '', upstreamId: '', departmentName: '', desc: '', priority: 0 })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rRes, uRes, pRes, cRes, dRes] = await Promise.all([
        api.get('/apisix/routes'), api.get('/apisix/upstreams'), api.get('/apisix/plugins'),
        api.get('/apisix/consumers'), api.get('/apisix/dashboard')
      ])
      setRoutes(rRes.data.data?.list || [])
      setUpstreams(uRes.data.data?.list || [])
      setPlugins(pRes.data.data?.list || [])
      setConsumers(cRes.data.data?.list || [])
      setStats(dRes.data.data || {})
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const toggleRoute = async (id) => {
    try {
      const { data } = await api.put(`/apisix/routes/${id}/status`)
      setRoutes(prev => prev.map(r => r.id === id ? data.data : r))
    } catch (e) { console.error(e) }
  }

  const deleteRoute = async (id) => {
    if (!confirm('Delete this route?')) return
    try {
      await api.delete(`/apisix/routes/${id}`)
      setRoutes(prev => prev.filter(r => r.id !== id))
    } catch (e) { console.error(e) }
  }

  const openCreateForm = () => {
    setEditingRoute(null)
    setForm({ name: '', uri: '', upstreamId: '', departmentName: '', desc: '', priority: 0 })
    setShowForm(true)
  }

  const openEditForm = (route) => {
    setEditingRoute(route)
    setForm({ name: route.name, uri: route.uri, upstreamId: route.upstreamId, departmentName: route.departmentName || '', desc: route.desc || '', priority: route.priority || 0 })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingRoute) {
        const { data } = await api.put(`/apisix/routes/${editingRoute.id}`, form)
        setRoutes(prev => prev.map(r => r.id === editingRoute.id ? data.data : r))
      } else {
        const { data } = await api.post('/apisix/routes', form)
        setRoutes(prev => [...prev, data.data])
      }
      setShowForm(false)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const filteredRoutes = routes.filter(r =>
    !searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.uri?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity, count: null },
    { id: 'routes', label: 'Routes', icon: Route, count: routes.length },
    { id: 'upstreams', label: 'Upstreams', icon: Server, count: upstreams.length },
    { id: 'plugins', label: 'Plugins', icon: Plug, count: plugins.length },
    { id: 'consumers', label: 'Consumers', icon: Key, count: consumers.length },
  ]

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <img src="https://img.shields.io/badge/Apache-APISIX-blue?style=flat&logo=apache" alt="APISIX" className="h-6" onError={(e) => e.target.style.display = 'none'} />
            API Gateway Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Apache APISIX admin console • Route, upstream & plugin management</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard icon={Route} label="Total Routes" value={stats?.totalRoutes || 0} color="blue" />
        <StatCard icon={CheckCircle} label="Active Routes" value={stats?.activeRoutes || 0} color="green" />
        <StatCard icon={Server} label="Upstreams" value={stats?.totalUpstreams || 0} color="purple" />
        <StatCard icon={Key} label="Consumers" value={stats?.totalConsumers || 0} color="amber" />
        <StatCard icon={Zap} label="Rate Limit" value={stats?.totalRateLimit?.toLocaleString() || 0} sub="req/min total" color="indigo" />
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700 pb-2 overflow-x-auto">
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {t.count !== null && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-200 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-600'}`}>{t.count}</span>}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Network className="w-4 h-4" /> Routes by Status</h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Active: <strong>{stats?.activeRoutes || 0}</strong></span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400" /><span className="text-sm text-gray-600 dark:text-gray-400">Inactive: <strong>{stats?.inactiveRoutes || 0}</strong></span></div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${stats?.totalRoutes > 0 ? (stats.activeRoutes / stats.totalRoutes) * 100 : 0}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg"><div className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats?.totalUpstreams || 0}</div><div className="text-xs text-blue-600 dark:text-blue-400">Upstream Backends</div></div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg"><div className="text-lg font-bold text-purple-700 dark:text-purple-300">{stats?.totalPlugins || 0}</div><div className="text-xs text-purple-600 dark:text-purple-400">Available Plugins</div></div>
                <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg"><div className="text-lg font-bold text-green-700 dark:text-green-300">{stats?.totalConsumers || 0}</div><div className="text-xs text-green-600 dark:text-green-400">API Consumers</div></div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900 rounded-lg"><div className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats?.healthyUpstreams || 0}</div><div className="text-xs text-amber-600 dark:text-amber-400">Health Checked</div></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Route List</h3>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {routes.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${r.status ? 'bg-green-500' : 'bg-red-400'}`} />
                      <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.uri}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{r.departmentName || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'routes' && (
          <motion.div key="rt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search routes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <button onClick={openCreateForm} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition">
                <Plus className="w-4 h-4" /> Create Route
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-sm p-6 border border-blue-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      {editingRoute ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {editingRoute ? 'Edit Route' : 'New Route'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div><label className="block text-xs text-gray-500 mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">URI Pattern</label><input type="text" value={form.uri} onChange={e => setForm({...form, uri: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="/api/dept/*" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Upstream</label><select value={form.upstreamId} onChange={e => setForm({...form, upstreamId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="">Select upstream</option>
                        {upstreams.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Department</label><input type="text" value={form.departmentName} onChange={e => setForm({...form, departmentName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                      <div className="md:col-span-2"><label className="block text-xs text-gray-500 mb-1">Description</label><input type="text" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Priority</label><input type="number" value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
                      <div className="flex items-end gap-2">
                        <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">Cancel</button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">URI</th>
                      <th className="text-left py-3 px-4">Upstream</th>
                      <th className="text-left py-3 px-4">Department</th>
                      <th className="text-left py-3 px-4">Plugins</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map(r => (
                      <tr key={r.id} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <button onClick={() => toggleRoute(r.id)} title={r.status ? 'Disable' : 'Enable'}>
                            {r.status ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-300" />}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => setExpandedRoute(expandedRoute === r.id ? null : r.id)} className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-white hover:text-blue-600">
                            {r.name}
                            {expandedRoute === r.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="py-3 px-4"><code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{r.uri}</code></td>
                        <td className="py-3 px-4 text-xs text-gray-500">{r.upstreamId}</td>
                        <td className="py-3 px-4 text-xs">{r.departmentName || '-'}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {r.plugins && Object.entries(r.plugins).slice(0, 2).map(([p]) => (
                              <span key={p} className={`text-xs px-1.5 py-0.5 rounded-full ${PLUGIN_COLORS[p] || 'bg-gray-100 text-gray-600'}`}>{p}</span>
                            ))}
                            {r.plugins && Object.keys(r.plugins).length > 2 && (
                              <span className="text-xs text-gray-400">+{Object.keys(r.plugins).length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEditForm(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteRoute(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRoutes.length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-400">No routes found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {expandedRoute && (() => {
                const r = routes.find(x => x.id === expandedRoute)
                if (!r) return null
                return (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><h4 className="text-xs font-semibold text-gray-500 mb-2">Route Details</h4>
                        <div className="space-y-1 text-sm"><div><span className="text-gray-400">ID:</span> {r.id}</div>
                        <div><span className="text-gray-400">Priority:</span> {r.priority}</div>
                        <div><span className="text-gray-400">Created:</span> {r.createTime ? new Date(r.createTime * 1000).toLocaleDateString() : '-'}</div></div>
                      </div>
                      <div><h4 className="text-xs font-semibold text-gray-500 mb-2">Configured Plugins</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {r.plugins && Object.entries(r.plugins).map(([p, config]) => (
                            <div key={p} className={`text-xs px-2 py-1 rounded-lg ${PLUGIN_COLORS[p] || 'bg-gray-100 text-gray-600'}`}>
                              <span className="font-medium">{p}</span>
                              {config && typeof config === 'object' && Object.keys(config).length > 0 && (
                                <div className="text-[10px] opacity-75 mt-0.5">{Object.entries(config).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div><h4 className="text-xs font-semibold text-gray-500 mb-2">Upstream Info</h4>
                        {(() => {
                          const us = upstreams.find(u => u.id === r.upstreamId)
                          return us ? (
                            <div className="text-sm space-y-1">
                              <div><span className="text-gray-400">Name:</span> {us.name}</div>
                              <div><span className="text-gray-400">Type:</span> {us.type}</div>
                              <div><span className="text-gray-400">Nodes:</span> {us.nodes?.map(n => `${n.host}:${n.port}`).join(', ')}</div>
                            </div>
                          ) : <span className="text-sm text-gray-400">Not configured</span>
                        })()}
                      </div>
                    </div>
                  </motion.div>
                )
              })()}
            </div>
          </motion.div>
        )}

        {tab === 'upstreams' && (
          <motion.div key="us" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upstreams.map(u => (
                <div key={u.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${u.checks?.active?.http_path ? 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-gray-50 text-gray-400 dark:bg-gray-700'}`}>
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-white">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.id}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.checks?.active?.http_path ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                      {u.checks?.active?.http_path ? 'Healthy' : 'Passive'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div>Type: <span className="font-medium text-gray-700 dark:text-gray-300">{u.type}</span></div>
                    <div>Desc: {u.desc || '-'}</div>
                    <div>Nodes:</div>
                    {u.nodes?.map((n, i) => (
                      <div key={i} className="flex items-center gap-2 ml-2">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <code className="text-xs">{n.host}:{n.port}</code>
                        <span className="text-gray-400">w:{n.weight}</span>
                      </div>
                    ))}
                  </div>
                  {u.timeout && (
                    <div className="mt-3 pt-3 border-t dark:border-gray-700 text-xs text-gray-400">
                      Timeout: connect={u.timeout.connect}s send={u.timeout.send}s read={u.timeout.read}s
                      {u.retries ? ` • Retries: ${u.retries}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'plugins' && (
          <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plugins.map(p => (
                <div key={p.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border-l-4" style={{ borderColor: p.type === 'auth' ? '#7c3aed' : p.type === 'traffic' ? '#1e40af' : p.type === 'security' ? '#dc2626' : p.type === 'observability' ? '#059669' : p.type === 'caching' ? '#d97706' : p.type === 'transformer' ? '#0891b2' : '#6b7280' }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                      <Plug className="w-3.5 h-3.5" /> {p.name}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">{p.version}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{p.desc}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded-full ${PLUGIN_COLORS[p.name] || 'bg-gray-100 text-gray-600 dark:bg-gray-700'}`}>{p.type}</span>
                    <span className="text-gray-400">Priority: {p.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'consumers' && (
          <motion.div key="co" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consumers.map(c => (
                <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300"><Key className="w-4 h-4" /></div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-white">{c.username}</div>
                      <div className="text-xs text-gray-400">{c.id}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{c.desc}</p>
                  <div className="space-y-1.5">
                    {c.plugins && Object.entries(c.plugins).map(([p, config]) => (
                      <div key={p} className={`text-xs px-2 py-1 rounded-lg ${PLUGIN_COLORS[p] || 'bg-gray-100 text-gray-600 dark:bg-gray-700'}`}>
                        <span className="font-medium">{p}</span>
                        {config && typeof config === 'object' && <span className="ml-1 opacity-75">• {Object.values(config).filter(v => typeof v === 'string').join(', ')}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300', green: 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300', purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300', indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}><Icon className="w-5 h-5" /></div>
        <div><div className="text-xs text-gray-500 dark:text-gray-400">{label}</div><div className="text-xl font-bold text-gray-800 dark:text-white">{value}</div>{sub && <div className="text-[10px] text-gray-400">{sub}</div>}</div>
      </div>
    </motion.div>
  )
}

function PageLoader() { return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div> }
