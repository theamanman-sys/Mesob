import { motion } from 'framer-motion'
import { Target, Eye, Shield, Zap, Accessibility } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function AboutUs() {
  const { t } = useLanguage()

  const values = [
    { icon: Zap, title: t('Efficiency'), desc: t('Streamlined processes for faster service delivery') },
    { icon: Shield, title: t('Security'), desc: t('Secure handling of all citizen data and transactions') },
    { icon: Accessibility, title: t('Accessibility'), desc: t('Services available to all Ethiopian citizens') }
  ]
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6">
            {t('About MESOB Center')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-xl text-blue-100 max-w-3xl mx-auto">
            {t('Modern Ethiopian Services for Organized Benefit — a one-stop service center for all government services.')}
          </motion.p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}>
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">{t('Our Mission')}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t('To establish a seamless, efficient, and secure one-stop service center where Ethiopian residents can access essential government and organizational services in a single location, reducing bureaucracy and enhancing service efficiency.')}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}>
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">{t('Our Vision')}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t('To be the premier digital service platform in Ethiopia, setting the standard for efficient, transparent, and citizen-centered government service delivery.')}
              </p>
            </motion.div>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('Core Values')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="text-center p-8 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
