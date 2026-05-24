import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, FileText, Scan, CreditCard, BookOpen, Building2, Shield, FileSignature, Loader2, CheckCircle, X, Camera, Fingerprint, Eye, Image, Webcam, Save } from 'lucide-react'
import Tesseract from 'tesseract.js'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

const docTypes = [
  { id: 'driving', label: 'Driving License', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'school', label: 'School Documents', icon: BookOpen, color: 'bg-green-500' },
  { id: 'hospital', label: 'Hospital Documents', icon: FileText, color: 'bg-red-500' },
  { id: 'cards', label: 'ID Cards', icon: CreditCard, color: 'bg-purple-500' },
  { id: 'ownership', label: 'Ownership Documents', icon: Building2, color: 'bg-yellow-500' },
  { id: 'insurance', label: 'Insurance Papers', icon: Shield, color: 'bg-indigo-500' },
  { id: 'legal', label: 'Legal Documents', icon: FileSignature, color: 'bg-gray-600' },
  { id: 'other', label: 'Other', icon: FileText, color: 'bg-teal-500' },
]

const scanners = [
  { id: 'face', label: 'Face ID', icon: Eye, color: 'bg-rose-500', desc: 'Facial recognition' },
  { id: 'fingerprint', label: 'Fingerprint', icon: Fingerprint, color: 'bg-amber-500', desc: 'Biometric scan' },
]

function parseOcrText(text) {
  const lines = text.split('\n').filter(Boolean)
  const fields = {}
  lines.forEach((line) => {
    const parts = line.split(/[:|]\s*/)
    if (parts.length >= 2) {
      fields[parts[0].trim()] = parts.slice(1).join(' ').trim()
    } else if (!fields['content']) {
      fields['content'] = line.trim()
    } else {
      fields['content'] += ' ' + line.trim()
    }
  })
  if (Object.keys(fields).length === 0 && lines.length > 0) {
    fields['content'] = lines.join(' ')
  }
  return fields
}

function autoDetectType(text) {
  const lower = text.toLowerCase()
  if (/\b(license|licence|driving|driver|dl\s*no)\b/.test(lower)) return 'driving'
  if (/\b(school|student|university|college|grade|class|transcript|diploma)\b/.test(lower)) return 'school'
  if (/\b(hospital|medical|doctor|patient|clinic|diagnosis|prescription)\b/.test(lower)) return 'hospital'
  if (/\b(id|identity|national|fayda|passport|card|number)\b/.test(lower)) return 'cards'
  if (/\b(property|deed|title|ownership|land|house)\b/.test(lower)) return 'ownership'
  if (/\b(insurance|policy|premium|coverage|claim)\b/.test(lower)) return 'insurance'
  if (/\b(legal|court|law|contract|agreement|affidavit)\b/.test(lower)) return 'legal'
  return 'other'
}

