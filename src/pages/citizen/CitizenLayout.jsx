import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, FileText, ClipboardList, Upload, User, LogOut, Menu, X, ChevronRight, Bell, Scan, PiggyBank, FileSignature, Shield, Building2, Home, Ticket, TrendingUp, Fingerprint, BadgeCheck, Briefcase, Scale, Globe, CandlestickChart } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { citizenService } from '../../services/citizenService'

const navItemDefs = [
  { path: '/citizen/dashboard', icon: LayoutDashboard, key: 'Dashboard' },
  { path: '/citizen/services', icon: ClipboardList, key: 'Services' },
  { path: '/citizen/applications', icon: FileText, key: 'My Applications' },
  { path: '/citizen/documents', icon: Upload, key: 'My Documents' },
  { path: '/citizen/document-scanner', icon: Scan, key: 'Document Scanner' },
  { path: '/citizen/pension', icon: PiggyBank, key: 'Pension' },
  { path: '/citizen/inheritance', icon: FileSignature, key: 'Inheritance & Will' },
  { path: '/citizen/insurance', icon: Shield, key: 'Insurance' },
  { path: '/citizen/bank', icon: Building2, key: 'Bank & Finance' },
  { path: '/citizen/property', icon: Home, key: 'Assets & Property' },
  { path: '/citizen/tickets', icon: Ticket, key: 'My Tickets' },
  { path: '/citizen/finance', icon: TrendingUp, key: 'Economy & Finance' },
  { path: '/citizen/fayda-id', icon: Fingerprint, key: 'Fayda Digital ID' },
  { path: '/citizen/verification', icon: BadgeCheck, key: 'Verification & Badges' },
  { path: '/citizen/jobs', icon: Briefcase, key: 'Jobs & Opportunities' },
  { path: '/citizen/legal', icon: Scale, key: 'Legal & Representation' },
  { path: '/citizen/eservices', icon: Globe, key: 'E-Services' },
  { path: '/citizen/trading', icon: CandlestickChart, key: 'Trading' },
  { path: '/citizen/profile', icon: User, key: 'Profile' }
]

export default function CitizenLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [citizen, setCitizen] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentLanguage, changeLanguage, languages, t } = useLanguage()

  useEffect(() => {
    const session = citizenService.getSession()
    if (!session) { navigate('/citizen-login'); return }
    setCitizen(session)
  }, [navigate])

  const handleLogout = () => {
    citizenService.logout()
    navigate('/citizen-login')
  }

  const navItems = navItemDefs.map(item => ({ ...item, label: t(item.key) }))

  if (!citizen) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <Link to="/citizen/dashboard" className="flex items-center gap-3">
              <img src="/files/logo.webp" alt="MESOB" className="w-9 h-9 object-contain" />
              <div>
                <p className="font-bold text-blue-900 text-sm">MESOB</p>
                <p className="text-xs text-gray-500">{t('Citizen Portal')}</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {citizen.firstName?.[0]}{citizen.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{citizen.firstName} {citizen.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{citizen.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition">
              <LogOut className="w-5 h-5" />
              {t('Sign Out')}
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-gray-400" />
                <select value={currentLanguage} onChange={e => changeLanguage(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 outline-none focus:border-blue-500 cursor-pointer">
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                  {languages.length === 0 && (
                    <>
                      <option value="en">English</option>
                      <option value="am">አማርኛ</option>
                    </>
                  )}
                </select>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">{t('← Website')}</Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
