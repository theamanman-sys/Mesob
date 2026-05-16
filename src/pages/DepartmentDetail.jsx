import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Search, Clock, DollarSign, Globe } from 'lucide-react'
import { organizationService } from '../services/organizationService'
import { serviceService } from '../services/serviceService'
import { useLanguage } from '../context/LanguageContext'
import { getTranslatedService } from '../i18n/serviceTranslations'
import { departments as seedDepartments, services as seedServices } from '../data/seedData'

export default function DepartmentDetail() {
  const { id } = useParams()
  const { t, currentLanguage } = useLanguage()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [orgRes, svcRes] = await Promise.all([
          organizationService.getById(id),
          serviceService.getByOrganization(id)
        ])
        setDepartment(orgRes.data.data || orgRes.data || seedDepartments.find((d) => d.id === Number(id)))
        const fetchedServices = svcRes.data.data || svcRes.data || []
        setServices(fetchedServices.length > 0 ? fetchedServices : seedServices.filter((s) => s.organizationId === Number(id)))
      } catch {
        setDepartment(seedDepartments.find((d) => d.id === Number(id)))
        setServices(seedServices.filter((s) => s.organizationId === Number(id)))
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const translatedServices = useMemo(() =>
    services.map(s => getTranslatedService(s, currentLanguage)),
    [services, currentLanguage]
  )

  const filtered = translatedServices.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!department) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <Building2 className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('Department Not Found')}</h2>
        <Link to="/departments" className="text-blue-600 hover:underline mt-4">{t('Back to Departments')}</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <Link to="/departments" className="inline-flex items-center text-blue-200 hover:text-white transition mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('Back to Departments')}
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center space-x-4 mb-4">
              <div className="mb-4">
                {department.icon ? (
                  <img src={department.icon} alt="" className="h-16" />
                ) : (
                  <Building2 className="w-16 h-16" style={{ color: department.color || '#2563eb' }} />
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{department.name}</h1>
                <p className="text-blue-200 mt-1">{t('Department')}</p>
              </div>
            </div>
            {department.description && (
              <p className="text-blue-100 max-w-3xl mt-4 leading-relaxed">{department.description}</p>
            )}
            {department.url && (
              <a href={department.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center text-blue-200 hover:text-white transition text-sm mt-3">
                <Globe className="w-4 h-4 mr-1" /> {department.url}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('Services')} ({filtered.length})
            </h2>
            <div className="relative max-w-xs w-full ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder={t('Search services...')} value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search ? t('No services match your search.') : t('No services available for this department.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((svc, i) => (
                <motion.div key={svc.id || i} initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={`/services/${svc.id}`}
                    className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group h-full">
                    <div className="flex items-start space-x-3">
                      <Building2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{svc.title}</h3>
                        {svc.description && (
                          <p className="text-sm text-gray-600 mt-2">{svc.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                          {svc.processingTime && svc.processingTime !== '-' && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {svc.processingTime}
                            </span>
                          )}
                          {svc.ServiceFee && svc.ServiceFee !== '-' && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> {svc.ServiceFee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
