import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Building2, FileText, Users, MessageSquare, Globe, Image } from 'lucide-react'

export default function AdminDashboard() {
  const { user } = useAuth()

  const stats = [
    { label: 'Organizations', icon: Building2, color: 'bg-blue-500', count: '—' },
    { label: 'Services', icon: FileText, color: 'bg-green-500', count: '—' },
    { label: 'Languages', icon: Globe, color: 'bg-purple-500', count: '—' },
    { label: 'Messages', icon: MessageSquare, color: 'bg-yellow-500', count: '—' },
    { label: 'Users', icon: Users, color: 'bg-red-500', count: '—' },
    { label: 'Banners', icon: Image, color: 'bg-indigo-500', count: '—' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back, {user?.username || 'Admin'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className={`${s.color} p-3 rounded-lg`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
