import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Hero3DSequence from '../components/Hero3DSequence'

import { Building2, Clock, FileCheck2, HeadphonesIcon, MapPin, ShieldCheck, Zap, ArrowRight, Sparkles, Globe, Users, Briefcase, ScrollText, Stamp, Plane, CreditCard } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getTranslatedService } from '../i18n/serviceTranslations'
import { serviceService } from '../services/serviceService'

const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const easeOutBack = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const serviceGroups = [
  {
    chips: [
      { icon: FileCheck2, label: 'Passports', className: 'chip-passports', serviceId: 12 },
      { icon: Plane, label: 'Visas', className: 'chip-permits', serviceId: 100 },
      { icon: MapPin, label: 'Residence', className: 'chip-locations', serviceId: 98 },
      { icon: Globe, label: 'Travel Docs', className: 'chip-support', serviceId: 102 }
    ],
    floats: [FileCheck2, Globe, Plane],
    core: FileCheck2,
    label: 'Immigration & Travel'
  },
  {
    chips: [
      { icon: Briefcase, label: 'Business Reg.', className: 'chip-passports', serviceId: 4 },
      { icon: Stamp, label: 'Trade License', className: 'chip-permits', serviceId: 252 },
      { icon: CreditCard, label: 'Tax ID', className: 'chip-locations', serviceId: 24 },
      { icon: Building2, label: 'Permits', className: 'chip-support', serviceId: 110 }
    ],
    floats: [Briefcase, Stamp, CreditCard],
    core: Building2,
    label: 'Business & Trade'
  },
  {
    chips: [
      { icon: ShieldCheck, label: 'National ID', className: 'chip-passports', serviceId: 10 },
      { icon: ScrollText, label: 'Birth Cert.', className: 'chip-permits', serviceId: 22 },
      { icon: Users, label: 'Social Services', className: 'chip-locations', serviceId: 113 },
      { icon: MapPin, label: 'Address Reg.', className: 'chip-support', serviceId: 256 }
    ],
    floats: [ShieldCheck, ScrollText, Users],
    core: ShieldCheck,
    label: 'Citizen Services'
  },
  {
    chips: [
      { icon: HeadphonesIcon, label: 'Help Desk', className: 'chip-passports', serviceId: null },
      { icon: MapPin, label: 'Centers', className: 'chip-permits', serviceId: null },
      { icon: Clock, label: 'Appointments', className: 'chip-locations', serviceId: null },
      { icon: Zap, label: 'Complaints', className: 'chip-support', serviceId: null }
    ],
    floats: [HeadphonesIcon, MapPin, Zap],
    core: HeadphonesIcon,
    label: 'Support & Info'
  }
]

