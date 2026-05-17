import { useState } from 'react'
import { FileSignature, Users, Heart, Plus, Trash2, Gavel } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const tabs = [
  { id: 'will', label: 'Will & Testament', icon: FileSignature },
  { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
  { id: 'inheritance', label: 'Inheritance Plan', icon: Heart },
  { id: 'legal', label: 'Legal Info', icon: Gavel },
]

export default function CitizenInheritance() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('will')
  const [beneficiaries, setBeneficiaries] = useState([
    { id: 1, name: 'Sara Tadesse', relation: 'Spouse', share: 50, type: 'primary' },
    { id: 2, name: 'Meron Abebe', relation: 'Child', share: 25, type: 'primary' },
    { id: 3, name: 'Dawit Abebe', relation: 'Child', share: 25, type: 'primary' },
  ])
  const [assets, setAssets] = useState([
    { id: 1, name: 'Family Home', value: 2500000, type: 'Real Estate' },
    { id: 2, name: 'Bank Savings', value: 800000, type: 'Financial' },
  ])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileSignature className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('Inheritance & Will')}</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            <tab.icon className="w-4 h-4" /> {t(tab.label)}
          </button>
        ))}
      </div>

      {activeTab === 'will' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('Create Your Will')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Your Full Name')}</label>
              <input type="text" placeholder={t('Enter full legal name')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Date of Birth')}</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('National ID')}</label>
                <input type="text" placeholder={t('ID number')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Executor Name')}</label>
              <input type="text" placeholder={t('Person who will execute the will')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Special Instructions')}</label>
              <textarea rows={4} placeholder={t('Enter any special instructions or bequests...')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-900" />
            </div>
            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
              <FileSignature className="w-4 h-4" /> {t('Save Will Draft')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'beneficiaries' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('Your Beneficiaries')}</h2>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
              <Plus className="w-4 h-4" /> {t('Add')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-3 px-2 whitespace-nowrap">{t('Name')}</th>
                  <th className="text-left py-3 px-2 whitespace-nowrap">{t('Relation')}</th>
                  <th className="text-left py-3 px-2 whitespace-nowrap">{t('Type')}</th>
                  <th className="text-right py-3 px-2 whitespace-nowrap">{t('Share')}</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="border-b text-gray-800">
                    <td className="py-3 px-2 font-medium whitespace-nowrap">{b.name}</td>
                    <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{b.relation}</td>
                    <td className="py-3 px-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 capitalize">{b.type}</span></td>
                    <td className="py-3 px-2 text-right font-semibold whitespace-nowrap">{b.share}%</td>
                    <td className="py-3 px-2 text-right"><button className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inheritance' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('Your Assets & Distribution')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-3 px-2 whitespace-nowrap">{t('Asset')}</th>
                  <th className="text-left py-3 px-2 whitespace-nowrap">{t('Type')}</th>
                  <th className="text-right py-3 px-2 whitespace-nowrap">{t('Value (ETB)')}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b text-gray-800">
                    <td className="py-3 px-2 font-medium whitespace-nowrap">{a.name}</td>
                    <td className="py-3 px-2 whitespace-nowrap"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{a.type}</span></td>
                    <td className="py-3 px-2 text-right font-semibold whitespace-nowrap">{a.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-800">{t('Distribution')}</h3>
            {beneficiaries.map((b) => {
              const shareValue = assets.reduce((s, a) => s + a.value, 0) * (b.share / 100)
              return (
                <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <p className="text-gray-800">{b.name} <span className="text-gray-400 text-xs">({b.share}%)</span></p>
                  <p className="font-semibold text-green-600">{shareValue.toLocaleString()} ETB</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'legal' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-blue-500" /> {t('Ethiopian Inheritance Law Guide')}
          </h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p><strong className="text-gray-800">{t('Intestate Succession:')}</strong> {t('If no will exists, the Civil Code of Ethiopia governs distribution. Spouse and children inherit first.')}</p>
            <p><strong className="text-gray-800">{t('Forced Heirship:')}</strong> {t('Under Ethiopian law, certain heirs (spouse, children) cannot be disinherited entirely.')}</p>
            <p><strong className="text-gray-800">{t('Will Requirements:')}</strong> {t('A valid will must be in writing, signed by the testator, and witnessed by at least two competent witnesses.')}</p>
            <p><strong className="text-gray-800">{t('Estate Tax:')}</strong> {t('Ethiopia currently does not impose inheritance or estate tax.')}</p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-xs">{t('This is general guidance — consult a qualified legal professional.')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
