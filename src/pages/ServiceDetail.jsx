import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, Clock, DollarSign, FileText, CheckCircle2, Info, ExternalLink, Zap, Globe, Loader } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getTranslatedService } from '../i18n/serviceTranslations'
import { serviceService } from '../services/serviceService'
import { organizationService } from '../services/organizationService'
import { citizenService } from '../services/citizenService'

export default function ServiceDetail() {
  const { id } = useParams()
  const { t, currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [service, setService] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data: svcData } = await serviceService.getById(id)
        const svc = svcData.data || svcData
        if (svc) {
          setService(getTranslatedService(svc, currentLanguage))
          if (svc.organizationId) {
            const { data: orgData } = await organizationService.getById(svc.organizationId)
            setOrganization(orgData.data || orgData)
          }
        }
      } catch {
        setService(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, currentLanguage])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md mx-4">
          <Info className="w-16 h-16 mb-4 text-blue-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('Service Not Found')}</h2>
          <p className="text-gray-600 mb-6">{t('The service you are looking for might have been moved or does not exist.')}</p>
          <Link to="/service-catalogue" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition">
            {t('Browse All Services')}
          </Link>
        </div>
      </div>
    )
  }

  const steps = [
    { title: t('Information Gathering'), desc: t('Read the requirements and gather all necessary documents listed below.') },
    { title: t('Online Application'), desc: t('Fill out the digital application form on the official portal.') },
    { title: t('Fee Payment'), desc: t('Pay the service fee through Telebirr or CBE Birr.') },
    { title: t('Review & Processing'), desc: t('The department will review your application and process the request.') },
    { title: t('Collection/Approval'), desc: t('Receive your approved document or notification of completion.') }
  ]

  const requirements = [
    t('Valid National ID (Fayda)'),
    t('Proof of Address'),
    t('Previous document (for renewals)'),
    t('Payment receipt')
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/service-catalogue" className="inline-flex items-center text-blue-200 hover:text-white transition mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            {t('Back to Service Catalogue')}
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center space-x-3 mb-4">
                <span className="px-3 py-1 bg-blue-500/30 border border-blue-400/30 rounded-full text-xs font-bold tracking-wider uppercase">
                  {t('Service Details')}
                </span>
                {organization && (
                  <Link to={`/departments/${organization.id}`} className="text-blue-300 hover:text-white transition text-sm flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    {t(organization.name)}
                  </Link>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                {t(service.title)}
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                {service.description || t('Efficient and transparent government service provided through the MESOB portal for all eligible citizens.')}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-yellow-400" /> {t('Quick Summary')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center text-blue-100">
                    <Clock className="w-5 h-5 mr-3 text-blue-400" />
                    <span>{t('Processing Time')}</span>
                  </div>
                  <span className="font-bold">{service.processingTime || t('Varies')}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center text-blue-100">
                    <DollarSign className="w-5 h-5 mr-3 text-green-400" />
                    <span>{t('Service Fee')}</span>
                  </div>
                  <span className="font-bold">{service.ServiceFee || t('Free')}</span>
                </div>
                {organization?.url && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center text-blue-100">
                      <Globe className="w-5 h-5 mr-3 text-purple-400" />
                      <span>{t('Website')}</span>
                    </div>
                    <a href={organization.url} target="_blank" rel="noopener noreferrer"
                      className="font-bold text-sm text-blue-200 hover:text-white truncate max-w-[180px]">
                      {organization.url.replace('https://www.', '')}
                    </a>
                  </div>
                )}
                <button onClick={async () => {
                  const session = citizenService.getSession()
                  if (!session) { navigate('/citizen-login'); return }
                  setApplying(true)
                  try {
                    await citizenService.submitApplication(service.id, service.title, {}, [])
                    setApplied(true)
                  } catch { alert('Failed to submit application') }
                  setApplying(false)
                }} disabled={applying || applied}
                  className={`w-full mt-4 font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group ${
                    applied
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-blue-900 hover:shadow-yellow-500/20'
                  }`}>
                  {applying ? <Loader className="w-5 h-5 animate-spin" /> : applied ? <CheckCircle2 className="w-5 h-5" /> : null}
                  {applied ? t('Application Submitted') : t('Start Application')}
                  {!applied && !applying && <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-600" /> {t('Required Documents')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(service.requirements || requirements).map((req, i) => (
                    <div key={i} className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{req}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-blue-600" /> {t('How to Apply')}
                </h2>
                <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-100">
                  {steps.map((step, i) => (
                    <div key={i} className="relative pl-12">
                      <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm z-10 shadow-lg shadow-blue-600/20">
                        {i + 1}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t('Support')}</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-800 font-bold mb-1">{t('Call Center')}</p>
                    <p className="text-lg font-black text-blue-900">8080</p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-sm text-indigo-800 font-bold mb-1">{t('Email Support')}</p>
                    <p className="text-sm font-bold text-indigo-900">support@mesobcenter.et</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                <h3 className="text-xl font-bold mb-4">{t('Official Notice')}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {t('All digital documents issued through MESOB are legally equivalent to their physical counterparts under the FDRE Digital Signature Law.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
