import { useState } from 'react'
import { Building2, Home, Plus, TrendingUp, DollarSign, FileText, MapPin, Calendar } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'properties', label: 'Properties', icon: Home },
  { id: 'rental', label: 'Rental Income', icon: DollarSign },
  { id: 'documents', label: 'Documents', icon: FileText },
]

const sampleProperties = [
  { id: 1, name: 'Bole Residence', type: 'Residential', value: 3500000, location: 'Bole, Addis Ababa', size: '250 sqm', status: 'owned' },
  { id: 2, name: 'Kazanchis Office', type: 'Commercial', value: 5200000, location: 'Kazanchis, Addis Ababa', size: '180 sqm', status: 'mortgage' },
  { id: 3, name: 'Piassa Apartment', type: 'Residential', value: 1800000, location: 'Piassa, Addis Ababa', size: '120 sqm', status: 'rental' },
]

export default function CitizenProperty() {
  const [activeTab, setActiveTab] = useState('overview')
  const totalValue = sampleProperties.reduce((s, p) => s + p.value, 0)
  const format = (n) => n.toLocaleString()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Property Management</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Properties</p>
          <p className="text-2xl font-bold text-blue-600">{sampleProperties.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-green-600">{format(totalValue)} ETB</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Rental Properties</p>
          <p className="text-2xl font-bold text-purple-600">{sampleProperties.filter((p) => p.status === 'rental').length}</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Property Distribution</h3>
              <div className="space-y-3">
                {['owned', 'mortgage', 'rental'].map((status) => {
                  const count = sampleProperties.filter((p) => p.status === status).length
                  const pct = (count / sampleProperties.length) * 100
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${status === 'owned' ? 'bg-green-500' : status === 'mortgage' ? 'bg-blue-500' : 'bg-purple-500'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Value Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Total Equity</span>
                  <span className="font-bold text-green-600">{format(totalValue * 0.65)} ETB</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Estimated Mortgage</span>
                  <span className="font-bold text-blue-600">{format(totalValue * 0.35)} ETB</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Monthly Rental Income</span>
                  <span className="font-bold text-purple-600">18,500 ETB</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Market Trends</h3>
            <p className="text-sm text-gray-500">Property values in Addis Ababa have increased by 12% over the past year. Your portfolio has appreciated by approximately <strong className="text-green-600">{format(Math.round(totalValue * 0.12))} ETB</strong>.</p>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="space-y-4">
          {sampleProperties.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100"><Home className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.location}</span>
                      <span>{p.size}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{p.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === 'owned' ? 'bg-green-100 text-green-700' : p.status === 'mortgage' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>{p.status}</span>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900">{format(p.value)} ETB</p>
              </div>
            </div>
          ))}
          <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add Property
          </button>
        </div>
      )}

      {activeTab === 'rental' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Rental Income Tracker</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Monthly Income</p>
              <p className="text-xl font-bold text-green-600">18,500 ETB</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Annual Income</p>
              <p className="text-xl font-bold text-blue-600">222,000 ETB</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Occupancy Rate</p>
              <p className="text-xl font-bold text-purple-600">95%</p>
            </div>
          </div>
          <p className="text-center text-gray-400 py-8">Detailed rental ledger coming soon</p>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Property Documents</h2>
          <div className="space-y-3">
            {['Title Deed - Bole Residence', 'Rental Agreement - Piassa', 'Mortgage Document - Kazanchis', 'Tax Assessment 2025/26'].map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-800">{doc}</span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Added 2026</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
