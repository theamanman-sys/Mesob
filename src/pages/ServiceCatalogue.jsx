import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Building2, Loader, CheckCircle2, ExternalLink } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getTranslatedService } from '../i18n/serviceTranslations'
import { serviceService } from '../services/serviceService'
import { organizationService } from '../services/organizationService'
import { citizenService } from '../services/citizenService'

export default function ServiceCatalogue() {
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [applying, setApplying] = useState(null)
  const [services, setServices] = useState([])
  const [organizations, setOrganizations] = useState([])

  useEffect(() => {
    Promise.all([
      serviceService.getAll(),
      organizationService.getAll()
    ]).then(([svcRes, orgRes]) => {
      setServices(svcRes.data?.data || svcRes.data || svcRes || [])
      setOrganizations(orgRes.data?.data || orgRes.data || orgRes || [])
    }).catch(() => { setServices([]); setOrganizations([]) })
  }, [])

  const orgMap = {}
  organizations.forEach(o => { orgMap[o.id] = o })

  const filtered = useMemo(() => {
    const translated = services.map(s => getTranslatedService(s, currentLanguage))
    return translated.filter((s) =>
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.title || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [currentLanguage, search, services])

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4">
            {t('Service Catalogue')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-blue-100">
            {t('Browse all government services available at MESOB Center')}
          </motion.p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder={t('Search services...')} value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service, i) => {
              const isApplying = applying === service.id
              const isApplied = applying === 'done-' + service.id
              return (
              <motion.div key={service.id || i} initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition h-full flex flex-col">
                <Link to={`/services/${service.id}`} className="flex-1 group">
                  <div className="flex items-start space-x-3">
                    {(() => { const org = orgMap[service.organizationId]; return org?.icon ? <img src={org.icon} alt="" className="w-7 h-7 mt-0.5 object-contain flex-shrink-0" onError={e => { e.target.style.display = 'none' }} /> : <Building2 className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" /> })()}
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{service.name || service.title}</h3>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description || ''}</p>
                    </div>
                  </div>
                </Link>
                <button onClick={async () => {
                  const session = citizenService.getSession()
                  if (!session) { navigate('/citizen-login'); return }
                  setApplying(service.id)
                  try {
                    await citizenService.submitApplication(service.id, service.title || service.name, {}, [])
                    setApplying('done-' + service.id)
                    setTimeout(() => setApplying(null), 2000)
                  } catch { setApplying(null) }
                }} disabled={isApplying || isApplied}
                  className={`mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                    isApplied
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                  {isApplying ? <Loader className="w-4 h-4 animate-spin" /> : isApplied ? <CheckCircle2 className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {isApplied ? 'Submitted' : isApplying ? 'Applying...' : 'Apply Now'}
                </button>
              </motion.div>
            )})}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {t('No services found. Try a different search term.')}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
