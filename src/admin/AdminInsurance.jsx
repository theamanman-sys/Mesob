import { useState } from 'react'
import { Shield, Calculator, CreditCard, Heart, Home, Car, UserCheck, CheckCircle, Users, TrendingUp } from 'lucide-react'

const plans = [
  { id: 'health', label: 'Health Insurance', icon: Heart, color: 'bg-red-500', rate: 0.035 },
  { id: 'life', label: 'Life Insurance', icon: UserCheck, color: 'bg-blue-500', rate: 0.015 },
  { id: 'auto', label: 'Auto Insurance', icon: Car, color: 'bg-green-500', rate: 0.045 },
  { id: 'property', label: 'Property Insurance', icon: Home, color: 'bg-purple-500', rate: 0.025 },
]

export default function AdminInsurance() {
  const [selectedPlan, setSelectedPlan] = useState('health')
  const [coverage, setCoverage] = useState(500000)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('calculator')

  const calculate = () => {
    const plan = plans.find((p) => p.id === selectedPlan)
    if (!plan) return
    const annual = coverage * plan.rate
    const ageFactor = 1 + (age - 18) * 0.005
    const monthly = (annual * ageFactor) / 12
    setResult({
      plan: plan.label,
      annual: Math.round(annual * ageFactor),
      monthly: Math.round(monthly),
      coverage,
      age,
    })
  }

  const format = (n) => n.toLocaleString()

  const policies = [
    { id: 1, holder: 'Abebe Kebede', plan: 'Health Insurance', premium: 4250, status: 'active', nextPayment: '2026-06-15' },
    { id: 2, holder: 'Sara Tadesse', plan: 'Life Insurance', premium: 2100, status: 'active', nextPayment: '2026-06-20' },
    { id: 3, holder: 'Dawit Hailu', plan: 'Auto Insurance', premium: 3800, status: 'overdue', nextPayment: '2026-05-01' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insurance Management</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {['calculator', 'policies', 'analytics'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            {tab === 'calculator' ? <Calculator className="w-4 h-4 inline mr-1" /> : tab === 'policies' ? <Users className="w-4 h-4 inline mr-1" /> : <TrendingUp className="w-4 h-4 inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Select Plan</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {plans.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${selectedPlan === p.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                  <div className={`p-2.5 rounded-full ${p.color} text-white`}><p.icon className="w-5 h-5" /></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.label}</span>
                  <span className="text-xs text-gray-400">{(p.rate * 100).toFixed(1)}% rate</span>
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coverage: <span className="font-bold text-blue-600">{format(coverage)} ETB</span></label>
                <input type="range" min="50000" max="5000000" step="50000" value={coverage} onChange={(e) => setCoverage(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age: <span className="font-bold text-blue-600">{age}</span></label>
                <input type="range" min="18" max="70" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full" />
              </div>
              <button onClick={calculate} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5" /> Calculate Premium
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {result ? <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /> Premium Result</span> : 'Premium Result'}
            </h2>
            {result ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                  <p className="text-sm text-gray-500">{result.plan} &middot; {format(result.coverage)} ETB</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{format(result.monthly)} ETB <span className="text-sm font-normal">/mo</span></p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Annual</p>
                  <p className="text-2xl font-bold text-green-600">{format(result.annual)} ETB</p>
                </div>
                <button className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" /> Process Payment
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calculator className="w-12 h-12 mb-3 opacity-50" />
                <p>Calculate a premium to see results</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Holder</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Plan</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Premium</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Next Payment</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  <td className="py-3 px-4 font-medium">{p.holder}</td>
                  <td className="py-3 px-4">{p.plan}</td>
                  <td className="py-3 px-4 text-right font-semibold">{format(p.premium)} ETB</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{p.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{p.nextPayment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Policies</p>
            <p className="text-2xl font-bold text-blue-600">142</p>
            <p className="text-xs text-green-500 mt-1">+12% this month</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Premiums</p>
            <p className="text-2xl font-bold text-green-600">487,000 ETB</p>
            <p className="text-xs text-green-500 mt-1">Monthly</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Claims Pending</p>
            <p className="text-2xl font-bold text-yellow-600">8</p>
            <p className="text-xs text-red-500 mt-1">3 overdue</p>
          </div>
        </div>
      )}
    </div>
  )
}
