import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, FileText, Fingerprint, CheckCircle } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { renderGoogleButton, getGoogleCredential } from '../../services/googleAuth'
import { useLanguage } from '../../context/LanguageContext'

export default function CitizenRegister() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', idNumber: '', email: '',
    phone: '', password: '', confirmPassword: ''
  })
  const processed = useRef(false)

  const processGoogleCredential = async (credential) => {
    if (processed.current) return
    try {
      processed.current = true
      setLoading(true)
      await citizenService.googleLogin(credential)
      navigate('/citizen/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = getGoogleCredential()
    if (token) {
      processGoogleCredential(token)
      return
    }
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return
    renderGoogleButton('google-signup-button', processGoogleCredential)
  }, [])

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setError('')
  }

  const handleNext = () => {
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.phone) {
        setError(t('Please fill in all personal details.'))
        return
      }
      if (!/\S+@\S+\.\S+/.test(form.email)) { setError(t('Please enter a valid email.')); return }
    }
    if (step === 2) {
      if (!form.idNumber) { setError(t('Please enter your ID number.')); return }
      if (form.password.length < 6) { setError(t('Password must be at least 6 characters.')); return }
      if (form.password !== form.confirmPassword) { setError(t('Passwords do not match.')); return }
    }
    setStep(s => s + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await citizenService.register(form)
      navigate('/citizen/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="text-center mb-8">
            <img src="/files/logo.png" alt="MESOB" className="w-16 h-16 object-contain mx-auto mb-4" />
            <h1 className="text-3xl font-black text-gray-900">{t('Create Account')}</h1>
            <p className="text-gray-500 mt-1">{t('Join the MESOB citizen portal')}</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 transition ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}>
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('Personal Information')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('First Name')}</label>
                      <input type="text" value={form.firstName} onChange={handleChange('firstName')}
                        placeholder={t('John')} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Last Name')}</label>
                      <input type="text" value={form.lastName} onChange={handleChange('lastName')}
                        placeholder={t('Doe')} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Email Address')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={form.email} onChange={handleChange('email')}
                        placeholder={t('john@example.com')} autoComplete="email"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Phone Number')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="tel" value={form.phone} onChange={handleChange('phone')}
                        placeholder={t('+251 9XX XXX XXXX')} autoComplete="tel"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t('ID & Security')}</h2>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('National ID / Fayda Number')}</label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" value={form.idNumber} onChange={handleChange('idNumber')}
                        placeholder={t('Enter your ID number')}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')}
                        placeholder={t('Min 6 characters')} autoComplete="new-password"
                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Confirm Password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                        placeholder={t('Repeat your password')} autoComplete="new-password"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{t('Review & Confirm')}</h2>
                  <p className="text-gray-500 text-sm mb-4">{t('Please verify your details before submitting.')}</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">{t('Name')}</span><span className="font-semibold">{form.firstName} {form.lastName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('Email')}</span><span className="font-semibold">{form.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('Phone')}</span><span className="font-semibold">{form.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t('ID Number')}</span><span className="font-semibold">{form.idNumber}</span></div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mt-4">{error}</motion.p>
              )}

              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                    {t('Back')}
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition ${step === 1 ? 'flex-1' : ''}`}>
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : step === 3 ? <>{t('Create Account')} <CheckCircle className="w-4 h-4" /></>
                    : <>{t('Continue')} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">{t('Or sign up with')}</span>
                  </div>
                </div>

                <div id="google-signup-button" className="flex justify-center">
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('Already have an account?')}{' '}
            <Link to="/citizen-login" className="text-blue-600 font-semibold hover:underline">{t('Sign In')}</Link>
          </p>
          <p className="text-center text-sm mt-2">
            <Link to="/" className="text-gray-400 hover:text-gray-600">{t('← Back to Home')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