function MesobHero({ t }) {
  const shouldReduceMotion = useReducedMotion()
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const [activePhase, setActivePhase] = useState(-1)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.play().catch(() => {
      const once = () => { el.play(); document.removeEventListener('touchstart', once); document.removeEventListener('click', once) }
      document.addEventListener('touchstart', once, { once: true })
      document.addEventListener('click', once, { once: true })
    })
  }, [])

  const setCssVar = useCallback((el, name, val) => {
    if (el && el.style.getPropertyValue(name) !== String(val)) {
      el.style.setProperty(name, val)
    }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    let ticking = false
    let lastPhase = -1

    const update = () => {
      const rect = el.getBoundingClientRect()
      const h = rect.height - window.innerHeight
      const raw = h > 0 ? Math.max(0, Math.min(1, -rect.top / h)) : 0

      const eased = shouldReduceMotion ? raw : easeInOutCubic(raw)
      const scrollAmt = shouldReduceMotion ? Math.min(raw * 1.4, 0.5) : eased
      const openAmt = shouldReduceMotion ? Math.min(raw * 1.4, 0.82) : easeOutBack(Math.min(1, Math.max(0, (raw - 0.12) / 0.78)))

      const phase = openAmt > 0.85 ? 3 : openAmt > 0.55 ? 2 : openAmt > 0.25 ? 1 : 0
      if (phase !== lastPhase) { lastPhase = phase; setActivePhase(phase) }

      setCssVar(el, '--open', openAmt)
      setCssVar(el, '--progress-width', `${scrollAmt * 100}%`)
      setCssVar(el, '--hero-copy-y', `${Math.round((1 - scrollAmt) * 56)}px`)
      setCssVar(el, '--stage-y', `${Math.round((1 - scrollAmt) * 32)}px`)
      setCssVar(el, '--float-a-y', `${scrollAmt * -72}px`)
      setCssVar(el, '--float-b-y', `${scrollAmt * 56}px`)
      setCssVar(el, '--float-c-y', `${scrollAmt * -48}px`)
      setCssVar(el, '--copy-opacity', Math.min(1, Math.max(0, (raw - 0.08) / 0.18)))
      setCssVar(el, '--video-opacity', scrollAmt > 0 ? 0 : 1)

      ticking = false
    }

    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [shouldReduceMotion, setCssVar])

  const chipVariants = {
    enter: (i) => ({ opacity: 0, y: 12, scale: 0.9, transition: { delay: i * 0.06, duration: 0.3 } }),
    center: { opacity: 1, y: 0, scale: 1 },
    exit: (i) => ({ opacity: 0, y: -8, scale: 0.9, transition: { delay: i * 0.03, duration: 0.2 } })
  }

  const currentGroup = serviceGroups[activePhase >= 0 ? activePhase : 0]
  const FloatIconA = currentGroup.floats[0]
  const FloatIconB = currentGroup.floats[1]
  const FloatIconC = currentGroup.floats[2]
  const CoreIcon = currentGroup.core

  return (
    <section
      ref={sectionRef}
      className="mesob-hero-scroll"
      style={{
        '--open': 0,
        '--progress-width': '0%',
        '--hero-copy-y': '56px',
        '--stage-y': '32px',
        '--float-a-y': '0px',
        '--float-b-y': '0px',
        '--float-c-y': '0px',
        '--copy-opacity': 0,
        '--video-opacity': 1
      }}
    >
      <div className="mesob-hero-sticky">
        <video
          ref={videoRef}
          className="mesob-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/files/hero-video.mp4" type="video/mp4" />
          <source src="/files/hero-video.mkv" type="video/x-matroska" />
        </video>
        <div className="mesob-ambient mesob-ambient-one" aria-hidden="true" />
        <div className="mesob-ambient mesob-ambient-two" aria-hidden="true" />
        <div className="mesob-woven-ribbon mesob-woven-ribbon-one" aria-hidden="true" />
        <div className="mesob-woven-ribbon mesob-woven-ribbon-two" aria-hidden="true" />

        <span className="mesob-grain" aria-hidden="true" />

        <div className="mesob-hero-shell">
          <div className="mesob-hero-copy">
            <span className="mesob-hero-badge">{t('One-stop service center')}</span>
            <img src="/files/logo.webp" alt="" className="mesob-hero-mark" />

            <div style={{ height: 'clamp(14rem, 22vw, 20rem)' }} />

            <div style={{ height: '1.4rem' }} />

            <div className="mesob-hero-actions">
              <Link to="/service-catalogue" className="mesob-primary-cta">
                <Sparkles className="w-4 h-4" />
                {t('Explore Services')}
              </Link>
              <Link to="/departments" className="mesob-secondary-cta">
                {t('View Departments')}
              </Link>
            </div>
            <div className="mesob-hero-proof" aria-label="MESOB service highlights">
              <span>{t('Digital services')}</span>
              <span>{t('Citizen support')}</span>
              <span>{t('Organized benefits')}</span>
            </div>
          </div>
        </div>

        <div className="mesob-stage" aria-label="3D mesob basket animation">
          <div className="mesob-camera">
            <Hero3DSequence />
          </div>
        </div>

        <div className="mesob-scroll-hint" aria-hidden="true">
          <span className="mesob-scroll-hint-mouse">
            <span className="mesob-scroll-hint-dot" />
          </span>
          <span className="mesob-scroll-hint-text">{t('Scroll')}</span>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t, currentLanguage } = useLanguage()

  const [allServices, setAllServices] = useState([])

  useEffect(() => {
    serviceService.getAll().then(({ data }) => {
      setAllServices(data.data || data || [])
    }).catch(() => setAllServices([]))
  }, [])

  const features = [
    { icon: Building2, title: t('Digital Services'), desc: t('Apply for permits online') },
    { icon: HeadphonesIcon, title: t('Citizen Support'), desc: '24/7' },
    { icon: Clock, title: t('Quick Processing'), desc: t('Fast and efficient service') }
  ]

  const featuredServices = useMemo(() => {
    const categories = {
      local: [12, 14, 2],
      international: [98, 100, 102],
      business: [110, 272, 373]
    }

    const translate = (arr) => arr.map(s => getTranslatedService(s, currentLanguage))

    return {
      local: translate(allServices.filter(s => categories.local.includes(s.id))),
      international: translate(allServices.filter(s => categories.international.includes(s.id))),
      business: translate(allServices.filter(s => categories.business.includes(s.id)))
    }
  }, [currentLanguage, allServices])

  return (
    <div>
      <MesobHero t={t} />

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all duration-300 group">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform">
                  <f.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">{t('Government Services')}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">{t('Access a wide range of official services through our unified digital platform.')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <FileCheck2 className="w-5 h-5 text-orange-600" />
                </div>
                {t('For Citizens')}
              </h3>
              <ul className="space-y-4">
                {featuredServices.local.map(s => (
                  <li key={s.id}>
                    <Link to={`/services/${s.id}`} className="flex items-center text-gray-600 hover:text-blue-600 transition group">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform" />
                      <span className="text-sm font-medium">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/service-catalogue" className="mt-8 inline-flex items-center text-blue-600 font-bold text-sm hover:gap-2 transition-all">
                {t('See more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                {t('International')}
              </h3>
              <ul className="space-y-4">
                {featuredServices.international.map(s => (
                  <li key={s.id}>
                    <Link to={`/services/${s.id}`} className="flex items-center text-gray-600 hover:text-blue-600 transition group">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform" />
                      <span className="text-sm font-medium">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/service-catalogue" className="mt-8 inline-flex items-center text-blue-600 font-bold text-sm hover:gap-2 transition-all">
                {t('See more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                {t('Business')}
              </h3>
              <ul className="space-y-4">
                {featuredServices.business.map(s => (
                  <li key={s.id}>
                    <Link to={`/services/${s.id}`} className="flex items-center text-gray-600 hover:text-blue-600 transition group">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 group-hover:scale-150 transition-transform" />
                      <span className="text-sm font-medium">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/service-catalogue" className="mt-8 inline-flex items-center text-blue-600 font-bold text-sm hover:gap-2 transition-all">
                {t('See more')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/wjFu-pIMoXw"
              title="MESOB hero video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
