import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminSidebar from '../components/AdminSidebar'
import { Menu, LogOut } from 'lucide-react'

export default function AdminLayout() {
  const { user, logout, isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated()) navigate('/login', { replace: true })
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-x-hidden">
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userRole={user?.role} />

      <div className="flex-1 lg:pl-64 w-full">
        <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">{user?.username}</span>
            <button onClick={async () => { await logout(); navigate('/login') }}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="pt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
