import { useState } from 'react'
import { Shield, Calculator, CreditCard, Heart, Home, Car, UserCheck, CheckCircle } from 'lucide-react'

const plans = [
  { id: 'health', label: 'Health Insurance', icon: Heart, color: 'bg-red-500', rate: 0.035 },
  { id: 'life', label: 'Life Insurance', icon: UserCheck, color: 'bg-blue-500', rate: 0.015 },
  { id: 'auto', label: 'Auto Insurance', icon: Car, color: 'bg-green-500', rate: 0.045 },
  { id: 'property', label: 'Property Insurance', icon: Home, color: 'bg-purple-500', rate: 0.025 },
]

export default function CitizenInsurance() {
  const [selectedPlan, setSelectedPlan] = useState('health')
  const [coverage, setCoverage] = useState(500000)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState(null)

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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Insurance</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Plan</h2>
            <div className="grid grid-cols-2 gap-3">
              {plans.map((p) => (
                <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${selectedPlan === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`p-2.5 rounded-full ${p.color} text-white`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{p.label}</span>
                  <span className="text-xs text-gray-400">{(p.rate * 100).toFixed(1)}% rate</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" /> Coverage Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Amount: <span className="font-bold text-blue-600">{format(coverage)} ETB</span></label>
                <input type="range" min="50000" max="5000000" step="50000" value={coverage} onChange={(e) => setCoverage(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Age: <span className="font-bold text-blue-600">{age}</span></label>
                <input type="range" min="18" max="70" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full" />
              </div>
              <button onClick={calculate}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5" /> Calculate Premium
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {result && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> Your Premium
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">{result.plan} &middot; {format(result.coverage)} ETB coverage</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{format(result.monthly)} ETB</p>
                  <p className="text-xs text-gray-400">per month</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Annual Premium</p>
                  <p className="text-2xl font-bold text-green-600">{format(result.annual)} ETB</p>
                </div>
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Coverage</span><span className="font-semibold">{format(result.coverage)} ETB</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Age factor</span><span className="font-semibold">{(1 + (result.age - 18) * 0.005).toFixed(2)}x</span></div>
                </div>
                <button className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" /> Pay Premium Now
                </button>
                <p className="text-xs text-gray-400 text-center">Secure payment via trusted gateway</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">My Policies</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100"><Shield className="w-4 h-4 text-blue-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">No active policies</p>
                    <p className="text-xs text-gray-400">Purchase your first policy above</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
