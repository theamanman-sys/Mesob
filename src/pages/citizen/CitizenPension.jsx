import { useState } from 'react'
import { Calculator, TrendingUp, PiggyBank, Download } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function CitizenPension() {
  const { t } = useLanguage()
  const [age, setAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(65)
  const [salary, setSalary] = useState(15000)
  const [contribution, setContribution] = useState(7)
  const [savings, setSavings] = useState(0)
  const [result, setResult] = useState(null)

  const calculate = () => {
    const years = retirementAge - age
    const monthlyContribution = (salary * contribution) / 100
    const annualReturn = 0.08
    let total = savings
    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) {
        total += monthlyContribution
        total *= (1 + annualReturn / 12)
      }
    }
    const monthlyPayout = total * 0.04 / 12
    setResult({ total: Math.round(total), monthly: Math.round(monthlyPayout), years, monthlyContribution: Math.round(monthlyContribution) })
  }

  const format = (n) => n.toLocaleString()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <PiggyBank className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('Pension Calculator')}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-500" /> {t('Your Details')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Current Age')}: <span className="font-bold text-blue-600">{age}</span></label>
              <input type="range" min="18" max="70" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Retirement Age')}: <span className="font-bold text-blue-600">{retirementAge}</span></label>
              <input type="range" min="40" max="80" value={retirementAge} onChange={(e) => setRetirementAge(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Monthly Salary (ETB)')}</label>
              <input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Contribution Rate')}: <span className="font-bold text-blue-600">{contribution}%</span></label>
              <input type="range" min="1" max="20" value={contribution} onChange={(e) => setContribution(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Current Savings (ETB)')}</label>
              <input type="number" value={savings} onChange={(e) => setSavings(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
            </div>
            <button onClick={calculate}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <Calculator className="w-5 h-5" /> {t('Calculate Pension')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> {t('Projection')}
          </h2>
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">{t('Total Savings')}</p>
                  <p className="text-2xl font-bold text-blue-600">{format(result.total)} ETB</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">{t('Monthly Payout')}</p>
                  <p className="text-2xl font-bold text-green-600">{format(result.monthly)} ETB</p>
                </div>
              </div>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('Years until retirement')}</span>
                  <span className="font-semibold text-gray-800">{result.years} {t('years')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('Monthly contribution')}</span>
                  <span className="font-semibold text-gray-800">{format(result.monthlyContribution)} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('Annual return rate')}</span>
                  <span className="font-semibold text-green-600">8%</span>
                </div>
              </div>
              <button className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> {t('Download Report')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Calculator className="w-12 h-12 mb-3 opacity-50" />
              <p>{t('Fill in your details and calculate')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
