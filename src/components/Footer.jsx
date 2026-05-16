import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/files/logo.png" alt="MESOB" className="h-10 w-10 brightness-0 invert" />
              <span className="font-bold text-xl">{t('MESOB Center')}</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              {t('Modern Ethiopian Services for Organized Benefit. Bringing together essential government services into one seamless digital platform.')}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('Quick Links')}</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/" className="text-blue-200 hover:text-white text-sm transition">{t('Home')}</Link>
              <Link to="/service-catalogue" className="text-blue-200 hover:text-white text-sm transition">{t('Services')}</Link>
              <Link to="/departments" className="text-blue-200 hover:text-white text-sm transition">{t('Departments')}</Link>
              <Link to="/about-us" className="text-blue-200 hover:text-white text-sm transition">{t('About Us')}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('Contact')}</h3>
            <p className="text-blue-200 text-sm">{t('FDRE MESOB Service')}</p>
            <p className="text-blue-200 text-sm mt-2">{t('Modern Ethiopian Services for Organized Benefit.')}</p>
          </div>
        </div>
        <div className="border-t border-blue-800 mt-8 pt-6 text-center text-blue-300 text-sm">
          &copy; {new Date().getFullYear()} {t('MESOB Center')}. {t('All rights reserved.')}
        </div>
      </div>
    </footer>
  )
}
