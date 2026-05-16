import { useState } from 'react'
import { Building2, Calculator, TrendingUp, PieChart, Plus, Landmark, Users } from 'lucide-react'

export default function AdminBank() {
  const [assets, setAssets] = useState([
    { id: 1, name: 'Cash & Bank', value: 4500000, type: 'Liquid' },
    { id: 2, name: 'Real Estate', value: 12500000, type: 'Fixed' },
    { id: 3, name: 'Investments', value: 3200000, type: 'Investment' },
    { id: 4, name: 'Vehicles', value: 1800000, type: 'Asset' },
    { id: 5, name: 'Equipment', value: 950000, type: 'Fixed' },
  ])
  const [liabilities, setLiabilities] = useState([
    { id: 1, name: 'Business Loan', value: 3200000, type: 'Long-term' },
    { id: 2, name: 'Mortgage', value: 1800000, type: 'Long-term' },
    { id: 3, name: 'Credit Line', value: 450000, type: 'Short-term' },
  ])

  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0)
  const netWorth = totalAssets - totalLiabilities
  const debtRatio = totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0
  const format = (n) => n.toLocaleString()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bank & Financial Status</h1>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Assets</p>
          <p className="text-2xl font-bold text-green-600">{format(totalAssets)} ETB</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-600">{format(totalLiabilities)} ETB</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net Worth</p>
          <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{format(netWorth)} ETB</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Debt Ratio</p>
          <p className={`text-2xl font-bold ${Number(debtRatio) < 40 ? 'text-green-600' : 'text-yellow-600'}`}>{debtRatio}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" /> Assets
            </h2>
            <button className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {assets.map((a) => {
              const pct = ((a.value / totalAssets) * 100).toFixed(1)
              return (
                <div key={a.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.name}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">{a.type}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">{format(a.value)} ETB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-red-500" /> Liabilities
            </h2>
            <button className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            {liabilities.map((l) => {
              const pct = ((l.value / totalLiabilities) * 100).toFixed(1)
              return (
                <div key={l.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{l.name}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">{l.type}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600">{format(l.value)} ETB</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
