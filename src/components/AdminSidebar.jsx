import { Link, useLocation } from 'react-router-dom'
import { X, LayoutDashboard, Globe, Image, Building2, FileText, ShoppingCart, MapPin, Newspaper, Phone, Map,
  Video, MessageSquare, Users, Settings, Menu as MenuIcon, Megaphone, BookOpen, UserCheck, Scan, PiggyBank, FileSignature, Shield, Home, Landmark } from 'lucide-react'

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'contentManager'] },
  { path: '/admin/languages', icon: Globe, label: 'Languages', roles: ['admin', 'contentManager'] },
  { path: '/admin/banner', icon: Image, label: 'Banner', roles: ['admin', 'contentManager'] },
  { path: '/admin/banner-images', icon: Image, label: 'Banner Images', roles: ['admin', 'socialMedia'] },
  { path: '/admin/organization', icon: Building2, label: 'Organizations', roles: ['admin', 'contentManager'] },
  { path: '/admin/service', icon: FileText, label: 'Services', roles: ['admin', 'contentManager'] },
  { path: '/admin/service-catalog', icon: ShoppingCart, label: 'Service Catalog', roles: ['admin', 'contentManager'] },
  { path: '/admin/location', icon: MapPin, label: 'Locations', roles: ['admin', 'contentManager'] },
  { path: '/admin/news', icon: Newspaper, label: 'News', roles: ['admin', 'socialMedia'] },
  { path: '/admin/contact-info', icon: Phone, label: 'Contact Info', roles: ['admin', 'socialMedia'] },
  { path: '/admin/headquarters', icon: Map, label: 'Headquarters', roles: ['admin', 'contentManager'] },
  { path: '/admin/contact-ui-text', icon: MessageSquare, label: 'Contact UI Text', roles: ['admin', 'contentManager'] },
  { path: '/admin/social-media-links', icon: Users, label: 'Social Media', roles: ['admin', 'socialMedia'] },
  { path: '/admin/body-texts', icon: FileText, label: 'Body Texts', roles: ['admin', 'contentManager'] },
  { path: '/admin/video-data', icon: Video, label: 'Video Data', roles: ['admin', 'socialMedia'] },
  { path: '/admin/popular-services', icon: ShoppingCart, label: 'Popular Services', roles: ['admin', 'contentManager'] },
  { path: '/admin/messages', icon: MessageSquare, label: 'Messages', roles: ['admin'] },
  { path: '/admin/adv-image', icon: Image, label: 'Adv Images', roles: ['admin', 'socialMedia'] },
  { path: '/admin/adv-video', icon: Video, label: 'Adv Videos', roles: ['admin', 'socialMedia'] },
  { path: '/admin/government-services', icon: Building2, label: 'Gov Services', roles: ['admin', 'contentManager'] },
  { path: '/admin/news-ui-text', icon: BookOpen, label: 'News UI Text', roles: ['admin', 'contentManager'] },
  { path: '/admin/about-us', icon: FileText, label: 'About Us', roles: ['admin', 'contentManager'] },
  { path: '/admin/user-management', icon: UserCheck, label: 'User Mgmt', roles: ['admin'] },
  { path: '/admin/document-scanner', icon: Scan, label: 'Document Scanner', roles: ['admin'] },
  { path: '/admin/applications', icon: FileText, label: 'Applications', roles: ['admin'] },
  { path: '/admin/pension', icon: PiggyBank, label: 'Pension', roles: ['admin'] },
  { path: '/admin/inheritance', icon: FileSignature, label: 'Inheritance', roles: ['admin'] },
  { path: '/admin/insurance', icon: Shield, label: 'Insurance', roles: ['admin'] },
  { path: '/admin/bank', icon: Landmark, label: 'Bank & Finance', roles: ['admin'] },
  { path: '/admin/property', icon: Home, label: 'Property Mgmt', roles: ['admin'] },
  { path: '/admin/account-settings', icon: Settings, label: 'Account', roles: ['admin', 'socialMedia', 'contentManager'] },
]

export default function AdminSidebar({ open, setOpen, userRole }) {
  const location = useLocation()
  const filtered = menuItems.filter((m) => m.roles.includes(userRole || ''))

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <Link to="/admin" className="flex items-center space-x-2">
            <img src="/files/logo.png" alt="MESOB" className="h-8 w-8" />
            <span className="font-bold text-blue-900 dark:text-white">MESOB Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {filtered.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition
                ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
