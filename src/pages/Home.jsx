import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { Building2, Clock, HeadphonesIcon, Zap } from 'lucide-react'

const features = [
  { icon: Building2, title: 'Digital Services', desc: 'Apply for permits online' },
  { icon: HeadphonesIcon, title: 'Citizen Support', desc: '24/7' },
  { icon: Clock, title: 'Quick Processing', desc: 'Fast and efficient service' }
]

export default function Home() {
  const { currentLanguage } = useLanguage()

  return (
    <div>
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6">
            Serving Our Community with Excellence
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            In one Mesob Center, we bring together essential government services, resources, and information into one seamless digital platform.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <a href="/service-catalogue"
              className="inline-block bg-yellow-400 text-blue-900 font-semibold px-8 py-3 rounded-md hover:bg-yellow-300 transition">
              Explore Services
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Government Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">For Local Customers</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Passport renewal services (2-day, 5-day urgent)</li>
                <li>Lost and damaged passport renewal</li>
              </ul>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">For International Customers</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Urgent residence permit card services</li>
                <li>Investment visa services</li>
                <li>Ethiopian origin ID card</li>
              </ul>
            </div>
            <div className="border rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">Business Services</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Document authentication and legalization</li>
                <li>Expatriate work permits</li>
                <li>Business contracts and POA authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
