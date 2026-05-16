import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, ClipboardList, Upload, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, TrendingUp, FileCheck2, Building2, User, Scan, Camera, X, Image, RefreshCw, BadgeCheck, Hash, Globe } from 'lucide-react'
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
        if (m) {
          fields[field.key] = m[1].trim()
          break
        }
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
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing }
      })
      if (videoRef.current) videoRef.current.srcObject = s
      setStream(s)
      setCameraActive(true)
    } catch (e) {
      alert('Camera access denied or not available.')
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraActive(false)
  }

  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    stopCamera()
    setFacingMode(next)
    setTimeout(() => startCamera(next), 100)
  }

  const blobToDataUrl = (blob) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })

  const runOcr = async (blob) => {
    setScanning(true)
    try {
      const dataUrl = await blobToDataUrl(blob)
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(dataUrl)
      await worker.terminate()
      const parsed = parseIdText(data.text)
      setExtracted(parsed)
      setEditedData({ ...parsed })
    } catch {
      setExtracted(null)
      setEditedData({})
    }
    setScanning(false)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      setCaptured(blob)
      setShowPreview(true)
      stopCamera()
      runOcr(blob)
    }, 'image/png')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCaptured(file)
      setShowPreview(true)
      runOcr(file)
    }
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!captured) return
    setUploading(true)
    try {
      const file = new File([captured], `id-scan-${Date.now()}.png`, { type: 'image/png' })
      const doc = await citizenService.uploadDocument(file, 'id', { extractedData: editedData })
      setCaptured(null)
      setExtracted(null)
      setEditedData({})
      setShowPreview(false)
      onClose(doc)
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setUploading(false)
  }

  const handleClose = () => {
    stopCamera()
    setCaptured(null)
    setExtracted(null)
    setEditedData({})
    setShowPreview(false)
    onClose()
  }

  const handleRetake = () => {
    setCaptured(null)
    setExtracted(null)
    setEditedData({})
    setShowPreview(false)
  }

  const extractedEntries = extracted ? Object.entries(extracted).filter(([, v]) => v) : []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">Scan ID Document</h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!cameraActive && !showPreview && (
            <div className="space-y-3">
              <button onClick={startCamera}
                className="w-full flex items-center justify-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 transition">
                <Camera className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-blue-700">Open Camera</p>
                  <p className="text-sm text-blue-500">Position your ID in the frame</p>
                </div>
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400">or</span></div>
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition">
                <Image className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">Upload from device</span>
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
                <button onClick={capture}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                  Capture
                </button>
                <button onClick={flipCamera}
                  className="px-4 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={stopCamera}
                  className="px-4 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {showPreview && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-gray-100">
                <img src={captured ? URL.createObjectURL(captured) : ''} alt="Captured ID" className="w-full h-48 object-contain" />
              </div>

              {scanning && (
                <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Reading ID data...</span>
                </div>
              )}

              {!scanning && Object.keys(editedData).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" /> Extracted Information
                  </p>
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
                  {uploading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Upload to Documents</>
                  )}
                </button>
                <button onClick={handleRetake}
                  className="px-6 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default function CitizenDashboard() {
  const [citizen, setCitizen] = useState(null)
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) {
      setCitizen(session)
      citizenService.getApplications().then(setApplications).catch(() => {})
      citizenService.getDocuments().then(setDocuments).catch(() => {})
    }
  }, [])

  if (!citizen) return null

  const stats = [
    { icon: FileText, label: 'Applications', value: applications.length, color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { icon: CheckCircle, label: 'Approved', value: applications.filter(a => a.status === 'approved').length, color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
    { icon: Clock, label: 'Pending', value: applications.filter(a => a.status === 'submitted' || a.status === 'processing').length, color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { icon: Upload, label: 'Documents', value: documents.length, color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' }
  ]

  const statusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div>
      <IdScannerModal open={scannerOpen} onClose={(doc) => {
        setScannerOpen(false)
        if (doc) setDocuments(prev => [doc, ...prev])
      }} />

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Welcome back, {citizen.firstName}!</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your citizen portal.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
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
                <Link to="/citizen/services" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
                  Browse services →
                </Link>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { icon: Scan, label: 'Scan ID', desc: 'Capture your ID with camera or upload', action: () => setScannerOpen(true), color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: ClipboardList, label: 'Browse Services', desc: 'Explore all government services', to: '/citizen/services', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: FileText, label: 'My Applications', desc: 'Track your submitted applications', to: '/citizen/applications', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Upload, label: 'Upload Document', desc: 'Add documents to your profile', to: '/citizen/documents', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: User, label: 'Update Profile', desc: 'Manage your personal information', to: '/citizen/profile', color: 'text-orange-600', bg: 'bg-orange-50' }
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
    </div>
  )
}
