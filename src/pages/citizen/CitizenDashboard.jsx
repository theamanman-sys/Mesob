import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, ClipboardList, Upload, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, TrendingUp, FileCheck2, Building2, User, Scan, Camera, X, Image, RefreshCw, BadgeCheck, Hash, Globe, Wallet, Trophy, HeartHandshake, BarChart3, DollarSign, PiggyBank, Plus, Minus, Landmark, Target, Users, Ticket, Calendar, Shield, ExternalLink, Trash2, Fingerprint } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { createWorker } from 'tesseract.js'
import { useLanguage } from '../../context/LanguageContext'

function parseIdText(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const fields = {}
  const idPatterns = [
    { key: 'ID Number', patterns: [/ID[:\s]*([A-Z0-9\-]+)/i, /NO[.:\s]*([A-Z0-9\-]+)/i, /Number[:\s]*([A-Z0-9\-]+)/i] },
    { key: 'Full Name', patterns: [/Name[:\s]*(.+)/i, /Surname[:\s]*(\w+)/i] },
    { key: 'Date of Birth', patterns: [/(?:DOB|Birth|Born)[:\s]*([0-9\/\.\-]+)/i, /Date of Birth[:\s]*([0-9\/\.\-]+)/i] },
    { key: 'Expiry Date', patterns: [/(?:Exp|Expiry|Expiration|Valid Until)[:\s]*([0-9\/\.\-]+)/i] },
    { key: 'Nationality', patterns: [/Nationality[:\s]*(\w+)/i] },
    { key: 'Gender', patterns: [/Gender[:\s]*(\w)/i, /Sex[:\s]*(\w)/i] },
  ]
  for (const field of idPatterns) {
    for (const regex of field.patterns) {
      for (const line of lines) {
        const m = line.match(regex)
        if (m) { fields[field.key] = m[1].trim(); break }
      }
      if (fields[field.key]) break
    }
  }
  if (!fields['Full Name']) {
    const nameLines = lines.filter(l => /^[A-Z][a-z]+\s+[A-Z][a-z]/.test(l) && !/^\d/.test(l))
    if (nameLines.length > 0) fields['Full Name'] = nameLines[0].trim()
  }
  return fields
}

