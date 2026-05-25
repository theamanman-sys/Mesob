import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Search, Filter, MapPin, Clock, DollarSign, Building2, ExternalLink, CheckCircle, X, ChevronDown, Send, Award, GraduationCap, Star, Truck, FileText, Users, BookOpen, RefreshCw, Globe } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

const CATEGORIES = ['all', 'transport', 'finance', 'technology', 'healthcare', 'engineering', 'administration', 'business', 'education']
const JOB_TYPES = ['all', 'full-time', 'part-time', 'contract']

export default function CitizenJobs() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState([])
  const [suggestions, setSuggestions] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('all')
  const [selectedJob, setSelectedJob] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState(new Set())
  const [showQetero, setShowQetero] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(r => r.json()).then(r => r.data || []).catch(() => []),
      citizenService.getBadge().then(r => r).catch(() => null)
    ]).then(([j, badge]) => {
      setJobs(j || [])
      citizenService.getJobSuggestions().then(s => setSuggestions(s || null)).catch(() => {})
    }).catch(() => {}).finally(() => setLoading(false))

    citizenService.getJobApplications().then(a => {
      setApplications(a || [])
      setAppliedJobs(new Set((a || []).map(app => app.jobId)))
    }).catch(() => {})
  }, [])

  const filtered = jobs.filter(j => {
    if (category !== 'all' && j.category !== category) return false
    if (type !== 'all' && j.type !== type) return false
    if (search) {
      const q = search.toLowerCase()
      if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q) && !j.description.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleApply = async (jobId) => {
    if (!coverLetter.trim()) return alert(t('Please write a cover letter'))
    setApplying(true)
    try {
      const res = await citizenService.applyForJob(jobId, coverLetter)
      setAppliedJobs(prev => new Set([...prev, jobId]))
      setCoverLetter('')
      setSelectedJob(null)
      const apps = await citizenService.getJobApplications()
      setApplications(apps || [])
    } catch (err) { alert(err.response?.data?.message || err.message) }
    setApplying(false)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900">{t('Jobs & Opportunities')}</h1><p className="text-gray-500 text-sm mt-1">{t('Browse job listings, get suggestions based on your documents, and manage applications')}</p></div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('browse')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'browse' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Briefcase className="w-4 h-4 inline mr-1.5" />{t('Browse')}</button>
          <button onClick={() => setActiveTab('myapps')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === 'myapps' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText className="w-4 h-4 inline mr-1.5" />{t('My Apps')} ({applications.length})</button>
        </div>
      </div>

      {/* EthioJobs - Main Iframe */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50">
          <iframe src={`/api/proxy/bank?url=${encodeURIComponent('https://www.ethiojobs.net')}`} title={t('EthioJobs')} className="w-full min-h-[300px] md:min-h-[500px] lg:min-h-[700px] border-0" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
      </motion.div>

      {/* Browse jobs / Suggestions section below iframe */}
      {activeTab === 'myapps' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('No job applications yet. Browse jobs and apply!')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div><h3 className="font-semibold text-gray-900">{a.job?.title || t('Unknown Position')}</h3><p className="text-sm text-gray-500">{a.job?.company} • {a.job?.location}</p></div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${a.status === 'submitted' ? 'bg-blue-100 text-blue-700' : a.status === 'reviewing' ? 'bg-yellow-100 text-yellow-700' : a.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t(a.status)}</span>
                  </div>
                  {a.coverLetter && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.coverLetter}</p>}
                  <p className="text-xs text-gray-400 mt-2">{t('Applied')} {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search jobs...')} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" /></div>
              <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white"><option value="all">{t('All Categories')}</option>{CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} className="capitalize">{t(c)}</option>)}</select>
              <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white"><option value="all">{t('All Types')}</option>{JOB_TYPES.filter(t => t !== 'all').map(tt => <option key={tt} value={tt} className="capitalize">{t(tt)}</option>)}</select>
            </div>

            <div className="space-y-3">
              {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400"><Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>{t('No jobs found matching your filters.')}</p></div> : filtered.map((j, i) => (
                <motion.div key={j.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition cursor-pointer" onClick={() => setSelectedJob(j)}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{j.company[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div><h3 className="font-semibold text-gray-900">{j.title}</h3><p className="text-sm text-gray-500">{j.company}</p></div>
                        {appliedJobs.has(j.id) && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">{t('Applied')}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{j.salary}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t(j.type)}</span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{t(j.category)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {suggestions && suggestions.suggestions?.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100 shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-purple-600" /> {t('Recommended for You')}</h3>
                <p className="text-xs text-gray-500 mb-3">{t('Based on your verified documents and skills, we found')} <strong>{suggestions.matchedCount}</strong> {t('matching jobs out of')} <strong>{suggestions.totalJobs}</strong>.</p>
                <div className="space-y-2">
                  {suggestions.suggestions.slice(0, 5).map(j => (
                    <div key={j.id} onClick={() => { setSelectedJob(j); setActiveTab('browse') }} className="flex items-center gap-3 p-2.5 bg-white rounded-xl cursor-pointer hover:shadow-sm transition">
                      <div className={`p-2 rounded-lg ${j.matchScore >= 4 ? 'bg-green-100 text-green-600' : j.matchScore >= 2 ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}><Star className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-800 truncate">{j.title}</div><div className="text-xs text-gray-500">{j.company} • {t('Match')}: {j.matchScore}/6</div></div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" /> {t('Quick Links')}</h3>
              <div className="space-y-1.5">
                {[
                  { icon: FileText, label: 'Upload Documents', desc: 'Get verified to unlock jobs' },
                  { icon: Truck, label: 'Driving Jobs', desc: 'Available with driver\'s license' },
                  { icon: DollarSign, label: 'Finance Jobs', desc: 'TIN certificate required' },
                  { icon: Globe, label: 'EthioJobs', desc: 'Browse external job listings' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 bg-gray-50">
                    <item.icon className="w-4 h-4 text-gray-400" /><div><div className="font-medium">{t(item.label)}</div><div className="text-xs text-gray-400">{t(item.desc)}</div></div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedJob && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedJob(null); setCoverLetter('') }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">{selectedJob.company[0]}</div><div><h2 className="text-lg font-bold text-gray-900">{selectedJob.title}</h2><p className="text-sm text-gray-500">{selectedJob.company}</p></div></div>
                <button onClick={() => { setSelectedJob(null); setCoverLetter('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedJob.location}</span><span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{selectedJob.salary}</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t(selectedJob.type)}</span><span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full text-xs">{t(selectedJob.category)}</span></div>
              <div className="mb-4"><h4 className="font-semibold text-gray-700 text-sm mb-1">{t('Description')}</h4><p className="text-sm text-gray-600">{selectedJob.description}</p></div>
              <div className="mb-4"><h4 className="font-semibold text-gray-700 text-sm mb-1">{t('Requirements')}</h4><p className="text-sm text-gray-600">{selectedJob.requirements}</p></div>
              {selectedJob.deadline && <p className="text-xs text-red-500 mb-4">{t('Deadline')}: {new Date(selectedJob.deadline).toLocaleDateString()}</p>}
              {appliedJobs.has(selectedJob.id) ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700"><CheckCircle className="w-4 h-4" /> {t('You have already applied for this position.')}</div>
              ) : (
                <div><textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder={t("Write your cover letter explaining why you're a good fit...")} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm mb-3" rows={4} />
                <button onClick={() => handleApply(selectedJob.id)} disabled={applying || !coverLetter.trim()} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"><Send className="w-4 h-4" /> {applying ? t('Submitting...') : t('Submit Application')}</button></div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
