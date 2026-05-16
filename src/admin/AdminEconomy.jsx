import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, DollarSign, TrendingUp, Building2, PiggyBank, Globe, Target, Landmark, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { citizenService } from '../services/citizenService'

const COLORS = ['#1e40af','#047857','#b45309','#7c3aed','#be123c','#6366f1','#0891b2','#d97706','#059669','#dc2626','#db2777','#4f46e5','#0d9488','#ca8a04','#16a34a']

function SimplePie({ data, size = 200 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let cumulative = 0
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="transform -rotate-90">
      {data.map((d, i) => {
        const pct = d.value / total
        const offset = cumulative
        cumulative += pct
        return <circle key={i} cx="16" cy="16" r="15.915" fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2" strokeDasharray={`${pct * 100} ${100 - pct * 100}`} strokeDashoffset={-offset * 100} />
      })}
    </svg>
  )
}

function formatBirr(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

export default function AdminEconomy() {
  const [budgets, setBudgets] = useState([])
  const [overview, setOverview] = useState({})
  const [economy, setEconomy] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      citizenService.getBudgets(),
      citizenService.getBudgetOverview(),
      citizenService.getEconomyData()
    ]).then(([b, o, e]) => {
      setBudgets(b || [])
      setOverview(o || {})
      setEconomy(e || {})
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const sectorData = economy?.sectors ? Object.entries(economy.sectors).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })) : []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Economy & Budget Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">Fiscal Year {overview.fiscalYear || '2025/26'}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Landmark} label="National Budget" value={formatBirr(overview.totalNationalBudget)} sub={`${formatBirr(overview.totalAllocated)} allocated`} color="blue" />
        <SummaryCard icon={DollarSign} label="Revenue Collected" value={formatBirr(overview.totalRevenueCollected)} sub={`${formatBirr(overview.totalNetWorth)} total net worth`} color="green" />
        <SummaryCard icon={TrendingUp} label="Budget Utilization" value={`${overview.budgetUtilizationRate || 0}%`} sub={`${formatBirr(overview.totalSpent)} spent`} color="purple" />
        <SummaryCard icon={Globe} label="GDP" value={`$${(economy?.gdp || 0).toFixed(1)}B`} sub={`${economy?.gdpGrowth || 0}% growth • $${economy?.gdpPerCapita || 0}/capita`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Building2 className="w-5 h-5" /> Department Budgets & Net Worth</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="text-left py-2">Department</th>
                  <th className="text-right py-2">Annual Budget</th>
                  <th className="text-right py-2">Allocated</th>
                  <th className="text-right py-2">Spent</th>
                  <th className="text-right py-2">Remaining</th>
                  <th className="text-right py-2">Net Worth</th>
                  <th className="text-right py-2">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(b => {
                  const util = b.annualBudget > 0 ? ((b.spent / b.annualBudget) * 100).toFixed(1) : 0
                  return (
                    <tr key={b.id} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-2 font-medium">{b.departmentName}</td>
                      <td className="py-2 text-right">{formatBirr(b.annualBudget)}</td>
                      <td className="py-2 text-right">{formatBirr(b.allocated)}</td>
                      <td className="py-2 text-right">{formatBirr(b.spent)}</td>
                      <td className="py-2 text-right">{formatBirr(b.remaining)}</td>
                      <td className="py-2 text-right font-semibold">{formatBirr(b.netWorth)}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${parseFloat(util) > 80 ? 'bg-green-100 text-green-700' : parseFloat(util) > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {util}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><PiggyBank className="w-5 h-5" /> Economy by Sector</h2>
          <div className="flex justify-center mb-4">
            <SimplePie data={sectorData} size={180} />
          </div>
          <div className="space-y-3">
            {sectorData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{s.value}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between"><span>GDP Growth</span><span className="font-semibold text-green-600">{economy?.gdpGrowth}%</span></div>
            <div className="flex justify-between"><span>Inflation</span><span className="font-semibold text-red-600">{economy?.inflation}%</span></div>
            <div className="flex justify-between"><span>Unemployment</span><span className="font-semibold text-orange-600">{economy?.unemployment}%</span></div>
            <div className="flex justify-between"><span>Population</span><span className="font-semibold">{economy?.population}M</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, sub, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300', green: 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300', purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300' }
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}><Icon className="w-5 h-5" /></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </motion.div>
  )
}

function PageLoader() {
  return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
}