function IdScannerModal({ open, onClose }) {
  const { t } = useLanguage()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [captured, setCaptured] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState('environment')
  const [scanning, setScanning] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [showPreview, setShowPreview] = useState(false)

  const startCamera = async (facing = facingMode) => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
      if (videoRef.current) videoRef.current.srcObject = s
      setStream(s); setCameraActive(true)
    } catch { alert(t('Camera access denied')) }
  }
  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null); setCameraActive(false)
  }
  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    stopCamera(); setFacingMode(next)
    setTimeout(() => startCamera(next), 100)
  }
  const blobToDataUrl = (blob) => new Promise((resolve) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob)
  })
  const runOcr = async (blob) => {
    setScanning(true)
    try {
      const dataUrl = await blobToDataUrl(blob)
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(dataUrl)
      await worker.terminate()
      const parsed = parseIdText(data.text)
      setExtracted(parsed); setEditedData({ ...parsed })
    } catch { setExtracted(null); setEditedData({}) }
    setScanning(false)
  }
  const capture = () => {
    const video = videoRef.current; const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => { setCaptured(blob); setShowPreview(true); stopCamera(); runOcr(blob) }, 'image/png')
  }
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) { setCaptured(file); setShowPreview(true); runOcr(file) }
    e.target.value = ''
  }
  const handleUpload = async () => {
    if (!captured) return
    setUploading(true)
    try {
      const file = new File([captured], `id-scan-${Date.now()}.png`, { type: 'image/png' })
      const doc = await citizenService.uploadDocument(file, 'id', { extractedData: editedData })
      setCaptured(null); setExtracted(null); setEditedData({}); setShowPreview(false); onClose(doc)
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setUploading(false)
  }
  const handleClose = () => {
    stopCamera(); setCaptured(null); setExtracted(null); setEditedData({}); setShowPreview(false); onClose()
  }
  const handleRetake = () => { setCaptured(null); setExtracted(null); setEditedData({}); setShowPreview(false) }
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">{t('Scan ID Document')}</h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!cameraActive && !showPreview && (
            <div className="space-y-3">
              <button onClick={startCamera} className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition">
                <Camera className="w-8 h-8 text-blue-600" />
                <div className="text-left"><p className="font-semibold text-blue-700">{t('Open Camera')}</p><p className="text-sm text-blue-500">{t('Position ID in frame')}</p></div>
              </button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400">{t('OR')}</span></div></div>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition">
                <Image className="w-5 h-5 text-gray-500" />                <span className="text-sm text-gray-600 font-medium">{t('Upload from device')}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}
          {cameraActive && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-72 object-cover" />
                <div className="absolute inset-0 border-2 border-blue-400 rounded-xl pointer-events-none" />
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-2 border-dashed border-yellow-400/70 h-40 rounded-lg" />
              </div>
              <div className="flex gap-3">
                <button onClick={capture} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">{t('Capture')}</button>
                <button onClick={flipCamera} className="px-4 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={stopCamera} className="px-4 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          {showPreview && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-100"><img src={captured ? URL.createObjectURL(captured) : ''} alt={t('Captured ID')} className="w-full h-48 object-contain" /></div>
              {scanning && (
                <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">{t('Reading ID data...')}</span>
                </div>
              )}
              {!scanning && Object.keys(editedData).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><BadgeCheck className="w-4 h-4" /> {t('Extracted Information')}</p>
                  <p className="text-xs text-blue-600">{t('Edit fields if needed')}</p>
                  {Object.entries(editedData).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">{key}</label>
                      <input type="text" value={editedData[key] || ''} onChange={(e) => setEditedData(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white" />
                    </div>
                  ))}
                </div>
              )}
              {!scanning && Object.keys(editedData).length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-yellow-700 font-medium">{t('Could not read ID text')}</p>
                  <p className="text-xs text-yellow-600">{t('Enter details manually')}</p>
                  {[t('Full Name'), t('ID Number'), t('Date of Birth')].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-semibold text-yellow-700 mb-1">{field}</label>
                      <input type="text" value={editedData[field] || ''} onChange={(e) => setEditedData(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-yellow-300 text-sm text-gray-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none bg-white" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleUpload} disabled={uploading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {uploading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('Uploading...')}</>
                    : <>                <Upload className="w-4 h-4" /> {t('Upload to Documents')}</>}
                </button>
                <button onClick={handleRetake} className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">{t('Retake')}</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

function ContributionModal({ open, onClose, departments }) {
  const { t } = useLanguage()
  const [amount, setAmount] = useState('')
  const [department, setDepartment] = useState(departments[0] || 'General')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setLoading(true)
    try {
      await citizenService.submitContribution(department, Number(amount), message)
      onClose(true)
    } catch { alert(t('Failed to submit contribution')) }
    setLoading(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-red-500" /> {t('Contribute to Department')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Department')}</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
               <option value="General">{t('General')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Amount (ETB)')}</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder={t('Enter amount')} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Message (optional)')}</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder={t('Supporting our community')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition">
              {loading ? t('Submitting...') : t('Submit Contribution')}
            </button>
            <button type="button" onClick={() => onClose(false)}
              className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">{t('Cancel')}</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function NetWorthModal({ open, onClose, current, onSave }) {
  const { t } = useLanguage()
  const [netWorth, setNetWorth] = useState(current?.netWorth || '')

  useEffect(() => {
    if (open) setNetWorth(current?.netWorth || '')
  }, [open, current])

  const handleSave = () => {
    onSave(Number(netWorth) || 0)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-green-600" /> {t('Update Net Worth')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('Enter your total net worth to track your ranking')}</p>
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">{t('etb')}</span>
          <input type="number" value={netWorth} onChange={(e) => setNetWorth(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-bold" placeholder={t('Enter net worth')} />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition">{t('Save')}</button>
          <button onClick={() => onClose()} className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">{t('Cancel')}</button>
        </div>
      </motion.div>
    </div>
  )
}

function FaydaOidcModal({ open, onClose, oidcIdentity, onLink, onUnlink, linking }) {
  const { t } = useLanguage()

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {oidcIdentity ? (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('Fayda OIDC Verified')}</h2>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-green-500" />
                  {t('Identity verified via Fayda')}
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-5">
              <InfoRow label={t('Full Name')} value={oidcIdentity.name} />
              <InfoRow label={t('Email')} value={oidcIdentity.email} />
              <InfoRow label={t('Phone')} value={oidcIdentity.phone_number} />
              <InfoRow label={t('FAN')} value={oidcIdentity.fan} />
              <InfoRow label={t('FIN')} value={oidcIdentity.fin} />
              <InfoRow label={t('Verification Level')} value={oidcIdentity.verification_level} />
              <InfoRow label={t('Verified At')} value={new Date(oidcIdentity.verified_at).toLocaleString()} />
            </div>
            <button onClick={onUnlink}
              className="flex items-center justify-center gap-2 w-full border-2 border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition">
              <Trash2 className="w-4 h-4" /> {t('Remove Fayda Link')}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('Verify with Fayda')}</h2>
                <p className="text-xs text-gray-500">{t('Link your National Digital ID via Fayda OIDC')}</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-blue-800 font-medium mb-2">{t('Why verify with Fayda?')}</p>
              <ul className="text-xs text-blue-700 space-y-1.5">
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {t('Get verified identity from the national ID system')}</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {t('Auto-populate your FAN and FIN numbers')}</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {t('Higher trust level for government services')}</li>
              </ul>
            </div>
            <button onClick={onLink} disabled={linking}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {linking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Fingerprint className="w-4 h-4" /> {t('Sign in with Fayda')}</>}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">{t('You will be redirected to Fayda to authenticate')}</p>
          </>
        )}
        <button onClick={() => onClose()}
          className="w-full mt-3 px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-50 transition">{t('Close')}</button>
      </motion.div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value || '-'}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, bg, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <TrendingUp className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  )
}

const DEPARTMENTS = ['Ministry of Trade', 'Immigration Service', 'Ministry of Revenues', 'National ID Program', 'Ministry of Labor', 'Ministry of Health', 'Education Authority']

export default function CitizenDashboard() {
  const { t } = useLanguage()
  const [citizen, setCitizen] = useState(null)
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [scannerOpen, setScannerOpen] = useState(false)
  const [netWorthData, setNetWorthData] = useState(null)
  const [rankings, setRankings] = useState([])
  const [economyData, setEconomyData] = useState(null)
  const [contribStats, setContribStats] = useState(null)
  const [userContribs, setUserContribs] = useState([])
  const [tickets, setTickets] = useState([])
  const [netWorthModal, setNetWorthModal] = useState(false)
  const [contribModal, setContribModal] = useState(false)
  const [contribSuccess, setContribSuccess] = useState(false)
  const [oidcIdentity, setOidcIdentity] = useState(null)
  const [oidcModal, setOidcModal] = useState(false)
  const [oidcLinking, setOidcLinking] = useState(false)

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) {
      setCitizen(session)
      citizenService.getApplications().then(setApplications).catch(() => {})
      citizenService.getDocuments().then(setDocuments).catch(() => {})
      citizenService.getNetWorth().then(setNetWorthData).catch(() => {})
      citizenService.getNetWorthRankings().then(setRankings).catch(() => {})
      citizenService.getEconomyData().then(setEconomyData).catch(() => {})
      citizenService.getContributionStats().then(setContribStats).catch(() => {})
      citizenService.getContributions().then(setUserContribs).catch(() => {})
      citizenService.getMyTickets().then(setTickets).catch(() => {})
      citizenService.getFaydaOidcStatus().then(setOidcIdentity).catch(() => {})
    }
  }, [])

  const handleNetWorthSave = async (value) => {
    try {
      const updated = await citizenService.updateNetWorth(value, [], [])
      setNetWorthData(updated)
      setNetWorthModal(false)
      const r = await citizenService.getNetWorthRankings()
      setRankings(r)
    } catch { alert(t('Failed to update net worth')) }
  }

  const handleContribClose = (success) => {
    setContribModal(false)
    if (success) {
      setContribSuccess(true)
      citizenService.getContributionStats().then(setContribStats).catch(() => {})
      citizenService.getContributions().then(setUserContribs).catch(() => {})
      setTimeout(() => setContribSuccess(false), 3000)
    }
  }

  const handleOidcLink = async () => {
    setOidcLinking(true)
    try {
      const res = await citizenService.linkFaydaOidc()
      setOidcIdentity(res)
    } catch { alert(t('Failed to link Fayda identity')) }
    setOidcLinking(false)
  }

  const handleOidcUnlink = async () => {
    try {
      await citizenService.unlinkFaydaOidc()
      setOidcIdentity(null)
    } catch { alert(t('Failed to unlink Fayda identity')) }
  }

  if (!citizen) return null

  const stats = [
    { icon: FileText, label: t('Applications'), value: applications.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: CheckCircle, label: t('Approved'), value: applications.filter(a => a.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Clock, label: t('Pending'), value: applications.filter(a => a.status === 'submitted' || a.status === 'processing').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: Ticket, label: t('Tickets'), value: tickets.length, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  const statusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  const topRankers = rankings.filter(r => r.netWorth > 0).sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0)).slice(0, 10)
  const wealthDistTotal = topRankers.reduce((s, r) => s + (r.netWorth || 0), 0)
  const userShare = netWorthData?.netWorth && wealthDistTotal ? ((netWorthData.netWorth / wealthDistTotal) * 100).toFixed(2) : 0

  return (
    <div>
      <IdScannerModal open={scannerOpen} onClose={(doc) => { setScannerOpen(false); if (doc) setDocuments(prev => [doc, ...prev]) }} />
      <NetWorthModal open={netWorthModal} onClose={() => setNetWorthModal(false)} current={netWorthData} onSave={handleNetWorthSave} />
      <ContributionModal open={contribModal} onClose={handleContribClose} departments={DEPARTMENTS} />
      <FaydaOidcModal open={oidcModal} onClose={() => setOidcModal(false)}
        oidcIdentity={oidcIdentity} onLink={handleOidcLink} onUnlink={handleOidcUnlink} linking={oidcLinking} />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('Welcome back, {name}', { name: citizen.firstName })}</h1>
          <p className="text-gray-500 mt-1">{t('Your personal citizen portal overview')}</p>
        </div>
        {oidcIdentity && (
          <button onClick={() => setOidcModal(true)}
            className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-green-100 transition shrink-0">
            <BadgeCheck className="w-3.5 h-3.5" />
            {t('Fayda Verified')}
          </button>
        )}
      </div>

      {contribSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{t('Thank you! Your contribution has been submitted successfully.')}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.05} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-6 text-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <h2 className="font-bold">{t('Net Worth')}</h2>
            </div>
            <button onClick={() => setNetWorthModal(true)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition">{t('Update')}</button>
          </div>
          <p className="text-3xl font-black mb-1">{netWorthData?.netWorth?.toLocaleString() || 0} ETB</p>
          <div className="flex items-center gap-2 text-green-200 text-sm mb-4">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>{t('Rank')} #{netWorthData?.rank || '-'} {t('of')} {netWorthData?.totalParticipants || 0} {t('participants')}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-green-200 mb-1">{t('Your share of top wealth')}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(Number(userShare), 100)}%` }} />
              </div>
              <span className="text-xs font-bold">{userShare}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> {t('Ethiopian Economy')}
          </h2>
          {economyData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-semibold">{t('GDP')}</p>
                  <p className="text-lg font-black text-gray-900">${economyData.gdp}B</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-semibold">{t('Growth')}</p>
                  <p className="text-lg font-black text-gray-900">{economyData.gdpGrowth}%</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-xs text-yellow-600 font-semibold">{t('Population')}</p>
                  <p className="text-lg font-black text-gray-900">{economyData.population}M</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-600 font-semibold">{t('GDP per Capita')}</p>
                  <p className="text-lg font-black text-gray-900">${economyData.gdpPerCapita}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">{economyData.description}</div>
              <div className="space-y-1">
                {Object.entries(economyData.sectors || {}).map(([sector, pct]) => (
                  <div key={sector} className="flex items-center gap-2">
                    <span className="text-xs capitalize text-gray-600 w-20">{sector}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sector === 'agriculture' ? 'bg-green-500' : sector === 'industry' ? 'bg-blue-500' : 'bg-purple-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">{t('Loading economy data...')}</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-red-500" /> {t('Contributions')}
            </h2>
            <button onClick={() => setContribModal(true)}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold transition">{t('Donate')}</button>
          </div>
          <div className="space-y-3 mb-4">
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-600 font-semibold">{t('Total Contributions')}</p>
              <p className="text-xl font-black text-gray-900">{contribStats?.totalContributions?.toLocaleString() || 0} ETB</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-600 font-semibold">{t('Your Contributions')}</p>
              <p className="text-xl font-black text-gray-900">{userContribs.reduce((s, c) => s + (c.amount || 0), 0).toLocaleString()} ETB</p>
            </div>
          </div>
          {contribStats?.byDepartment && Object.keys(contribStats.byDepartment).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">{t('By Department')}</p>
              {Object.entries(contribStats.byDepartment).slice(0, 4).map(([dept, amt]) => (
                <div key={dept} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-600 truncate max-w-[100px] sm:max-w-[140px]">{dept}</span>
                  <span className="text-xs font-bold text-gray-900">{amt.toLocaleString()} ETB</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {topRankers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> {t('Wealth Distribution Board — Top Ranked')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 rounded-xl">
                  <th className="text-left p-3 font-semibold text-gray-600">{t('Rank')}</th>
                  <th className="text-left p-3 font-semibold text-gray-600">{t('Name')}</th>
                  <th className="text-right p-3 font-semibold text-gray-600">{t('Net Worth (ETB)')}</th>
                  <th className="text-right p-3 font-semibold text-gray-600">{t('Share')}</th>
                </tr>
              </thead>
              <tbody>
                {topRankers.map((r, i) => {
                  const pct = wealthDistTotal ? ((r.netWorth / wealthDistTotal) * 100).toFixed(2) : 0
                  return (
                    <tr key={r.id || i} className={`border-t border-gray-100 ${r.citizenId === citizen?.id ? 'bg-yellow-50' : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {i === 0 ? <Trophy className="w-4 h-4 text-yellow-500" /> : i === 1 ? <Trophy className="w-4 h-4 text-gray-400" /> : i === 2 ? <Trophy className="w-4 h-4 text-orange-500" /> : <span className="text-gray-400 w-4 text-center">{i + 1}</span>}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-900">{r.displayName || r.fullName || r.email} {r.citizenId === citizen?.id ? t('(You)') : ''}</td>
                      <td className="p-3 text-right font-bold text-gray-900">{r.netWorth?.toLocaleString() || 0}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(Number(pct) * 3, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{t('Recent Applications')}</h2>
            <Link to="/citizen/applications" className="text-sm text-blue-600 font-medium hover:underline">{t('View all')}</Link>
          </div>
          <div className="p-5">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('No applications yet')}</p>
                <Link to="/citizen/services" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">{t('Browse services')} →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Building2 className="w-8 h-8 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{app.serviceTitle}</p>
                        <p className="text-xs text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusIcon(app.status)}
                      <span className="text-xs font-medium capitalize text-gray-600">{app.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">{t('Quick Actions')}</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { icon: Scan, label: t('Scan ID'), desc: t('Capture your ID with camera'), action: () => setScannerOpen(true), color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Wallet, label: t('Update Net Worth'), desc: t('Track your wealth & ranking'), action: () => setNetWorthModal(true), color: 'text-green-600', bg: 'bg-green-50' },
              { icon: HeartHandshake, label: t('Contribute'), desc: t('Support a department'), action: () => setContribModal(true), color: 'text-red-600', bg: 'bg-red-50' },
              { icon: ClipboardList, label: t('Browse Services'), desc: t('Explore government services'), to: '/citizen/services', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: FileText, label: t('My Applications'), desc: t('Track submissions'), to: '/citizen/applications', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Shield, label: t('Verify National ID'), desc: t('Link your Fayda digital ID'), action: () => setOidcModal(true), color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((item, i) => (
              item.action ? (
                <button key={i} onClick={item.action}
                  className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-gray-50 transition group text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition" />
                </button>
              ) : (
                <Link key={item.to} to={item.to}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition" />
                </Link>
              )
            ))}
          </div>
        </motion.div>
      </div>

      {tickets.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-600" /> {t('My Appointment Tickets')}
          </h2>
          <div className="space-y-3">
            {tickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700">{ticket.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ticket.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{ticket.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{ticket.serviceTitle}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{ticket.appointmentDate ? new Date(ticket.appointmentDate).toLocaleDateString() : t('TBD')}</span>
                    <Clock className="w-3 h-3" />
                    <span>{ticket.appointmentTime || t('TBD')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-purple-700">{ticket.fee?.toLocaleString()} ETB</p>
                  <p className="text-xs text-gray-500">{t('Fee')}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}