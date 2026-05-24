import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Link } from 'react-router-dom'
import usePolling from '../hooks/usePolling'
import {
  Building2, DollarSign, TrendingUp, Users, Ticket, Wallet,
  BarChart3, Activity, Globe, Newspaper, Video, ExternalLink,
  Calendar, MapPin, RefreshCw, ChevronRight, AlertCircle, PieChart,
  Download, Smartphone, Zap, Target, Landmark, PiggyBank, ArrowUpRight,
  ArrowDownRight, CheckCircle, XCircle, Clock, Eye, Briefcase, GraduationCap, UserCheck, BadgeCheck, Award
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'
import { adminService } from '../services/adminService'

const COLORS = ['#1e40af','#047857','#b45309','#7c3aed','#be123c','#6366f1','#0891b2','#d97706','#059669','#dc2626','#db2777','#4f46e5','#0d9488','#ca8a04','#16a34a']
const PIE_COLORS = ['#1e40af', '#047857', '#b45309']

function formatBirr(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function formatNum(n) {
  if (!n) return '0'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [news, setNews] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsLoading, setNewsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [citizenUsers, setCitizenUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [jobApps, setJobApps] = useState([])
  const [services, setServices] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)

  const loadStats = useCallback(async (silent) => {
    if (!silent) setStatsLoading(true)
    try {
      const [u, j, ja, s] = await Promise.all([
        adminService.getCitizenUsers().catch(() => []),
        fetch('/api/jobs').then(r => r.json()).then(r => r.data || []).catch(() => []),
        fetch('/api/admin/job-applications').then(r => r.json()).then(r => r.data || []).catch(() => []),
        fetch('/api/services').then(r => r.json()).then(r => r.data || []).catch(() => [])
      ])
      setCitizenUsers(u || [])
      setJobs(j || [])
      setJobApps(ja || [])
      setServices(s || [])
    } catch {}
    if (!silent) setStatsLoading(false)
  }, [])

  const refreshNews = useCallback(async (silent) => {
    if (!silent) setNewsLoading(true)
    try {
      const [n, v] = await Promise.all([
        adminService.fetchNewsFromRss(),
        adminService.getVideos()
      ])
      if (n?.length) setNews(n)
      if (v?.length) setVideos(v)
    } catch {}
    if (!silent) setNewsLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    adminService.getDashboardData()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    Promise.all([
      adminService.getEthiopiaNews(),
      adminService.getVideos()
    ]).then(([n, v]) => {
      setNews(n || [])
      setVideos(v || [])
    }).catch(() => {}).finally(() => setNewsLoading(false))

    loadStats()
  }, [loadStats])

  usePolling(() => loadStats(true), 10000)
  usePolling(() => refreshNews(true), 30000)

  if (loading) return <PageLoader />

  const { budgets, overview, economy, taxStats, ticketStats, population, contributions } = data || {}
  const sectorData = economy?.sectors
    ? Object.entries(economy.sectors).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : []

  const topDepts = [...(budgets || [])].sort((a, b) => b.annualBudget - a.annualBudget).slice(0, 8)
  const taxByType = taxStats?.byType || []
  const taxByMonth = taxStats?.byMonth || []
  const populationRegions = population?.regions?.slice(0, 10) || []
  const ageGroups = population?.ageGroups || []

  const sections = [
    { id: 'overview', label: t('Overview'), icon: BarChart3 },
    { id: 'economy', label: t('Economy'), icon: TrendingUp },
    { id: 'budgets', label: t('Budgets'), icon: PiggyBank },
    { id: 'tax', label: t('Tax Revenue'), icon: DollarSign },
    { id: 'population', label: t('Population'), icon: Users },
    { id: 'services', label: t('Services'), icon: Briefcase },
    { id: 'users', label: t('Citizens'), icon: Users },
    { id: 'jobs', label: t('Jobs'), icon: Award },
    { id: 'news', label: t('News Feed'), icon: Newspaper },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Ethiopia National Dashboard')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('Welcome back, {name}', { name: user?.username || 'Admin' })} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSection === s.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm dark:bg-red-900 dark:text-red-300">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {(activeSection === 'overview' || activeSection === 'economy') && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={Landmark} label={t('National Budget')} value={`${formatBirr(overview?.totalNationalBudget)} ETB`} sub={`${overview?.fiscalYear || '2025/26'} • ${formatBirr(overview?.totalAllocated)} ${t('allocated')}`} change={`${overview?.budgetUtilizationRate || 0}% ${t('utilized')}`} changeType={parseFloat(overview?.budgetUtilizationRate || 0) > 80 ? 'up' : 'neutral'} color="blue" />
            <SummaryCard icon={DollarSign} label={t('Revenue Collected')} value={`${formatBirr(overview?.totalRevenueCollected)} ETB`} sub={`${formatBirr(taxStats?.totalCollected)} ${t('tax')} • ${formatBirr(ticketStats?.totalRevenue || 0)} ${t('tickets')}`} change={`${taxStats?.collectionRate || 0}% ${t('of target')}`} changeType={parseFloat(taxStats?.collectionRate || 0) > 85 ? 'up' : parseFloat(taxStats?.collectionRate || 0) > 60 ? 'neutral' : 'down'} color="green" />
            <SummaryCard icon={Globe} label={t('Economy')} value={`$${economy?.gdp || '155.8'}B ${t('GDP')}`} sub={`$${economy?.gdpPerCapita || 1123}/${t('capita')}`} change={`${economy?.gdpGrowth || 6.4}% ${t('growth')}`} changeType="up" color="purple" />
            <SummaryCard icon={Users} label={t('Population')} value={formatNum(population?.total)} sub={`${population?.growthRate || 2.6}% ${t('growth')} • ${economy?.unemployment || 19.1}% ${t('unemployment')}`} change={`${economy?.inflation || 23.5}% ${t('inflation')}`} changeType="down" color="amber" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div key="overview-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <ChartCard title={t('Economy by Sector')} icon={PieChart}>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {sectorData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2">
                    {sectorData.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-gray-600 dark:text-gray-400">{s.name}: <strong>{s.value}%</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

              <ChartCard title={t('Top Department Budgets')} icon={Building2}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topDepts} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="shortName" width={60} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${formatBirr(v)} ETB`} />
                    <Bar dataKey="annualBudget" radius={[0, 4, 4, 0]}>
                      {topDepts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('Tax Collection by Type')} icon={DollarSign}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={taxByType} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${formatBirr(v)} ETB`} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {taxByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('Monthly Tax Revenue Trend')} icon={TrendingUp} span={2}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={taxByMonth}>
                    <defs>
                      <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1e40af" stopOpacity={0.3}/><stop offset="95%" stopColor="#1e40af" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${formatBirr(v)} ETB`} />
                    <Area type="monotone" dataKey="amount" stroke="#1e40af" fill="url(#colorTax)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('Key Indicators')} icon={Activity}>
                <div className="space-y-3">
                  {[
                    { label: t('GDP Growth'), value: `${economy?.gdpGrowth || 6.4}%`, color: 'text-green-600', icon: TrendingUp },
                    { label: t('Inflation Rate'), value: `${economy?.inflation || 23.5}%`, color: 'text-red-600', icon: ArrowDownRight },
                    { label: t('Unemployment'), value: `${economy?.unemployment || 19.1}%`, color: 'text-orange-600', icon: AlertCircle },
                    { label: t('GDP Per Capita'), value: `$${economy?.gdpPerCapita || 1123}`, color: 'text-blue-600', icon: DollarSign },
                    { label: t('Population Growth'), value: `${population?.growthRate || 2.6}%`, color: 'text-purple-600', icon: TrendingUp },
                    { label: t('Literacy Rate'), value: `${population?.literacyRate || 51.8}%`, color: 'text-green-600', icon: Activity },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <ChartCard title={t('Population by Region (Top 10)')} icon={Users}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={populationRegions} layout="vertical" margin={{ left: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => formatNum(v)} />
                    <Bar dataKey="population" radius={[0, 4, 4, 0]}>
                      {populationRegions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={t('Age Distribution')} icon={Activity}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ageGroups} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="group" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {ageGroups.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-5 gap-2 mt-3 text-center text-xs text-gray-500">
                  {ageGroups.map((g, i) => (
                    <div key={g.group}><div className="font-semibold text-gray-700 dark:text-gray-300">{g.percentage}%</div><div>{g.group}</div></div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeSection === 'economy' && <EconomySection economy={economy} sectorData={sectorData} overview={overview} />}
        {activeSection === 'budgets' && <BudgetsSection budgets={budgets} overview={overview} />}
        {activeSection === 'tax' && <TaxSection taxStats={taxStats} taxByType={taxByType} taxByMonth={taxByMonth} />}
        {activeSection === 'population' && <PopulationSection population={population} />}
        {activeSection === 'services' && <ServicesSection services={services} />}
        {activeSection === 'users' && <UsersSection users={citizenUsers} loading={statsLoading} />}
        {activeSection === 'jobs' && <JobsSection jobs={jobs} applications={jobApps} loading={statsLoading} />}
        {activeSection === 'news' && (
          <NewsSection news={news} videos={videos} loading={newsLoading} onRefresh={refreshNews} />
        )}
      </AnimatePresence>
    </div>
  )
}

function EconomySection({ economy, sectorData, overview }) {
  const { t } = useLanguage()
  return (
    <motion.div key="economy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('GDP & Economic Indicators')} icon={TrendingUp}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: t('GDP'), value: `$${economy?.gdp || 155.8}B`, sub: t('Nominal GDP') },
              { label: t('Growth'), value: `${economy?.gdpGrowth || 6.4}%`, sub: t('Annual Growth Rate') },
              { label: t('Per Capita'), value: `$${economy?.gdpPerCapita || 1123}`, sub: t('GDP per Capita') },
              { label: t('Inflation'), value: `${economy?.inflation || 23.5}%`, sub: t('CPI Inflation') },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-gray-800 dark:text-white">{item.value}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</div>
                <div className="text-xs text-gray-400">{item.sub}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                  {sectorData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
        <ChartCard title={t('National Budget Breakdown')} icon={PiggyBank}>
          <div className="space-y-4">
            {[
              { label: t('Total Budget'), value: formatBirr(overview?.totalNationalBudget), pct: 100 },
              { label: t('Allocated'), value: formatBirr(overview?.totalAllocated), pct: overview?.totalNationalBudget ? (overview.totalAllocated / overview.totalNationalBudget * 100).toFixed(1) : 0 },
              { label: t('Spent'), value: formatBirr(overview?.totalSpent), pct: overview?.totalNationalBudget ? (overview.totalSpent / overview.totalNationalBudget * 100).toFixed(1) : 0 },
              { label: t('Remaining'), value: formatBirr(overview?.totalRemaining), pct: overview?.totalNationalBudget ? (overview.totalRemaining / overview.totalNationalBudget * 100).toFixed(1) : 0 },
              { label: t('Revenue Collected'), value: formatBirr(overview?.totalRevenueCollected), pct: overview?.totalNationalBudget ? (overview.totalRevenueCollected / overview.totalNationalBudget * 100).toFixed(1) : 0 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </motion.div>
  )
}

function BudgetsSection({ budgets, overview }) {
  const { t } = useLanguage()
  const sorted = [...(budgets || [])].sort((a, b) => b.annualBudget - a.annualBudget)
  return (
    <motion.div key="budgets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Total Budget')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{formatBirr(overview?.totalNationalBudget)} ETB</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Total Net Worth')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{formatBirr(overview?.totalNetWorth)} ETB</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Budget Utilization')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{overview?.budgetUtilizationRate || 0}%</div></div>
      </div>
      <ChartCard title={t('All Department Budgets & Net Worth')} icon={Building2} full>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="text-left py-2">{t('Department')}</th>
                <th className="text-right py-2">{t('Annual Budget')}</th>
                <th className="text-right py-2">{t('Allocated')}</th>
                <th className="text-right py-2">{t('Spent')}</th>
                <th className="text-right py-2">{t('Remaining')}</th>
                <th className="text-right py-2">{t('Net Worth')}</th>
                <th className="text-right py-2">{t('Utilization')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(b => {
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
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${parseFloat(util) > 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : parseFloat(util) > 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{util}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </motion.div>
  )
}

function TaxSection({ taxStats, taxByType, taxByMonth }) {
  const { t } = useLanguage()
  return (
    <motion.div key="tax" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Total Tax Collected')}</div><div className="text-2xl font-bold text-green-600">{formatBirr(taxStats?.totalCollected)} ETB</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Total Target')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{formatBirr(taxStats?.totalTarget)} ETB</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">{t('Collection Rate')}</div>
          <div className={`text-2xl font-bold ${parseFloat(taxStats?.collectionRate || 0) >= 85 ? 'text-green-600' : parseFloat(taxStats?.collectionRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{taxStats?.collectionRate || 0}%</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('Tax Collection by Type')} icon={PieChart}>
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie data={taxByType} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="amount" label={({ name, amount }) => `${name}: ${formatBirr(amount)}`} labelLine={true}>
                {taxByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${formatBirr(v)} ETB`} />
            </RePieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t('Monthly Tax Revenue Trend')} icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={taxByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${formatBirr(v)} ETB`} />
              <Line type="monotone" dataKey="amount" stroke="#1e40af" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.div>
  )
}

function PopulationSection({ population }) {
  const { t } = useLanguage()
  const regions = population?.regions || []
  const ageGroups = population?.ageGroups || []
  return (
    <motion.div key="population" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Users className="w-4 h-4" /> {t('Total Population')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{formatNum(population?.total)}</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Activity className="w-4 h-4" /> {t('Growth Rate')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{population?.growthRate || 0}%</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><Smartphone className="w-4 h-4" /> {t('Literacy Rate')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{population?.literacyRate || 0}%</div></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5"><div className="flex items-center gap-2 text-sm text-gray-500 mb-1"><MapPin className="w-4 h-4" /> {t('Median Age')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{population?.medianAge || 0}</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('Population by Region')} icon={BarChart3}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={regions} layout="vertical" margin={{ left: 5, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => formatNum(v)} />
              <Bar dataKey="population" radius={[0, 4, 4, 0]}>
                {regions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title={t('Age Distribution & Urban/Rural Split')} icon={Activity}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageGroups} margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="group" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {ageGroups.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-center"><div className="text-lg font-bold text-blue-700 dark:text-blue-300">{population?.urbanRural?.urban || 0}%</div><div className="text-xs text-blue-600 dark:text-blue-400">{t('Urban')}</div></div>
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg text-center"><div className="text-lg font-bold text-green-700 dark:text-green-300">{population?.urbanRural?.rural || 0}%</div><div className="text-xs text-green-600 dark:text-green-400">{t('Rural')}</div></div>
          </div>
        </ChartCard>
      </div>
    </motion.div>
  )
}

function NewsSection({ news, videos, loading, onRefresh }) {
  const { t } = useLanguage()
  const [localNews, setLocalNews] = useState(news)
  const [localVideos, setLocalVideos] = useState(videos)
  const [selectedArticle, setSelectedArticle] = useState(null)

  useEffect(() => { setLocalNews(news) }, [news])
  useEffect(() => { setLocalVideos(videos) }, [videos])

  return (
    <motion.div key="news" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5" /> {t('Ethiopia News & Updates')}
        </h2>
        <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('Refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : localNews.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center text-gray-400">
              <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('No news articles available. Click refresh to fetch latest news.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localNews.map((article, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group cursor-pointer"
                  onClick={() => setSelectedArticle(article)}>
                  <div className="h-36 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden">
                    {article.image ? (
                      <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Newspaper className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <span className="text-xs text-white/80">{article.source || t('News Source')}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-2 group-hover:text-blue-600 transition">{article.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{article.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">{timeAgo(article.pubDate)}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-md font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Video className="w-4 h-4" /> {t('Videos')}
          </h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 animate-pulse"><div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" /><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" /></div>)}</div>
          ) : localVideos.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center text-gray-400">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('No videos available')}</p>
            </div>
          ) : (
            localVideos.map((video, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group cursor-pointer"
                onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}>
                <div className="h-28 bg-gray-100 dark:bg-gray-700 relative">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e) => { e.target.style.display = 'none' }} />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Video className="w-8 h-8 text-gray-300" /></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition">
                      <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-white line-clamp-2">{video.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                    <span>{video.channel || 'YouTube'}</span>
                    {video.views && <><span>•</span><span><Eye className="w-3 h-3 inline" /> {video.views}</span></>}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedArticle(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {selectedArticle.image && (
                <div className="h-48 bg-gray-100 dark:bg-gray-700">
                  <img src={selectedArticle.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span>{selectedArticle.source || t('News Source')}</span>
                  <span>•</span>
                  <span>{selectedArticle.pubDate ? new Date(selectedArticle.pubDate).toLocaleDateString() : ''}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">{selectedArticle.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedArticle.description}</p>
                {selectedArticle.link && (
                  <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                    <ExternalLink className="w-4 h-4" /> {t('Read Full Article')}
                  </a>
                )}
                <button onClick={() => setSelectedArticle(null)} className="ml-3 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">{t('Close')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ServicesSection({ services }) {
  const { t } = useLanguage()
  const byDept = {}
  services?.forEach(s => { const d = s.department || 'Other'; byDept[d] = (byDept[d] || 0) + 1 })
  const deptData = Object.entries(byDept).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  return (
    <motion.div key="services" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600"><div className="text-sm text-gray-500">{t('Total Services')}</div><div className="text-2xl font-bold text-gray-800">{services?.length || 0}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-600"><div className="text-sm text-gray-500">{t('Departments')}</div><div className="text-2xl font-bold text-gray-800">{deptData.length}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-600"><div className="text-sm text-gray-500">{t('Online Services')}</div><div className="text-2xl font-bold text-gray-800">{services?.filter(s => s.isOnline !== false).length || 0}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-600"><div className="text-sm text-gray-500">{t('Walk-in Only')}</div><div className="text-2xl font-bold text-gray-800">{services?.filter(s => s.isOnline === false).length || 0}</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('Services by Department')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-gray-500"><th className="text-left py-2">{t('Department')}</th><th className="text-right py-2">{t('Count')}</th></tr></thead><tbody>
            {deptData.map((d, i) => <tr key={i} className="border-b hover:bg-gray-50"><td className="py-2 font-medium">{d.name}</td><td className="py-2 text-right"><span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{d.count}</span></td></tr>)}
          </tbody></table>
        </div>
      </div>
    </motion.div>
  )
}

function UsersSection({ users, loading }) {
  const { t } = useLanguage()
  const verified = users?.filter(u => u.isMesobVerified).length || 0
  const withTin = users?.filter(u => u.tinStatus === 'active').length || 0
  const withEdu = users?.filter(u => u.education?.length > 0).length || 0
  return (
    <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Total Citizens')}</div><div className="text-2xl font-bold text-gray-800">{users?.length || 0}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('MESOB Verified')}</div><div className="text-2xl font-bold text-green-600">{verified}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('TIN Registered')}</div><div className="text-2xl font-bold text-purple-600">{withTin}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Has Documents')}</div><div className="text-2xl font-bold text-blue-600">{withEdu}</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> {t('Registered Citizens')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-gray-500"><th className="text-left py-2">{t('Name')}</th><th className="text-left py-2">{t('Email')}</th><th className="text-center py-2">{t('Verified')}</th><th className="text-center py-2">{t('Documents')}</th><th className="text-center py-2">{t('Education')}</th><th className="text-center py-2">{t('TIN')}</th><th className="text-right py-2">{t('Net Worth')}</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="7" className="text-center py-8 text-gray-400">{t('Loading...')}</td></tr> : users?.length === 0 ? <tr><td colSpan="7" className="text-center py-8 text-gray-400">{t('No citizens registered')}</td></tr> :
            users?.slice(0, 20).map(u => <tr key={u.id} className="border-b hover:bg-gray-50"><td className="py-2 font-medium">{u.firstName} {u.lastName}</td><td className="py-2 text-gray-500 text-xs">{u.email}</td><td className="py-2 text-center">{u.isMesobVerified ? <BadgeCheck className="w-4 h-4 text-yellow-500 mx-auto" /> : '-'}</td><td className="py-2 text-center">{u.verifiedDocuments}{u.totalDocuments ? `/${u.totalDocuments}` : ''}</td><td className="py-2 text-center">{u.education?.length > 0 ? <GraduationCap className="w-4 h-4 text-blue-500 mx-auto" /> : '-'}</td><td className="py-2 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.tinStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.tinStatus}</span></td><td className="py-2 text-right font-semibold">{formatBirr(u.netWorth)}</td></tr>)}
          </tbody></table>
        </div>
        {users?.length > 20 && <div className="text-center mt-3"><Link to="/admin/verifications" className="text-sm text-blue-600 hover:underline">{t('View all {count} citizens', { count: users.length })} →</Link></div>}
      </div>
    </motion.div>
  )
}

function JobsSection({ jobs, applications, loading }) {
  const { t } = useLanguage()
  const categories = {}
  jobs?.forEach(j => { categories[j.category] = (categories[j.category] || 0) + 1 })
  const catData = Object.entries(categories).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  return (
    <motion.div key="jobs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Total Jobs')}</div><div className="text-2xl font-bold text-gray-800">{jobs?.length || 0}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Applications')}</div><div className="text-2xl font-bold text-blue-600">{applications?.length || 0}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Categories')}</div><div className="text-2xl font-bold text-purple-600">{catData.length}</div></div>
        <div className="bg-white rounded-xl shadow-sm p-5"><div className="text-sm text-gray-500">{t('Full-Time')}</div><div className="text-2xl font-bold text-green-600">{jobs?.filter(j => j.type === 'full-time').length || 0}</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('Jobs by Category')}</h3>
          <div className="space-y-3">{catData.slice(0, 8).map((c, i) => <div key={c.name}><div className="flex justify-between text-sm mb-1"><span className="capitalize text-gray-600">{c.name}</span><span className="font-semibold">{c.count}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${(c.count / jobs.length) * 100}%` }} /></div></div>)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('Recent Applications')}</h3>
          {loading ? <p className="text-gray-400 text-sm">{t('Loading...')}</p> : applications?.length === 0 ? <p className="text-gray-400 text-sm">{t('No applications yet')}</p> :
          <div className="space-y-3">{applications?.slice(0, 8).map(a => <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><div className="text-sm font-medium text-gray-800">{a.fullName}</div><div className="text-xs text-gray-500">{a.job?.title || 'Unknown job'}</div></div><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.status === 'submitted' ? 'bg-blue-100 text-blue-700' : a.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' : a.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></div>)}</div>}
          {applications?.length > 8 && <div className="text-center mt-3"><Link to="/admin/users" className="text-sm text-blue-600 hover:underline">{t('View all')} →</Link></div>}
        </div>
      </div>
    </motion.div>
  )
}

function SummaryCard({ icon: Icon, label, value, sub, change, changeType, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-300',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300'
  }
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border-l-4" style={{ borderColor: color === 'blue' ? '#1e40af' : color === 'green' ? '#047857' : color === 'purple' ? '#7c3aed' : '#d97706' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color] || colors.blue}`}><Icon className="w-5 h-5" /></div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            <div className="text-lg font-bold text-gray-800 dark:text-white">{value}</div>
          </div>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${changeType === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-900/50 dark:text-green-300' : changeType === 'down' ? 'text-red-600 bg-red-50 dark:bg-red-900/50 dark:text-red-300' : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
            {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : changeType === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
            {change}
          </div>
        )}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-2 ml-14">{sub}</div>}
    </motion.div>
  )
}

function ChartCard({ title, icon: Icon, children, span, full }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 ${span ? 'lg:col-span-2' : ''} ${full ? '' : ''}`}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />} {title}
      </h3>
      {children}
    </motion.div>
  )
}

function PageLoader() {
  const { t } = useLanguage()
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">{t('Loading Ethiopia National Dashboard...')}</p>
      </div>
    </div>
  )
}
