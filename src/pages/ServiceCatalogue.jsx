import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Building2 } from 'lucide-react'
import { serviceCatalogService } from '../services/serviceCatalogService'
import { useLanguage } from '../context/LanguageContext'

export default function ServiceCatalogue() {
  const { currentLanguage } = useLanguage()
  const [services, setServices] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await serviceCatalogService.getAll()
        setServices(data.data || data || [])
      } catch { setServices([]) }
      finally { setLoading(false) }
    })()
  }, [])

  const filtered = services.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4">
            Service Catalogue
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-blue-100">
            Browse all government services available at MESOB Center
          </motion.p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search services..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((service, i) => (
                <motion.div key={service.id || i} initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name || service.title}</h3>
                      <p className="text-sm text-gray-600 mt-2">{service.description || ''}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No services found. Try a different search term.
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
