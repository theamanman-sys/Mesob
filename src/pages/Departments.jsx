import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import { organizationService } from '../services/organizationService'
import { useLanguage } from '../context/LanguageContext'
import { departments as seedDepartments } from '../data/seedData'

export default function Departments() {
  const { t } = useLanguage()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await organizationService.getWithLanguage()
        const fetched = data.data || data || []
        setDepartments(fetched.length > 0 ? fetched : seedDepartments)
      } catch {
        setDepartments(seedDepartments)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeDepts = departments.filter((d) => d.isActive !== false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6">
            {t('Departments')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 max-w-3xl mx-auto">
            {t('Explore the various departments and organizations operating within MESOB Center')}
          </motion.p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeDepts.map((dept, i) => (
              <motion.div key={dept.id || i} initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/departments/${dept.id}`}
                  className="block bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition group h-full">
                  <div className="mb-4">
                    {dept.icon ? (
                      <img src={dept.icon} alt="" className="h-16" />
                    ) : (
                      <Building2 className="w-16 h-16" style={{ color: dept.color || '#2563eb' }} />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                    {t(dept.name)}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {dept.description || t('No description available.')}
                  </p>
                  <span className="inline-flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                    {t('View Services')} <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
            {activeDepts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {t('No departments found.')}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
