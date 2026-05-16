import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, ClipboardList, Upload, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, TrendingUp, FileCheck2, Building2, User, Scan, Camera, X, Image, RefreshCw, BadgeCheck, Hash, Globe, Wallet, Trophy, HeartHandshake, BarChart3, DollarSign, PiggyBank, Plus, Minus, Landmark, Target, Users, Ticket, Calendar } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { createWorker } from 'tesseract.js'

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
    } catch { alert('Camera access denied or not available.') }
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
          <h2 className="font-bold text-lg text-gray-900">Scan ID Document</h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!cameraActive && !showPreview && (
            <div className="space-y-3">
              <button onClick={startCamera} className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition">
                <Camera className="w-8 h-8 text-blue-600" />
                <div className="text-left"><p className="font-semibold text-blue-700">Open Camera</p><p className="text-sm text-blue-500">Position your ID in the frame</p></div>
              </button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400">or</span></div></div>
              <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition">
                <Image className="w-5 h-5 text-gray-500" /><span className="text-sm text-gray-600 font-medium">Upload from device</span>
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
                <button onClick={capture} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">Capture</button>
                <button onClick={flipCamera} className="px-4 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={stopCamera} className="px-4 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          {showPreview && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-100"><img src={captured ? URL.createObjectURL(captured) : ''} alt="Captured ID" className="w-full h-48 object-contain" /></div>
              {scanning && (
                <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Reading ID data...</span>
                </div>
              )}
              {!scanning && Object.keys(editedData).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><BadgeCheck className="w-4 h-4" /> Extracted Information</p>
                  <p className="text-xs text-blue-600">Edit the fields if needed before uploading.</p>
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
                  <p className="text-sm text-yellow-700 font-medium">Could not read ID text.</p>
                  <p className="text-xs text-yellow-600">Enter the details manually:</p>
                  {['Full Name', 'ID Number', 'Date of Birth'].map((field) => (
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
                  {uploading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading</>
                    : <><Upload className="w-4 h-4" /> Upload to Documents</>}
                </button>
                <button onClick={handleRetake} className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">Retake</button>
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
    } catch { alert('Failed to submit contribution') }
    setLoading(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-red-500" /> Contribute to a Department</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none">
              {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (ETB)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="1000" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Supporting our community..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition">
              {loading ? 'Submitting...' : 'Submit Contribution'}
            </button>
            <button type="button" onClick={() => onClose(false)}
              className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">Cancel</button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function NetWorthModal({ open, onClose, current, onSave }) {
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
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-green-600" /> Update Net Worth</h2>
        <p className="text-sm text-gray-500 mb-4">Enter your estimated total net worth (assets minus liabilities). This data is private and used for ranking.</p>
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">ETB</span>
          <input type="number" value={netWorth} onChange={(e) => setNetWorth(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-bold" placeholder="0" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition">Save</button>
          <button onClick={() => onClose()} className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">Cancel</button>
        </div>
      </motion.div>
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
      citizenService.getTickets().then(setTickets).catch(() => {})
    }
  }, [])

  const handleNetWorthSave = async (value) => {
    try {
      const updated = await citizenService.updateNetWorth(value, [], [])
      setNetWorthData(updated)
      setNetWorthModal(false)
      const r = await citizenService.getNetWorthRankings()
      setRankings(r)
    } catch { alert('Failed to update net worth') }
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

  if (!citizen) return null

  const stats = [
    { icon: FileText, label: 'Applications', value: applications.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: CheckCircle, label: 'Approved', value: applications.filter(a => a.status === 'approved').length, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Clock, label: 'Pending', value: applications.filter(a => a.status === 'submitted' || a.status === 'processing').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: Ticket, label: 'Tickets', value: tickets.length, color: 'text-purple-600', bg: 'bg-purple-50' },
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

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Welcome back, {citizen.firstName}!</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your citizen portal.</p>
      </div>

      {contribSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">Thank you! Your contribution has been submitted successfully.</p>
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
              <h2 className="font-bold">Net Worth</h2>
            </div>
            <button onClick={() => setNetWorthModal(true)}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition">Update</button>
          </div>
          <p className="text-3xl font-black mb-1">{netWorthData?.netWorth?.toLocaleString() || 0} ETB</p>
          <div className="flex items-center gap-2 text-green-200 text-sm mb-4">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>Rank #{netWorthData?.rank || '-'} of {netWorthData?.totalParticipants || 0} participants</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-green-200 mb-1">Your share of top wealth</p>
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
            <BarChart3 className="w-5 h-5 text-blue-600" /> Ethiopia Economy
          </h2>
          {economyData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-semibold">GDP</p>
                  <p className="text-lg font-black text-gray-900">${economyData.gdp}B</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-semibold">Growth</p>
                  <p className="text-lg font-black text-gray-900">{economyData.gdpGrowth}%</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3">
                  <p className="text-xs text-yellow-600 font-semibold">Population</p>
                  <p className="text-lg font-black text-gray-900">{economyData.population}M</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-600 font-semibold">GDP/Capita</p>
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
            <div className="text-center py-6 text-gray-400 text-sm">Loading economy data...</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-red-500" /> Contributions
            </h2>
            <button onClick={() => setContribModal(true)}
              className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold transition">Donate</button>
          </div>
          <div className="space-y-3 mb-4">
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-600 font-semibold">Total Contributions</p>
              <p className="text-xl font-black text-gray-900">{contribStats?.totalContributions?.toLocaleString() || 0} ETB</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-600 font-semibold">Your Contributions</p>
              <p className="text-xl font-black text-gray-900">{userContribs.reduce((s, c) => s + (c.amount || 0), 0).toLocaleString()} ETB</p>
            </div>
          </div>
          {contribStats?.byDepartment && Object.keys(contribStats.byDepartment).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">By Department</p>
              {Object.entries(contribStats.byDepartment).slice(0, 4).map(([dept, amt]) => (
                <div key={dept} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-600 truncate max-w-[140px]">{dept}</span>
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
            <Trophy className="w-5 h-5 text-yellow-500" /> Wealth Distribution Board — Top Ranked
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 rounded-xl">
                  <th className="text-left p-3 font-semibold text-gray-600">Rank</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Name</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Net Worth (ETB)</th>
                  <th className="text-right p-3 font-semibold text-gray-600">Share</th>
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
                      <td className="p-3 font-medium text-gray-900">{r.displayName || r.fullName || r.email} {r.citizenId === citizen?.id ? '(You)' : ''}</td>
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
            <h2 className="font-bold text-gray-900">Recent Applications</h2>
            <Link to="/citizen/applications" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="p-5">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No applications yet</p>
                <Link to="/citizen/services" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">Browse services →</Link>
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
            <h2 className="font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { icon: Scan, label: 'Scan ID', desc: 'Capture your ID with camera', action: () => setScannerOpen(true), color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Wallet, label: 'Update Net Worth', desc: 'Track your wealth & ranking', action: () => setNetWorthModal(true), color: 'text-green-600', bg: 'bg-green-50' },
              { icon: HeartHandshake, label: 'Contribute', desc: 'Support a department', action: () => setContribModal(true), color: 'text-red-600', bg: 'bg-red-50' },
              { icon: ClipboardList, label: 'Browse Services', desc: 'Explore government services', to: '/citizen/services', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: FileText, label: 'My Applications', desc: 'Track submissions', to: '/citizen/applications', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: User, label: 'Update Profile', desc: 'Manage personal info', to: '/citizen/profile', color: 'text-orange-600', bg: 'bg-orange-50' },
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
            <Ticket className="w-5 h-5 text-purple-600" /> My Appointment Tickets
          </h2>
          <div className="space-y-3">
            {tickets.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-purple-700">{t.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{t.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{t.serviceTitle}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{t.appointmentDate ? new Date(t.appointmentDate).toLocaleDateString() : 'TBD'}</span>
                    <Clock className="w-3 h-3" />
                    <span>{t.appointmentTime || 'TBD'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-purple-700">{t.fee?.toLocaleString()} ETB</p>
                  <p className="text-xs text-gray-500">Fee</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}