export default function AdminDocumentScanner() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('scan')
  const [files, setFiles] = useState([])
  const [scanned, setScanned] = useState([])
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState('')
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [pendingType, setPendingType] = useState(null)
  const [cameraMode, setCameraMode] = useState(false)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  useEffect(() => {
    if (cameraMode && stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [cameraMode, stream])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
      setStream(s)
      setCameraMode(true)
    } catch (err) {
      alert('Camera access denied or unavailable: ' + err.message)
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop())
    setStream(null)
    setCameraMode(false)
  }

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        processOcr(blob, 'other', true)
        stopCamera()
      }
    }, 'image/jpeg', 0.95)
  }

  const handleScanClick = (type) => {
    setPendingType(type)
    fileInputRef.current?.click()
  }

  const processOcr = useCallback(async (file, type, isCamera = false) => {
    setScanning(true)
    setScanProgress(0)
    setScanStatus('Processing...')
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      const { data } = await Tesseract.recognize(file, 'eng+amh', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100))
            setScanStatus(`Processing... ${Math.round(m.progress * 100)}%`)
          } else if (m.status === 'loading tesseract core') {
            setScanStatus('Loading...')
          } else if (m.status === 'initializing tesseract') {
            setScanStatus('Initializing...')
          } else if (m.status === 'loading language traineddata') {
            setScanStatus('Loading language data...')
          } else {
            setScanStatus(m.status)
          }
        }
      })

      const detectedType = isCamera ? autoDetectType(data.text) : type
      const fields = parseOcrText(data.text)
      const docLabel = docTypes.find((d) => d.id === detectedType)?.label || 'Unknown'
      const entry = {
        id: Date.now().toString(36),
        type: detectedType,
        date: new Date().toLocaleDateString(),
        status: 'completed',
        text: data.text,
        confidence: Math.round(data.confidence),
        fields,
        preview: previewUrl,
        fileName: isCamera ? `camera_capture_${Date.now()}.jpg` : file.name,
        detected: isCamera ? `Auto-detected: ${docLabel}` : null,
      }
      setScanned((prev) => [entry, ...prev])
      setScanStatus('Complete!')
    } catch (err) {
      setScanStatus(`Error: ${err.message}`)
    }
    setScanning(false)
  }, [])

  const handleFilePick = (e) => {
    const file = e.target.files?.[0]
    if (!file || !pendingType) return
    setFiles((prev) => [...prev, { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() }])
    processOcr(file, pendingType)
    setPendingType(null)
    e.target.value = ''
  }

  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files)
    newFiles.forEach((f) => setFiles((prev) => [...prev, { name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() }]))
    e.target.value = ''
  }

  const handleRemoveScan = (id) => {
    setScanned((prev) => {
      const entry = prev.find((s) => s.id === id)
      if (entry?.preview) URL.revokeObjectURL(entry.preview)
      return prev.filter((s) => s.id !== id)
    })
  }

  const handleRemoveFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFilePick} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {cameraMode && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-black/90">
            <h2 className="text-white font-semibold text-lg">Document Scanner</h2>
            <button onClick={stopCamera} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 h-48">
                <div className="absolute inset-0 border-2 border-white/40 rounded-2xl" />
                <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-2xl" />
                <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-2xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-2xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-2xl" />
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 text-xs px-4 py-1.5 rounded-full whitespace-nowrap">
              Position ID card inside the frame
            </div>
          </div>
          <div className="px-6 py-8 flex justify-center items-center gap-8 bg-black/90">
            <button onClick={stopCamera} className="text-white/60 hover:text-white text-sm font-medium transition">
              Cancel
            </button>
            <button onClick={captureFromCamera} className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-white/20">
              <div className="w-16 h-16 rounded-full border-[3px] border-blue-600 flex items-center justify-center">
                <Camera className="w-7 h-7 text-blue-600" />
              </div>
            </button>
            <div className="w-14" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Scan className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Scanner</h1>
        {scanned.length > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">{scanned.length} scanned</span>}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['scan', 'camera', 'upload', 'history'].map((tab) => (
          <button key={tab} onClick={() => { if (tab === 'camera') { startCamera(); setActiveTab('camera'); return }; setActiveTab(tab) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === 'camera' ? 'bg-rose-600 text-white hover:bg-rose-700' : activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            {tab === 'camera' ? <Camera className="w-4 h-4 inline mr-1" /> : tab === 'scan' ? <Scan className="w-4 h-4 inline mr-1" /> : <Upload className="w-4 h-4 inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'scan' && (
        <div>
          {scanning && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{scanStatus}</p>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400 mb-4">Select document type to scan:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {docTypes.map((dt) => (
              <button key={dt.id} onClick={() => handleScanClick(dt.id)} disabled={scanning}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-40 disabled:cursor-not-allowed">
                <div className={`p-3 rounded-full ${dt.color} text-white`}><dt.icon className="w-6 h-6" /></div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{dt.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Biometric & Identity Scanners:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {scanners.map((s) => (
                <button key={s.id} disabled
                  className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed relative">
                  <div className={`p-3 rounded-full ${s.color} text-white`}><s.icon className="w-6 h-6" /></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.label}</span>
                  <span className="text-xs text-gray-400">{s.desc}</span>
                  <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Coming</span>
                </button>
              ))}
            </div>
          </div>

          {scanned.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Scan Results</h3>
              <div className="space-y-4">
                {scanned.map((s) => (
                  <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${docTypes.find((d) => d.id === s.type)?.color || 'bg-gray-500'} text-white`}>
                          {(() => { const Icon = docTypes.find((d) => d.id === s.type)?.icon || FileText; return <Icon className="w-4 h-4" /> })()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{s.type} Document</p>
                          <p className="text-xs text-gray-400">{s.date} &middot; {s.fileName}</p>
                          {s.detected && <p className="text-xs text-green-600 mt-0.5">{s.detected}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {s.confidence}%
                        </span>
                        <button onClick={async () => { try { await api.post('/admin/documents', { documentType: s.type, text: s.text, confidence: s.confidence, fields: s.fields, fileName: s.fileName }); showToast('Saved to documents', 'success') } catch { showToast('Failed to save', 'error') } }} className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500 transition">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemoveScan(s.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {s.preview && (
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <img src={s.preview} alt="Scan preview" className="h-32 w-auto object-contain rounded-lg bg-gray-100 dark:bg-gray-900" />
                      </div>
                    )}
                    {Object.keys(s.fields).length > 0 && (
                      <div className="p-4 space-y-2">
                        {Object.entries(s.fields).map(([key, val]) => (
                          <div key={key} className="flex gap-2 text-sm">
                            <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[120px] capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-gray-900 dark:text-gray-100">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {s.text && (
                      <div className="px-4 pb-4">
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">Raw text</summary>
                          <p className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{s.text}</p>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div>
          <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Drop files or click to upload</p>
            <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG up to 20MB</p>
            <input type="file" multiple accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
          </label>
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Uploaded Files</h3>
                <button onClick={async () => { try { await Promise.all(files.map(f => api.post('/admin/documents', { documentType: 'other', fileName: f.name, text: '' }))); showToast('All files saved', 'success'); setFiles([]) } catch { showToast('Failed to save files', 'error') } }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><Save className="w-3.5 h-3.5" /> Save All</button>
              </div>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{f.name}</p>
                      <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveFile(i)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          {scanned.length === 0 ? <p>No scan history yet</p> : (
            <div className="space-y-3 text-left max-w-lg mx-auto">
              {scanned.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">{s.type} Document</p>
                    <p className="text-xs text-gray-400">{s.date}</p>
                  </div>
                  <span className="text-xs text-green-600">{s.confidence}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
