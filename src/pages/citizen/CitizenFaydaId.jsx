import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Fingerprint, CreditCard, Camera, Upload, CheckCircle, AlertCircle, Save, Scan, Image as ImageIcon, RefreshCw, Shield, Globe, BadgeCheck, ExternalLink, Trash2, Info } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

export default function CitizenFaydaId() {
  const { t } = useLanguage()
  const [fayda, setFayda] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [form, setForm] = useState({ fanNumber: '', finNumber: '' })
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileRef = useRef(null)
  const [oidcIdentity, setOidcIdentity] = useState(null)
  const [oidcLoading, setOidcLoading] = useState(true)
  const [oidcLinking, setOidcLinking] = useState(false)

  useEffect(() => {
    citizenService.getFaydaId().then(f => {
      setFayda(f || {})
      setForm({ fanNumber: f?.fanNumber || '', finNumber: f?.finNumber || '' })
    }).catch(console.error).finally(() => setLoading(false))
    citizenService.getFaydaOidcStatus().then(setOidcIdentity).catch(() => {}).finally(() => setOidcLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!form.fanNumber || !form.finNumber) return
    setSaving(true)
    try {
      const res = await citizenService.updateFaydaId(form)
      setFayda(res)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setPreviewUrl(dataUrl)
      try {
        await citizenService.updateFaydaId({ verifiedImageUrl: dataUrl })
        setFayda(prev => ({ ...prev, verifiedImageUrl: dataUrl }))
      } catch (e) { console.error(e) }
      setScanning(false)
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">{t('Fayda Digital ID')}</h1>
        <p className="text-gray-500 mt-1">{t('Manage your Ethiopian National Digital ID (Fayda) information')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-600" /> {t('Fayda ID Credentials')}</h3>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('FAN Number (Fayda Account Number)')}</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.fanNumber} onChange={e => setForm({...form, fanNumber: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" placeholder={t('e.g. FAN-2026-001234')} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('FIN Number (Fayda Identification Number)')}</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={form.finNumber} onChange={e => setForm({...form, finNumber: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" placeholder={t('e.g. FIN-ET-987654321')} />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={saving || !form.fanNumber || !form.finNumber}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t('Save Fayda ID')}</>}
            </button>
            {saved && <p className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg"><CheckCircle className="w-4 h-4" /> {t('Fayda ID saved successfully')}</p>}
          </div>

          {fayda?.fanNumber && fayda?.finNumber && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-2">{t('Saved Fayda Credentials')}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{t('FAN:')}</span><span className="font-semibold text-gray-800">{fayda.fanNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('FIN:')}</span><span className="font-semibold text-gray-800">{fayda.finNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{t('Status:')}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fayda.status === 'verified' ? 'bg-green-100 text-green-700' : fayda.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{fayda.status}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-blue-600" /> {t('Fayda ID Card Image')}</h3>

          <div className="mb-4">
            <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex items-center justify-center mb-3">
              {fayda?.verifiedImageUrl ? (
                <img src={fayda.verifiedImageUrl} alt={t('Uploaded Fayda')} className="w-full h-full object-contain" />
              ) : fayda?.imageUrl ? (
                <img src={fayda.imageUrl} alt={t('Sample Fayda')} className="w-full h-full object-contain opacity-80" />
              ) : (
                <div className="text-center text-gray-400"><CreditCard className="w-12 h-12 mx-auto mb-2" /><span className="text-sm">{t('Sample Fayda ID Card')}</span></div>
              )}
            </div>
            {fayda?.verifiedImageUrl && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 mb-2"><CheckCircle className="w-3.5 h-3.5" /> {t('Your uploaded ID card')}</div>
            )}
            {!fayda?.verifiedImageUrl && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2"><AlertCircle className="w-3.5 h-3.5" /> {t('Showing sample Fayda ID. Upload your actual card for verification.')}</div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={scanning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition">
              {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {scanning ? t('Processing...') : t('Upload ID Card Scan')}
            </button>
            <input type="file" ref={fileRef} accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('Upload a clear photo of your Fayda ID card. Accepted formats: JPG, PNG')}</p>
        </motion.div>
      </div>

      {/* OIDC Verification Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" /> {t('Fayda OIDC Identity Verification')}</h3>

        {oidcLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : oidcIdentity ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800">{t('Identity Verified via Fayda OIDC')}</p>
                <p className="text-xs text-green-600">{t('Your identity has been verified through the national digital ID system.')}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: t('Full Name'), value: oidcIdentity.name },
                { label: t('Email'), value: oidcIdentity.email },
                { label: t('Phone'), value: oidcIdentity.phone_number },
                { label: t('FAN'), value: oidcIdentity.fan },
                { label: t('FIN'), value: oidcIdentity.fin },
                { label: t('Verification Level'), value: oidcIdentity.verification_level },
                { label: t('Birthdate'), value: oidcIdentity.birthdate },
                { label: t('Gender'), value: oidcIdentity.gender },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value || '-'}</span>
                </div>
              ))}
            </div>
            <button onClick={async () => { try { await citizenService.unlinkFaydaOidc(); setOidcIdentity(null) } catch {} }}
              className="flex items-center justify-center gap-2 w-full border-2 border-red-200 text-red-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition">
              <Trash2 className="w-4 h-4" /> {t('Remove Fayda OIDC Link')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">{t('Verify your identity via Fayda')}</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  {t('Link your Fayda digital ID through the national OIDC system. Your name, FAN, and FIN will be automatically populated from the verified identity provider.')}
                </p>
              </div>
            </div>
            <button onClick={async () => {
              setOidcLinking(true)
              try {
                const res = await citizenService.linkFaydaOidc()
                setOidcIdentity(res)
              } catch {}
              setOidcLinking(false)
            }} disabled={oidcLinking}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {oidcLinking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><ExternalLink className="w-4 h-4" /> {t('Sign in with Fayda (OIDC)')}</>}
            </button>
            <p className="text-xs text-gray-400 text-center">{t('Link your identity with Fayda for enhanced verification.')}</p>
          </div>
        )}
      </motion.div>

      {/* id.et iframe section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600" /> {t('Ethiopian Digital ID Portal (id.et)')}</h3>
        <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ minHeight: '250px', height: '400px' }}>
          <iframe src="/api/proxy/bank?url=https%3A%2F%2Fid.et" className="w-full h-full border-0" title={t('id.et')} loading="lazy" referrerPolicy="no-referrer" />
        </div>
        <p className="text-xs text-gray-400 mt-3">{t('Powered by the Ethiopian Digital ID Program. Visit')} <a href="https://id.et" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">id.et</a> {t('for more information.')}</p>
      </motion.div>
    </div>
  )
}
