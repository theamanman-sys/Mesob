import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/service-catalogue', label: 'Services' },
  { path: '/about-us', label: 'About Us' }
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { currentLanguage, changeLanguage, languages } = useLanguage()

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
                  <option value="am">Amharic</option>
                  <option value="om">Afaan Oromo</option>
                </>
              )}
            </select>
            <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition">
              Admin
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
            <Link to="/login" onClick={() => setOpen(false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm text-center">
              Admin Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
