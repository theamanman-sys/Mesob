import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Fingerprint, Save, CheckCircle, BadgeCheck, Award, TrendingUp, DollarSign, Shield, Wallet, Users, Hash, ExternalLink, Eye, EyeOff, GraduationCap, Briefcase, Star, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

export default function CitizenProfile() {
  const { t } = useLanguage()
  const [citizen, setCitizen] = useState(null)
  const [badge, setBadge] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) {
      setCitizen(session)
      setForm({
        firstName: session.firstName || '',
        lastName: session.lastName || '',
        email: session.email || '',
        phone: session.phone || '',
        idNumber: session.idNumber || '',
        shareName: session.shareName || false,
        education: session.education || [{ level: '', field: '', institution: '', year: '' }],
        experience: session.experience || [{ title: '', company: '', years: '' }],
        skills: session.skills || []
      })
    }
    citizenService.getBadge().then(b => setBadge(b || {})).catch(() => {})
  }, [])

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [field]: val })
    setSaved(false)
  }

  const handleEduChange = (i, field) => (e) => {
    const edu = [...form.education]
    edu[i] = { ...edu[i], [field]: e.target.value }
    setForm({ ...form, education: edu })
    setSaved(false)
  }

  const addEdu = () => setForm({ ...form, education: [...form.education, { level: '', field: '', institution: '', year: '' }] })
  const removeEdu = (i) => setForm({ ...form, education: form.education.filter((_, idx) => idx !== i) })

  const handleExpChange = (i, field) => (e) => {
    const exp = [...form.experience]
    exp[i] = { ...exp[i], [field]: e.target.value }
    setForm({ ...form, experience: exp })
    setSaved(false)
  }

  const addExp = () => setForm({ ...form, experience: [...form.experience, { title: '', company: '', years: '' }] })
  const removeExp = (i) => setForm({ ...form, experience: form.experience.filter((_, idx) => idx !== i) })

  const handleSkillsChange = (e) => {
    setForm({ ...form, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!citizen) return
    setSaving(true)
    try {
      const updated = await citizenService.updateProfile(form)
      setCitizen(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setSaving(false)
  }

  if (!citizen) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">{t('My Profile')}</h1>
        <p className="text-gray-500 mt-1">{t('Manage your personal information and view your badges')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold relative">
                  {citizen.firstName?.[0]}{citizen.lastName?.[0]}
                  {badge?.isMesobVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                      <BadgeCheck className="w-4 h-4 text-yellow-900" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{citizen.firstName} {citizen.lastName}</h2>
                    {badge?.isMesobVerified && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900 font-bold">
                        <BadgeCheck className="w-3 h-3" /> {t('MESOB VERIFIED')}
                      </span>
                    )}
                  </div>
                  <p className="text-blue-200 text-sm">{t('Citizen')} • {t('Member since')} {citizen.createdAt ? new Date(citizen.createdAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('First Name')}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={form.firstName} onChange={handleChange('firstName')}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Last Name')}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" value={form.lastName} onChange={handleChange('lastName')}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={form.email} onChange={handleChange('email')}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Phone')}</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={handleChange('phone')}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('National ID / Fayda Number')}</label>
                <div className="relative">
                  <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={form.idNumber} disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <p className="text-xs text-gray-400 mt-1">{t('ID number cannot be changed. Manage your Fayda ID in')} <Link to="/citizen/fayda-id" className="text-blue-600 hover:underline">{t('Fayda ID settings')}</Link>.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    {form.shareName ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    {t('Show my name on rankings')}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t('When enabled, your real name appears on the Wealth Distribution Board. Otherwise you\'ll be listed as')} &ldquo;{t('Citizen')} #<em>{t('rank')}</em>&rdquo;.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.shareName} onChange={handleChange('shareName')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" /> {t('Education')}</h3>
                {form.education.map((edu, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-xl relative">
                    <input type="text" value={edu.level} onChange={handleEduChange(i, 'level')} placeholder={t('Level (Bachelor, Master...)')} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
                    <input type="text" value={edu.field} onChange={handleEduChange(i, 'field')} placeholder={t('Field of study')} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
                    <input type="text" value={edu.institution} onChange={handleEduChange(i, 'institution')} placeholder={t('Institution')} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
                    <div className="flex gap-2"><input type="text" value={edu.year} onChange={handleEduChange(i, 'year')} placeholder={t('Year')} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />{form.education.length > 1 && <button onClick={() => removeEdu(i)} className="text-red-400 hover:text-red-600 p-2"><X className="w-4 h-4" /></button>}</div>
                  </div>
                ))}
                <button onClick={addEdu} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> {t('Add Education')}</button>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" /> {t('Work Experience')}</h3>
                {form.experience.map((exp, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-xl relative">
                    <input type="text" value={exp.title} onChange={handleExpChange(i, 'title')} placeholder={t('Job title')} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
                    <input type="text" value={exp.company} onChange={handleExpChange(i, 'company')} placeholder={t('Company')} className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />
                    <div className="flex gap-2"><input type="text" value={exp.years} onChange={handleExpChange(i, 'years')} placeholder={t('Years')} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm" />{form.experience.length > 1 && <button onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600 p-2"><X className="w-4 h-4" /></button>}</div>
                  </div>
                ))}
                <button onClick={addExp} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"><Plus className="w-4 h-4" /> {t('Add Experience')}</button>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> {t('Skills')}</h3>
                <input type="text" value={form.skills.join(', ')} onChange={handleSkillsChange} placeholder={t('JavaScript, Project Management, Tax Compliance...')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
                <p className="text-xs text-gray-400 mt-1">{t('Separate skills with commas. Skills help match you with relevant job opportunities.')}</p>
              </div>

              {saved && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4" /> {t('Profile updated successfully.')}
                </motion.p>
              )}

              <button type="submit" disabled={saving}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Save className="w-4 h-4" /> {t('Save Changes')}</>}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          {badge && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> {t('My Badges')}</h3>
              <div className="space-y-2.5">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${badge.isMesobVerified ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <div className={`p-2 rounded-lg ${badge.isMesobVerified ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-400'}`}><BadgeCheck className="w-5 h-5" /></div>
                  <div><div className="text-sm font-semibold text-gray-800">{t('MESOB Verified')}</div><div className="text-xs text-gray-500">{badge.isMesobVerified ? t('✓ Verified Member') : t('Not yet verified')}</div></div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${badge.badges?.taxPayer ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <div className={`p-2 rounded-lg ${badge.badges?.taxPayer ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-400'}`}><DollarSign className="w-5 h-5" /></div>
                  <div><div className="text-sm font-semibold text-gray-800">{t('Tax Payer')}</div><div className="text-xs text-gray-500">{badge.badges?.taxPayer ? t('Tax records verified') : t('No tax records yet')}</div></div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${badge.badges?.tinRegistered ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'}`}>
                  <div className={`p-2 rounded-lg ${badge.badges?.tinRegistered ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-400'}`}><Hash className="w-5 h-5" /></div>
                  <div><div className="text-sm font-semibold text-gray-800">{t('TIN Registered')}</div><div className="text-xs text-gray-500">{badge.badges?.tinRegistered ? t('TIN on file') : t('No TIN registered')}</div></div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${badge.badges?.documentVerified ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                  <div className={`p-2 rounded-lg ${badge.badges?.documentVerified ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-400'}`}><Shield className="w-5 h-5" /></div>
                  <div><div className="text-sm font-semibold text-gray-800">{t('Documents')}</div><div className="text-xs text-gray-500">{badge.verifiedDocuments || 0} {t('of')} 4 {t('verified')}</div></div>
                </div>
              </div>
              <Link to="/citizen/verification" className="flex items-center justify-center gap-1.5 mt-4 text-xs text-blue-600 font-medium hover:text-blue-700">
                {t('Manage Verification')} <ExternalLink className="w-3 h-3" />
              </Link>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> Economy Position</h3>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl mb-3">
              <div className="text-3xl font-black text-blue-700">#{badge?.economyRank || '-'}</div>
              <div className="text-xs text-blue-500">of {badge?.totalParticipants || 0} participants</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500">Net Worth</span><span className="font-semibold text-gray-800">{badge?.netWorth ? `${badge.netWorth.toLocaleString()} ETB` : '—'}</span></div>
              <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500">Verified Documents</span><span className="font-semibold text-gray-800">{badge?.verifiedDocuments || 0}</span></div>
              <div className="flex justify-between py-1.5"><span className="text-gray-500">TIN Status</span><span className={`font-semibold ${badge?.tinStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`}>{badge?.tinStatus || '—'}</span></div>
            </div>
            <Link to="/citizen/finance" className="flex items-center justify-center gap-1.5 mt-3 text-xs text-blue-600 font-medium hover:text-blue-700">
              View Finance Details <ExternalLink className="w-3 h-3" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Quick Links</h3>
            <div className="space-y-1.5">
              {[
                { to: '/citizen/fayda-id', label: 'Fayda ID Management', icon: Fingerprint },
                { to: '/citizen/verification', label: 'Document Verification', icon: Shield },
                { to: '/citizen/tickets', label: 'My Tickets', icon: Wallet },
                { to: '/citizen/finance', label: 'Economy & Finance', icon: DollarSign },
              ].map(l => (
                <Link key={l.to} to={l.to} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition">
                  <l.icon className="w-4 h-4" /> {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
