import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Filter, Search, BarChart3, PieChart, Calendar, Building2, Globe, Target, CheckCircle, XCircle, Download } from 'lucide-react'
import { citizenService } from '../services/citizenService'

const COLORS = ['#1e40af','#047857','#b45309','#7c3aed','#be123c','#6366f1','#0891b2','#d97706']

function formatBirr(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

export default function AdminTax() {
  const [taxData, setTaxData] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', region: '', month: '', status: '' })
  const [showFilters, setShowFilters] = useState(false)

  const fetchData = (f = filters) => {
    setLoading(true)
    const params = {}
    if (f.type) params.type = f.type
    if (f.region) params.region = f.region
    if (f.month) params.month = f.month
    if (f.status) params.status = f.status
    Promise.all([
      citizenService.getTaxData(params),
      citizenService.getTaxStats()
    ]).then(([t, s]) => {
      setTaxData(t || [])
      setStats(s || {})
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(filters) }, [])

  const applyFilters = () => fetchData(filters)
  const clearFilters = () => { setFilters({ type: '', region: '', month: '', status: '' }); fetchData({ type: '', region: '', month: '', status: '' }) }

  const uniqueTypes = [...new Set(stats?.byType?.map(t => t.name) || [])]
  const uniqueRegions = [...new Set(taxData.map(t => t.region).filter(Boolean))]
  const uniqueMonths = [...new Set(taxData.map(t => t.month).filter(Boolean))].sort()

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tax & Revenue Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Detailed tax collection data with filters and analytics</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 transition">
          <Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </motion.div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tax Type</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">All Types</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Region</label>
              <select value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">All Regions</option>
                {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
              <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">All Months</option>
                {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">All Status</option>
                <option value="collected">Collected</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Apply</button>
              <button onClick={clearFilters} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 transition">Clear</button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"><DollarSign className="w-5 h-5" /></div><span className="text-sm text-gray-500">Total Collected</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{formatBirr(stats?.totalCollected)} ETB</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300"><Target className="w-5 h-5" /></div><span className="text-sm text-gray-500">Total Target</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{formatBirr(stats?.totalTarget)} ETB</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${parseFloat(stats?.collectionRate || 0) >= 90 ? 'bg-green-50 text-green-600' : parseFloat(stats?.collectionRate || 0) >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'} dark:bg-gray-700`}><TrendingUp className="w-5 h-5" /></div><span className="text-sm text-gray-500">Collection Rate</span></div>
          <div className={`text-2xl font-bold ${parseFloat(stats?.collectionRate || 0) >= 90 ? 'text-green-600' : parseFloat(stats?.collectionRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{stats?.collectionRate || 0}%</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300"><BarChart3 className="w-5 h-5" /></div><span className="text-sm text-gray-500">Total Records</span></div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{taxData.length}</div>
          <div className="text-xs text-gray-400 mt-1">tax entries</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><PieChart className="w-4 h-4" /> By Tax Type</h2>
          <div className="space-y-3">
            {stats?.byType?.map((t, i) => {
              const pct = stats.totalCollected > 0 ? ((t.amount / stats.totalCollected) * 100).toFixed(1) : 0
              return (
                <div key={t.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{t.name}</span>
                    <div><span className="font-semibold text-gray-800 dark:text-white">{formatBirr(t.amount)}</span> <span className="text-gray-400 text-xs">({pct}%)</span></div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Globe className="w-4 h-4" /> By Region</h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {stats?.byRegion?.map((r, i) => {
              const pct = stats.totalCollected > 0 ? ((r.amount / stats.totalCollected) * 100).toFixed(1) : 0
              return (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{r.name}</span>
                    <div><span className="font-semibold text-gray-800 dark:text-white">{formatBirr(r.amount)}</span> <span className="text-gray-400 text-xs">({pct}%)</span></div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Monthly Collection</h2>
          <div className="space-y-3">
            {stats?.byMonth?.map((m, i) => {
              const maxVal = Math.max(...(stats?.byMonth?.map(x => x.amount) || [1]), 1)
              return (
                <div key={m.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{m.month}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{formatBirr(m.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: `${(m.amount / maxVal) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" /> Tax Records
          <span className="text-sm font-normal text-gray-400">({taxData.length} entries)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Category</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-right py-2">Target</th>
                <th className="text-right py-2">Achieved</th>
                <th className="text-left py-2">Region</th>
                <th className="text-left py-2">Month</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {taxData.map(t => {
                const achieved = t.target > 0 ? ((t.amount / t.target) * 100).toFixed(1) : 0
                return (
                  <tr key={t.id} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2 font-medium">{t.type}</td>
                    <td className="py-2 text-xs text-gray-500">{t.category}</td>
                    <td className="py-2 text-right font-semibold">{formatBirr(t.amount)}</td>
                    <td className="py-2 text-right">{formatBirr(t.target)}</td>
                    <td className="py-2 text-right">
                      <span className={`text-xs font-medium ${parseFloat(achieved) >= 100 ? 'text-green-600' : parseFloat(achieved) >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {achieved}%
                      </span>
                    </td>
                    <td className="py-2">{t.region}</td>
                    <td className="py-2 text-xs text-gray-500">{t.month}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${t.status === 'collected' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : t.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                        {t.status === 'collected' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-gray-400 max-w-[120px] truncate">{t.notes || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PageLoader() { return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div> }
