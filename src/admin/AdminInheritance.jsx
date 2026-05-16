import { useState } from 'react'
import { FileSignature, Users, Heart, Shield, Plus, Trash2, Gavel } from 'lucide-react'

const tabs = [
  { id: 'will', label: 'Will & Testament', icon: FileSignature },
  { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
  { id: 'inheritance', label: 'Inheritance Plan', icon: Heart },
  { id: 'legal', label: 'Legal Info', icon: Gavel },
]

export default function AdminInheritance() {
  const [activeTab, setActiveTab] = useState('will')
  const [beneficiaries, setBeneficiaries] = useState([
    { id: 1, name: 'Sara Tadesse', relation: 'Spouse', share: 50, type: 'primary' },
    { id: 2, name: 'Meron Abebe', relation: 'Child', share: 25, type: 'primary' },
    { id: 3, name: 'Dawit Abebe', relation: 'Child', share: 25, type: 'primary' },
  ])
  const [assets, setAssets] = useState([
    { id: 1, name: 'Family Home', value: 2500000, type: 'Real Estate' },
    { id: 2, name: 'Bank Savings', value: 800000, type: 'Financial' },
    { id: 3, name: 'Vehicle', value: 600000, type: 'Vehicle' },
  ])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileSignature className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inheritance & Will</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'will' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Create Your Will</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Testator Full Name</label>
              <input type="text" placeholder="Enter full legal name"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">National ID / Passport</label>
                <input type="text" placeholder="ID number"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Executor Name</label>
              <input type="text" placeholder="Person who will execute the will"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Instructions</label>
              <textarea rows={4} placeholder="Enter any special instructions, bequests, or notes..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
              <Shield className="w-4 h-4" /> Save Will Draft
            </button>
          </div>
        </div>
      )}

      {activeTab === 'beneficiaries' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Beneficiaries</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Relation</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-right py-3 px-2">Share (%)</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    <td className="py-3 px-2 font-medium">{b.name}</td>
                    <td className="py-3 px-2 text-gray-500">{b.relation}</td>
                    <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 capitalize">{b.type}</span></td>
                    <td className="py-3 px-2 text-right font-semibold">{b.share}%</td>
                    <td className="py-3 px-2 text-right">
                      <button className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold text-gray-900 dark:text-white">
                  <td colSpan={3} className="py-3 px-2">Total</td>
                  <td className="py-3 px-2 text-right">{beneficiaries.reduce((s, b) => s + b.share, 0)}%</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inheritance' && (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Asset Registry</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-3 px-2">Asset</th>
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-right py-3 px-2">Value (ETB)</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                      <td className="py-3 px-2 font-medium">{a.name}</td>
                      <td className="py-3 px-2"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{a.type}</span></td>
                      <td className="py-3 px-2 text-right font-semibold">{a.value.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-gray-900 dark:text-white">
                    <td className="py-3 px-2">Total Estate</td>
                    <td></td>
                    <td className="py-3 px-2 text-right">{assets.reduce((s, a) => s + a.value, 0).toLocaleString()} ETB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Distribution Plan</h2>
            {beneficiaries.map((b) => {
              const shareValue = assets.reduce((s, a) => s + a.value, 0) * (b.share / 100)
              return (
                <div key={b.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.relation} &middot; {b.share}% share</p>
                  </div>
                  <p className="font-semibold text-green-600">{shareValue.toLocaleString()} ETB</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'legal' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-blue-500" /> Ethiopian Inheritance Law Guide
          </h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p><strong className="text-gray-800 dark:text-gray-200">Intestate Succession:</strong> If no will exists, the Civil Code of Ethiopia governs distribution. Spouse and children inherit first.</p>
            <p><strong className="text-gray-800 dark:text-gray-200">Forced Heirship:</strong> Under Ethiopian law, certain heirs (spouse, children) cannot be disinherited entirely — they are entitled to a reserved portion (typically 1/2 to 2/3 of the estate).</p>
            <p><strong className="text-gray-800 dark:text-gray-200">Will Requirements:</strong> A valid will must be in writing, signed by the testator, and witnessed by at least two competent witnesses who are not beneficiaries.</p>
            <p><strong className="text-gray-800 dark:text-gray-200">Estate Tax:</strong> Ethiopia currently does not impose inheritance or estate tax, but transfer of property may incur registration fees (1-2% of property value).</p>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-amber-800 dark:text-amber-200 text-xs">This information is for general guidance. Consult a qualified legal professional for advice specific to your situation.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
