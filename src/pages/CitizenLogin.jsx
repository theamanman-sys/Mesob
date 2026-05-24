import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, FileCheck2, Clock } from 'lucide-react'
import { renderGoogleButton, getGoogleCredential } from '../services/googleAuth'
import { citizenService } from '../services/citizenService'
import { isInAppBrowser } from '../utils/browserCheck'
import InAppBrowserWarning from '../components/InAppBrowserWarning'

export default function CitizenLogin() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const processed = useRef(false)
  const [inAppBrowser] = useState(() => isInAppBrowser())

  const processGoogleCredential = async (credential) => {
    if (processed.current) return
    try {
      processed.current = true
      setLoading(true)
      await citizenService.googleLogin(credential)
      navigate('/citizen/dashboard')
    } catch (err) {
      setError(err.message)
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
    renderGoogleButton('google-signin-button', processGoogleCredential)
  }, [])

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.identifier || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await citizenService.login(form.identifier, form.password)
      navigate('/citizen/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {inAppBrowser && <InAppBrowserWarning />}
      <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="relative z-10 max-w-lg text-white">
          <motion.img src="/files/logo.webp" alt="MESOB" className="w-20 h-20 object-contain mb-6"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} />
          <h1 className="text-4xl font-black mb-4 leading-tight">Welcome to<br />MESOB Citizen Portal</h1>
          <p className="text-blue-200 text-lg mb-8 leading-relaxed">
            Track your service requests, manage appointments, and access your documents — all in one place.
          </p>
          <div className="space-y-4">
            {[
              { icon: FileCheck2, text: 'Track service applications in real-time' },
              { icon: Clock, text: 'View and manage your appointments' },
              { icon: ShieldCheck, text: 'Secure access to your personal documents' }
            ].map((item, i) => (
              <motion.div key={i} className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-blue-100">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-1">Sign In</h2>
            <p className="text-gray-500">Access your citizen account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID Number or Email</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.identifier} onChange={handleChange('identifier')}
                  placeholder="Enter your ID or email" autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')}
                  placeholder="Enter your password" autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div id="google-signin-button" className="flex justify-center">
                </div>
              </>
            )}

            <div className="text-center">
              <Link to="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Home
              </Link>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400">Administrator?</span>
              </div>
            </div>

            <Link to="/login"
              className="block w-full text-center border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition">
              Admin Login
            </Link>
          </form>
        </motion.div>
      </div>
    </div>
    </>
  )
}
