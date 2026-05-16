import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Menu, X, LogOut, ChevronDown } from 'lucide-react'
import { citizenService } from '../services/citizenService'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [citizen, setCitizen] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentLanguage, changeLanguage, languages, t } = useLanguage()

  useEffect(() => {
    setCitizen(citizenService.getSession())
    setProfileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    citizenService.logout()
    setCitizen(null)
    setProfileOpen(false)
    navigate('/')
  }

  const navLinks = [
    { path: '/', label: t('Home') },
    { path: '/service-catalogue', label: t('Services') },
    { path: '/departments', label: t('Departments') },
    { path: '/about-us', label: t('About Us') }
  ]

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/files/logo.png" alt="MESOB" className="h-10 w-10" />
            <span className="font-bold text-xl text-blue-900">MESOB</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}
                className={`text-sm font-medium transition ${location.pathname === link.path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600'}`}>
                {link.label}
              </Link>
            ))}
            <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-white text-gray-700">
              {languages.map((lang) => (
                <option key={lang.id} value={lang.code}>{lang.name}</option>
              ))}
              {languages.length === 0 && (
                <>
                  <option value="en">English</option>
                  <option value="am">አማርኛ</option>
                  <option value="om">Afaan Oromoo</option>
                </>
              )}
            </select>

            {citizen ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {citizen.firstName?.[0]}{citizen.lastName?.[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {citizen.firstName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{citizen.firstName} {citizen.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{citizen.email}</p>
                      </div>
                      <Link to="/citizen/dashboard" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        My Dashboard
                      </Link>
                      <Link to="/citizen/profile" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        Profile
                      </Link>
                      <Link to="/citizen/documents" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        My Documents
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/citizen-register"
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium hover:text-blue-800 transition">
                  {t('Register')}
                </Link>
                <Link to="/citizen-login"
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition">
                  {t('Sign In')}
                </Link>
              </>
            )}

            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition">
              {t('Admin')}
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t pb-4">
          <div className="flex flex-col space-y-2 px-4 pt-2">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setOpen(false)}
                className={`text-sm font-medium py-2 ${location.pathname === link.path ? 'text-blue-600' : 'text-gray-700'}`}>
                {link.label}
              </Link>
            ))}

            {citizen ? (
              <>
                <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {citizen.firstName?.[0]}{citizen.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{citizen.firstName} {citizen.lastName}</p>
                    <p className="text-xs text-gray-500">{citizen.email}</p>
                  </div>
                </div>
                <Link to="/citizen/dashboard" onClick={() => setOpen(false)}
                  className="text-sm font-medium py-2 text-gray-700">Dashboard</Link>
                <Link to="/citizen/profile" onClick={() => setOpen(false)}
                  className="text-sm font-medium py-2 text-gray-700">Profile</Link>
                <Link to="/citizen/documents" onClick={() => setOpen(false)}
                  className="text-sm font-medium py-2 text-gray-700">My Documents</Link>
                <button onClick={() => { handleLogout(); setOpen(false) }}
                  className="text-sm font-medium py-2 text-red-600 text-left">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/citizen-register" onClick={() => setOpen(false)}
                  className="text-blue-600 px-4 py-2 rounded-md text-sm text-center">
                  {t('Register')}
                </Link>
                <Link to="/citizen-login" onClick={() => setOpen(false)}
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm text-center">
                  {t('Sign In')}
                </Link>
              </>
            )}

            <Link to="/login" onClick={() => setOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm text-center">
              {t('Admin')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
