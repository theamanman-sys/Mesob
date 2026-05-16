import { useState } from 'react'
import { FileText, CheckCircle, Clock, XCircle, Eye, Search, Filter } from 'lucide-react'

const initialApps = [
  { id: 'APP-001', service: 'Passport Renewal', applicant: 'Abebe Kebede', date: '2026-05-10', status: 'pending', priority: 'high' },
  { id: 'APP-002', service: 'Business License', applicant: 'Sara Tadesse', date: '2026-05-09', status: 'approved', priority: 'medium' },
  { id: 'APP-003', service: 'ID Card Replacement', applicant: 'Dawit Hailu', date: '2026-05-08', status: 'reviewing', priority: 'low' },
  { id: 'APP-004', service: 'Driving License', applicant: 'Meron Alemu', date: '2026-05-07', status: 'rejected', priority: 'medium' },
  { id: 'APP-005', service: 'Passport Renewal', applicant: 'Henok Tekle', date: '2026-05-06', status: 'pending', priority: 'high' },
]

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  reviewing: { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
}

export default function AdminApplications() {
  const [apps] = useState(initialApps)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = apps.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search && !a.applicant.toLowerCase().includes(search.toLowerCase()) && !a.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
        </div>
        <span className="text-sm text-gray-500">{filtered.length} applications</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex gap-1">
          {['all', 'pending', 'reviewing', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((app) => {
          const stat = statusConfig[app.status]
          const StatIcon = stat.icon
          return (
            <div key={app.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-full ${stat.bg}`}>
                  <StatIcon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{app.service}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{app.applicant} &middot; {app.id}</p>
                  <p className="text-xs text-gray-400">{app.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${stat.bg} ${stat.color}`}>{app.status}</span>
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No applications found</p>
          </div>
        )}
      </div>
    </div>
  )
}
