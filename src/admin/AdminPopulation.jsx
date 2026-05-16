import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Smartphone, Signal, Wifi, Globe, BarChart3, TrendingUp, AlertTriangle, Zap, Network, MapPin } from 'lucide-react'
import { citizenService } from '../services/citizenService'

const COLORS = ['#1e40af','#047857','#b45309','#7c3aed','#be123c','#6366f1','#0891b2','#d97706','#059669','#dc2626','#db2777','#4f46e5','#0d9488','#ca8a04']

function SimpleBar({ data, height = 200 }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500">{d.value}%</span>
          <div className="w-full rounded-t" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length], minHeight: 4 }} />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.name}</span>
        </div>
      ))}
    </div>
  )
}

function formatNum(n) { if (!n) return '0'; if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`; return n.toLocaleString() }

export default function AdminPopulation() {
  const [population, setPopulation] = useState(null)
  const [telecom, setTelecom] = useState(null)
  const [digital, setDigital] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      citizenService.getPopulationData(),
      citizenService.getTelecomReach(),
      citizenService.getDigitalCapability()
    ]).then(([p, t, d]) => {
      setPopulation(p || {})
      setTelecom(t || {})
      setDigital(d || {})
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const tabs = [
    { id: 'overview', label: 'Population Overview', icon: Users },
    { id: 'telecom', label: 'Telecom Reach', icon: Signal },
    { id: 'digital', label: 'Digital Capability', icon: Zap },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Population & Digital Reach</h1>
          <p className="text-gray-500 dark:text-gray-400">Census {population?.lastCensus || '2022'} • Est. {population?.estimatedYear || 2026}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SCard icon={Users} label="Total Population" value={formatNum(population?.total)} sub={`${population?.growthRate || 0}% growth rate`} color="blue" />
        <SCard icon={Smartphone} label="Mobile Subscribers" value={formatNum(telecom?.mobileSubscriptions)} sub={`${telecom?.overallCoverage || 0}% coverage`} color="green" />
        <SCard icon={Wifi} label="Internet Users" value={formatNum(telecom?.internetUsers)} sub={`${telecom?.internetPenetration || 0}% penetration`} color="purple" />
        <SCard icon={Zap} label="Digitally Capable" value={formatNum(digital?.estimatedDigitalCapable)} sub={`${digital?.percentageOfTotal || 0}% of population`} color="amber" />
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Population by Region</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-2">Region</th>
                    <th className="text-right py-2">Population</th>
                    <th className="text-right py-2">Urban %</th>
                    <th className="text-right py-2">Rural %</th>
                    <th className="text-right py-2">Literacy</th>
                    <th className="text-right py-2">Area (km²)</th>
                  </tr>
                </thead>
                <tbody>
                  {population?.regions?.map((r, i) => (
                    <tr key={r.name} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-2 font-medium">{r.name}</td>
                      <td className="py-2 text-right">{formatNum(r.population)}</td>
                      <td className="py-2 text-right">{r.urban}%</td>
                      <td className="py-2 text-right">{r.rural}%</td>
                      <td className="py-2 text-right">{r.literacyRate}%</td>
                      <td className="py-2 text-right">{r.area?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Age Distribution</h2>
            <div className="space-y-4">
              {population?.ageGroups?.map((g, i) => (
                <div key={g.group}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Age {g.group}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{g.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${g.percentage}%`, backgroundColor: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Urban</span><p className="font-semibold">{population?.urbanRural?.urban}%</p></div>
              <div><span className="text-gray-500">Rural</span><p className="font-semibold">{population?.urbanRural?.rural}%</p></div>
              <div><span className="text-gray-500">Male</span><p className="font-semibold">{population?.gender?.male}%</p></div>
              <div><span className="text-gray-500">Female</span><p className="font-semibold">{population?.gender?.female}%</p></div>
            </div>
          </motion.div>
        </div>
      )}

      {tab === 'telecom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Telecom Coverage by Region</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-2">Region</th>
                    <th className="text-right py-2">Population</th>
                    <th className="text-right py-2">Mobile %</th>
                    <th className="text-right py-2">Internet %</th>
                    <th className="text-right py-2">Smartphone %</th>
                    <th className="text-right py-2">4G %</th>
                    <th className="text-right py-2">Active Users</th>
                  </tr>
                </thead>
                <tbody>
                  {telecom?.byRegion?.map(r => (
                    <tr key={r.name} className="border-b dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-2 font-medium">{r.name}</td>
                      <td className="py-2 text-right">{formatNum(r.population)}</td>
                      <td className="py-2 text-right">{r.mobileCoverage}%</td>
                      <td className="py-2 text-right">{r.internetPenetration}%</td>
                      <td className="py-2 text-right">{r.smartphoneAdoption}%</td>
                      <td className="py-2 text-right">{r['4gAvailability']}%</td>
                      <td className="py-2 text-right">{formatNum(r.activeUsers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Operator Market Share</h2>
              {telecom?.operators?.map((op, i) => (
                <div key={op.name} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{op.name}</span>
                    <span className="text-gray-500">{op.marketShare}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${op.marketShare}%`, backgroundColor: i === 0 ? '#7c3aed' : '#16a34a' }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatNum(op.subscribers)} subscribers</div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Coverage Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">2G Coverage</span><span className="font-semibold">{telecom?.['2gCoverage'] || 0}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">3G Coverage</span><span className="font-semibold">{telecom?.['3gCoverage'] || 0}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">4G Coverage</span><span className="font-semibold">{telecom?.['4gCoverage'] || 0}%</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Smartphone Users</span><span className="font-semibold">{formatNum(telecom?.smartphoneUsers)}</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {tab === 'digital' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Digital Capability Breakdown</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {digital?.breakdown && Object.entries(digital.breakdown).map(([key, val]) => (
                <div key={key} className={`p-4 rounded-xl text-center ${key === 'fullyDigital' ? 'bg-green-50 dark:bg-green-900' : key === 'partiallyDigital' ? 'bg-yellow-50 dark:bg-yellow-900' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{formatNum(val.count)}</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{val.percentage}%</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              ))}
            </div>
            <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Barriers to Digital Adoption</h3>
            {digital?.barriers && Object.entries(digital.barriers).map(([key, val]) => (
              <div key={key} className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^lackOf/, 'Lack of ')}</span>
                  <span className="font-semibold">{val}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Digital Capability Projection</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Estimated % of population capable of using digital government services</p>
            <div className="space-y-4">
              {digital?.projection && Object.entries(digital.projection).map(([year, pct]) => (
                <div key={year}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{year}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full transition-all bg-gradient-to-r from-blue-500 to-purple-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Digital Divide Insight</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Only {digital?.percentageOfTotal || 0}% of Ethiopians are currently capable of fully utilizing digital government services. Key barriers: lack of internet access ({digital?.barriers?.lackOfInternet || 0}%) and device affordability ({digital?.barriers?.lackOfDevice || 0}%).</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function SCard({ icon: Icon, label, value, sub, color }) {
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

function PageLoader() { return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div> }
