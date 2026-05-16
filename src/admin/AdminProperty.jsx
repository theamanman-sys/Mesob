import { useState } from 'react'
import { Building2, Home, Plus, TrendingUp, DollarSign, FileText, MapPin, Users, Calendar } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'properties', label: 'All Properties', icon: Home },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'financial', label: 'Financial', icon: DollarSign },
]

const sampleProperties = [
  { id: 1, name: 'Bole Residence', type: 'Residential', value: 3500000, location: 'Bole, Addis Ababa', size: '250 sqm', status: 'owned', tenant: 'Meron Alemu', rent: 15000 },
  { id: 2, name: 'Kazanchis Office', type: 'Commercial', value: 5200000, location: 'Kazanchis, Addis Ababa', size: '180 sqm', status: 'mortgage', tenant: 'Tech Solutions PLC', rent: 35000 },
  { id: 3, name: 'Piassa Apartment', type: 'Residential', value: 1800000, location: 'Piassa, Addis Ababa', size: '120 sqm', status: 'rental', tenant: 'Henok Tekle', rent: 8500 },
  { id: 4, name: 'CMC Villa', type: 'Residential', value: 4200000, location: 'CMC, Addis Ababa', size: '300 sqm', status: 'rental', tenant: 'Vacant', rent: 0 },
]

export default function AdminProperty() {
  const [activeTab, setActiveTab] = useState('overview')
  const totalValue = sampleProperties.reduce((s, p) => s + p.value, 0)
  const monthlyRent = sampleProperties.reduce((s, p) => s + p.rent, 0)
  const format = (n) => n.toLocaleString()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Property Management</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Properties</p>
          <p className="text-2xl font-bold text-blue-600">{sampleProperties.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-green-600">{format(totalValue)} ETB</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Rent</p>
          <p className="text-2xl font-bold text-purple-600">{format(monthlyRent)} ETB</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Occupancy</p>
          <p className="text-2xl font-bold text-yellow-600">75%</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Status Distribution</h3>
            {['owned', 'mortgage', 'rental'].map((status) => {
              const count = sampleProperties.filter((p) => p.status === status).length
              const pct = (count / sampleProperties.length) * 100
              return (
                <div key={status} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700 dark:text-gray-300">{status}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full ${status === 'owned' ? 'bg-green-500' : status === 'mortgage' ? 'bg-blue-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Portfolio Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">Total Equity</span>
                <span className="font-bold text-green-600">{format(Math.round(totalValue * 0.65))} ETB</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">Mortgage Balance</span>
                <span className="font-bold text-blue-600">{format(Math.round(totalValue * 0.35))} ETB</span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">Annual Rental Income</span>
                <span className="font-bold text-purple-600">{format(monthlyRent * 12)} ETB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="space-y-4">
          {sampleProperties.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Home className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.location}</span>
                      <span>{p.size}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{p.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${p.status === 'owned' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : p.status === 'mortgage' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>{p.status}</span>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{format(p.value)} ETB</p>
              </div>
            </div>
          ))}
          <button className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 font-medium hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add Property
          </button>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Tenant</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Property</th>
                <th className="text-right py-3 px-4 text-gray-500 dark:text-gray-400">Rent</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleProperties.filter((p) => p.tenant !== 'Vacant').map((p) => (
                <tr key={p.id} className="border-b dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  <td className="py-3 px-4 font-medium">{p.tenant}</td>
                  <td className="py-3 px-4">{p.name}</td>
                  <td className="py-3 px-4 text-right font-semibold">{format(p.rent)} ETB</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Financial Overview</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
              <p className="text-xl font-bold text-green-600">{format(monthlyRent)} ETB</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Annual Income</p>
              <p className="text-xl font-bold text-blue-600">{format(monthlyRent * 12)} ETB</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">ROI</p>
              <p className="text-xl font-bold text-purple-600">{((monthlyRent * 12 / totalValue) * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Recent Transactions</h3>
            {['Rent collected - Bole Residence (May)', 'Rent collected - Kazanchis Office (May)', 'Property tax payment', 'Maintenance - Piassa Apartment'].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-800 dark:text-gray-200">{t}</span>
                <span className="text-xs text-gray-400"><Calendar className="w-3 h-3 inline mr-1" />May 2026</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
