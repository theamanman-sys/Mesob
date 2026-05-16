import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, Shield, Upload, CheckCircle, XCircle, Clock, AlertCircle, FileText, Fingerprint, Car, DollarSign, RefreshCw, Award, UserCheck, Users, Receipt, Building2, ScrollText } from 'lucide-react'
import { citizenService } from '../../services/citizenService'

const DOC_ICONS = { national_id: Fingerprint, passport: FileText, drivers_license: Car, tin_certificate: DollarSign, tax_clearance: Receipt, business_tax: Building2, vat_certificate: ScrollText }
const DOC_LABELS = { national_id: 'National ID', passport: 'Passport', drivers_license: "Driver's License", tin_certificate: 'TIN Certificate', tax_clearance: 'Tax Clearance', business_tax: 'Business Tax', vat_certificate: 'VAT Certificate' }
const STATUS_STYLES = { verified: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', rejected: 'bg-red-100 text-red-700', not_submitted: 'bg-gray-100 text-gray-400' }
const STATUS_ICONS = { verified: CheckCircle, pending: Clock, rejected: XCircle, not_submitted: AlertCircle }

export default function CitizenVerification() {
  const [verifications, setVerifications] = useState([])
  const [badge, setBadge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const fileRefs = useRef({})
  const statusRef = useRef(null)

  const fetchAll = () => {
    Promise.all([
      citizenService.getVerifications(),
      citizenService.getVerificationStatus()
    ]).then(([v, b]) => {
      setVerifications(v || [])
      setBadge(b || {})
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleUpload = async (docType) => {
    const file = fileRefs.current[docType]?.files?.[0]
    if (!file) return
    setUploading(docType)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        await citizenService.submitVerification(docType, ev.target.result)
        fetchAll()
      } catch (e) { console.error(e) }
      setUploading(null)
    }
    reader.readAsDataURL(file)
  }

  const scrollToStatus = () => statusRef.current?.scrollIntoView({ behavior: 'smooth' })

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  const verifiedCount = verifications.filter(v => v.status === 'verified').length
  const pendingCount = verifications.filter(v => v.status === 'pending').length
  const totalDocs = verifications.length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Identity Verification</h1>
        <p className="text-gray-500 mt-1">Verify your identity to earn the MESOB Verified badge</p>
      </div>

      {badge && (
        <motion.div ref={statusRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-5 h-5 text-yellow-300" />
                <h2 className="text-lg font-bold">Verification Status</h2>
              </div>
              <p className="text-blue-200 text-sm">Verify at least 2 documents to earn the MESOB Verified badge</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center"><div className="text-2xl font-bold">{verifiedCount}/{totalDocs}</div><div className="text-xs text-blue-200">Verified</div></div>
              <div className="text-center"><div className="text-2xl font-bold">{pendingCount}</div><div className="text-xs text-blue-200">Pending</div></div>
              <div className={`px-4 py-2 rounded-xl text-center ${badge.isMesobVerified ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  {badge.isMesobVerified ? <><BadgeCheck className="w-5 h-5" /> MESOB Verified ✓</> : <><Shield className="w-4 h-4" /> Not Verified</>}
                </div>
              </div>
            </div>
          </div>
          {!badge.isMesobVerified && (
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-300" />
                <span>You need {2 - verifiedCount} more verified document{badge.verifiedDocuments === 1 ? '' : 's'} to get the MESOB Verified badge.</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${totalDocs > 0 ? (verifiedCount / Math.max(2, totalDocs)) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {verifications.map((v, i) => {
          const Icon = DOC_ICONS[v.documentType] || FileText
          const StatusIcon = STATUS_ICONS[v.status] || AlertCircle
          const isUploading = uploading === v.documentType
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${v.status === 'verified' ? 'bg-green-50 text-green-600' : v.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{v.documentName}</h3>
                    <p className="text-xs text-gray-400 capitalize">{v.documentType.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[v.status] || 'bg-gray-100 text-gray-600'}`}>
                  <StatusIcon className="w-3 h-3" /> {v.status === 'not_submitted' ? 'Not Submitted' : v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
              </div>

              {v.status === 'rejected' && v.adminNotes && (
                <div className="p-2.5 bg-red-50 rounded-xl text-xs text-red-600 mb-3">{v.adminNotes}</div>
              )}

              {v.status === 'verified' && v.verifiedAt && (
                <div className="text-xs text-green-600 mb-3 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified {new Date(v.verifiedAt).toLocaleDateString()}</div>
              )}

              {(v.status === 'not_submitted' || v.status === 'rejected') && (
                <div className="flex gap-2">
                  <button onClick={() => fileRefs.current[v.documentType]?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition flex-1 justify-center">
                    {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                  <input type="file" ref={el => fileRefs.current[v.documentType] = el} accept="image/*,.pdf" onChange={() => handleUpload(v.documentType)} className="hidden" />
                </div>
              )}

              {v.status === 'pending' && (
                <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-xl">
                  <Clock className="w-3.5 h-3.5" /> Your document is being reviewed by the verification team.
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> About MESOB Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-xl"><div className="font-semibold text-blue-700 mb-1">Step 1</div><div className="text-blue-600">Upload your official documents (National ID, Passport, etc.)</div></div>
          <div className="p-3 bg-purple-50 rounded-xl"><div className="font-semibold text-purple-700 mb-1">Step 2</div><div className="text-purple-600">Our verification team reviews and confirms your documents</div></div>
          <div className="p-3 bg-green-50 rounded-xl"><div className="font-semibold text-green-700 mb-1">Step 3</div><div className="text-green-600">Earn the MESOB Verified badge on your profile and join verified citizens</div></div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
          <strong>Benefits of verification:</strong> Verified users gain access to premium services, faster application processing, and are counted in Ethiopia's verified digital population statistics.
        </div>
      </motion.div>
    </div>
  )
}
