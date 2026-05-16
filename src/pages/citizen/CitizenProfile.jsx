import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Fingerprint, Save, CheckCircle } from 'lucide-react'
import { citizenService } from '../../services/citizenService'

export default function CitizenProfile() {
  const [citizen, setCitizen] = useState(null)
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
        idNumber: session.idNumber || ''
      })
    }
  }, [])

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
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
        <h1 className="text-2xl font-black text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information.</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {citizen.firstName?.[0]}{citizen.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{citizen.firstName} {citizen.lastName}</h2>
                <p className="text-blue-200 text-sm">Citizen • Member since {new Date(citizen.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={form.firstName} onChange={handleChange('firstName')}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={form.lastName} onChange={handleChange('lastName')}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={form.email} onChange={handleChange('email')}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="tel" value={form.phone} onChange={handleChange('phone')}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">National ID / Fayda Number</label>
              <div className="relative">
                <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.idNumber} disabled
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 mt-1">ID number cannot be changed.</p>
            </div>

            {saved && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4" /> Profile updated successfully.
              </motion.p>
            )}

            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
