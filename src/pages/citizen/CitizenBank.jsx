import { useState } from 'react'
import { Building2, Calculator, TrendingUp, PieChart, Plus, Landmark } from 'lucide-react'

export default function CitizenBank() {
  const [income, setIncome] = useState(25000)
  const [expenses, setExpenses] = useState(15000)
  const [assets, setAssets] = useState([
    { id: 1, name: 'Savings Account', value: 150000, type: 'Cash' },
    { id: 2, name: 'Family Home', value: 2500000, type: 'Real Estate' },
    { id: 3, name: 'Car', value: 600000, type: 'Vehicle' },
    { id: 4, name: 'Investment', value: 300000, type: 'Investment' },
  ])
  const [liabilities, setLiabilities] = useState([
    { id: 1, name: 'Mortgage', value: 800000, type: 'Loan' },
    { id: 2, name: 'Car Loan', value: 200000, type: 'Loan' },
  ])
  const [savingsGoal, setSavingsGoal] = useState(500000)
  const [monthlySave, setMonthlySave] = useState(5000)

  const totalAssets = assets.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0)
  const netWorth = totalAssets - totalLiabilities
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0
  const monthsToGoal = monthlySave > 0 ? Math.ceil(savingsGoal / monthlySave) : 0

  const format = (n) => n.toLocaleString()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Bank & Finance</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Assets</p>
          <p className="text-2xl font-bold text-green-600">{format(totalAssets)} ETB</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-600">{format(totalLiabilities)} ETB</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Net Worth</p>
          <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{format(netWorth)} ETB</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-500" /> Financial Overview
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (ETB)</label>
                <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expenses (ETB)</label>
                <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly surplus</span>
                  <span className="font-semibold text-green-600">{format(income - expenses)} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Savings rate</span>
                  <span className="font-semibold text-blue-600">{savingsRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-500" /> Savings Goal
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (ETB)</label>
                <input type="number" value={savingsGoal} onChange={(e) => setSavingsGoal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Savings (ETB)</label>
                <input type="number" value={monthlySave} onChange={(e) => setMonthlySave(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  {monthsToGoal > 0
                    ? `You'll reach your goal in <strong>${monthsToGoal} months</strong> (${Math.ceil(monthsToGoal / 12)} years)`
                    : 'Set a monthly savings amount'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" /> Assets
              </h2>
              <button className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">{a.type}</span>
                  </div>
                  <p className="font-semibold text-green-600">{format(a.value)} ETB</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-500" /> Liabilities
              </h2>
              <button className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {liabilities.map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{l.name}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">{l.type}</span>
                  </div>
                  <p className="font-semibold text-red-600">{format(l.value)} ETB</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
