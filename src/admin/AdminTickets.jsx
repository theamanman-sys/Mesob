import { useState, useEffect } from 'react'
import { Ticket, TrendingUp, Building2, DollarSign, PieChart, Clock, Search, Calendar, Download } from 'lucide-react'
import { citizenService } from '../services/citizenService'

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    citizenService.getTickets().then(setTickets).catch(() => {})
    citizenService.getTicketStats().then(setStats).catch(() => {})
  }, [])

  const filtered = tickets.filter(t =>
    !search || t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.citizenName?.toLowerCase().includes(search.toLowerCase()) ||
    t.serviceTitle?.toLowerCase().includes(search.toLowerCase())
  )

  const pieData = stats?.topServices || []
  const totalPie = pieData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Ticket className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets & Revenue</h1>
        </div>
        <span className="text-sm text-gray-500">{tickets.length} total tickets</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Ticket, label: 'Total Tickets', value: stats?.totalTickets ?? tickets.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Building2, label: 'Departments', value: stats?.totalDepartments ?? '-', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: DollarSign, label: 'Total Revenue', value: stats ? `${(stats.totalRevenue || 0).toLocaleString()} ETB` : '-', color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { icon: TrendingUp, label: 'Avg per Ticket', value: stats?.totalTickets ? `${Math.round((stats.totalRevenue || 0) / stats.totalTickets).toLocaleString()} ETB` : '-', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${s.bg} dark:bg-opacity-20 rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" /> Most Requested Services
          </h2>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No ticket data yet</p>
          ) : (
            <div className="space-y-3">
              {pieData.map((item, i) => {
                const pct = totalPie ? ((item.count / totalPie) * 100).toFixed(1) : 0
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-red-500', 'bg-gray-500']
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]} shrink-0`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-600" /> Revenue by Service
          </h2>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No revenue data yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.topServices?.slice(0, 5).map((item, i) => {
                const revenue = Math.round((stats.totalRevenue || 0) * (item.count / totalPie))
                const colors = ['text-blue-600', 'text-green-600', 'text-yellow-600', 'text-purple-600', 'text-pink-600']
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <span className={`text-sm font-medium ${colors[i]} truncate max-w-[140px]`}>{item.name}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{revenue.toLocaleString()} ETB</span>
                  </div>
                )
              })}
            </div>
          )}
          {stats?.totalRevenue ? (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
              <span className="text-sm font-bold text-gray-900 dark:text-white">Total</span>
              <span className="text-sm font-bold text-yellow-600">{stats.totalRevenue.toLocaleString()} ETB</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} tickets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Ticket</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Citizen</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Service</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Appointment</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Fee</th>
                <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="p-3 font-medium text-blue-600 dark:text-blue-400">{t.ticketNumber}</td>
                  <td className="p-3 text-gray-900 dark:text-white">{t.citizenName}</td>
                  <td className="p-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{t.serviceTitle}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t.appointmentDate ? new Date(t.appointmentDate).toLocaleDateString() : '-'}</span>
                      <Clock className="w-3.5 h-3.5 ml-1" />
                      <span>{t.appointmentTime || '-'}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-white">{t.fee?.toLocaleString()} ETB</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="text-center py-12 text-gray-400">No tickets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}