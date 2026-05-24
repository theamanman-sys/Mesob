import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Home, Plus, TrendingUp, DollarSign, FileText, MapPin, Calculator, Globe, Trash2, Edit3, X, Search, Wallet, Car, Package, Server, PieChart, RefreshCw, Gauge, Wrench, Shield, Award, ArrowUpRight, Clock, Upload, Loader, CheckCircle, AlertCircle, ArrowRight, Ticket } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

const TABS = [
  { id: 'realestate', label: 'Real Estate', icon: Building2 },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'assets', label: 'Other Assets', icon: Package },
  { id: 'browse', label: 'Browse Listings', icon: Globe },
  { id: 'services', label: 'Available Services', icon: Server },
  { id: 'economy', label: 'Economy Share', icon: PieChart },
]

const STATUS_OPTS = ['owned', 'mortgage', 'rental', 'selling']
const TYPE_OPTS = ['Residential', 'Commercial', 'Land', 'Industrial', 'Agricultural']
const LOCATION_OPTS = ['Addis Ababa', 'Bahir Dar', 'Dire Dawa', 'Hawassa', 'Mekelle', 'Adama', 'Other']
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Pickup', 'Motorcycle', 'Truck', 'Minibus', 'Bus', 'Other']
const ASSET_CATEGORIES = ['Jewelry', 'Electronics', 'Equipment', 'Art', 'Furniture', 'Livestock', 'Inventory', 'Other']

const statusStyleMap = {
  owned: 'bg-green-100 text-green-700',
  mortgage: 'bg-yellow-100 text-yellow-700',
  rental: 'bg-purple-100 text-purple-700',
  selling: 'bg-blue-100 text-blue-700',
  financed: 'bg-yellow-100 text-yellow-700',
}

export default function CitizenProperty() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('realestate')
  const [properties, setProperties] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [otherAssets, setOtherAssets] = useState([])
  const [services, setServices] = useState([])
  const [economy, setEconomy] = useState(null)
  const [assetsWorth, setAssetsWorth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [browseTab, setBrowseTab] = useState('properties')
  const [showApply, setShowApply] = useState(null)
  const [appStep, setAppStep] = useState(1)
  const [appLoading, setAppLoading] = useState(false)
  const [appSuccess, setAppSuccess] = useState(false)
  const [appTicket, setAppTicket] = useState(null)
  const [appForm, setAppForm] = useState({})
  const [appDocs, setAppDocs] = useState([])
  const [citizen, setCitizen] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      citizenService.getProperties().catch(() => []),
      citizenService.getVehicles().catch(() => []),
      citizenService.getOtherAssets().catch(() => []),
      citizenService.getAvailableServices().catch(() => []),
      citizenService.getEconomyData().catch(() => null),
      citizenService.getPropertyAssetsWorth().catch(() => null)
    ]).then(([p, v, a, s, e, w]) => { setProperties(p || []); setVehicles(v || []); setOtherAssets(a || []); setServices(s || []); setEconomy(e); setAssetsWorth(w) }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    const session = citizenService.getSession()
    if (session) setCitizen(session)
    fetchData()
  }, [])

  const format = (n) => (n || 0).toLocaleString()
  const allAssets = [...properties, ...vehicles, ...otherAssets]
  const totalValue = allAssets.reduce((s, a) => s + (a.value || 0), 0)
  const totalRental = properties.reduce((s, p) => s + (p.rentalIncome || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const tab = activeTab
      if (tab === 'realestate') {
        const payload = { ...form, value: Number(form.value), rentalIncome: Number(form.rentalIncome) || 0, size: `${form.size}` }
        if (editingId) { await citizenService.updateProperty(editingId, payload) } else { await citizenService.addProperty(payload) }
      } else if (tab === 'vehicles') {
        const payload = { ...form, value: Number(form.value), year: Number(form.year) || new Date().getFullYear() }
        if (editingId) { await citizenService.updateVehicle(editingId, payload) } else { await citizenService.addVehicle(payload) }
      } else if (tab === 'assets') {
        const payload = { ...form, value: Number(form.value) }
        if (editingId) { await citizenService.updateOtherAsset(editingId, payload) } else { await citizenService.addOtherAsset(payload) }
      }
      setShowForm(false); setEditingId(null); setForm({}); fetchData()
    } catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleEdit = (item, tab) => {
    if (tab === 'realestate') setForm({ name: item.name, type: item.type, location: item.location, size: (item.size || '').replace(' sqm', ''), value: String(item.value), status: item.status, description: item.description || '', rentalIncome: String(item.rentalIncome || '') })
    else if (tab === 'vehicles') setForm({ name: item.name, make: item.make, model: item.model, year: String(item.year), plate: item.plate || '', type: item.type, value: String(item.value), status: item.status, description: item.description || '' })
    else setForm({ name: item.name, category: item.category, value: String(item.value), description: item.description || '' })
    setEditingId(item.id); setShowForm(true)
  }

  const handleDelete = async (id, tab) => {
    if (!confirm(t('Remove this item?'))) return
    try {
      if (tab === 'realestate') await citizenService.deleteProperty(id)
      else if (tab === 'vehicles') await citizenService.deleteVehicle(id)
      else await citizenService.deleteOtherAsset(id)
      fetchData()
    } catch {}
  }

  const resetForm = (tab) => {
    setEditingId(null); setShowForm(true)
    if (tab === 'realestate') setForm({ name: '', type: 'Residential', location: '', size: '', value: '', status: 'owned', description: '', rentalIncome: '' })
    else if (tab === 'vehicles') setForm({ name: '', make: '', model: '', year: '', plate: '', type: 'Sedan', value: '', status: 'owned', description: '' })
    else setForm({ name: '', category: 'Jewelry', value: '', description: '' })
  }

  const handleApply = async (e) => {
    e.preventDefault()
    setAppLoading(true)
    try {
      const result = await citizenService.submitApplication(showApply.id, showApply.name, appForm, appDocs)
      if (result.ticket) setAppTicket(result.ticket)
      setAppSuccess(true)
      setAppStep(3)
    } catch (err) {
      alert(err.response?.data?.message || err.message)
    }
    setAppLoading(false)
  }

  const handleFileAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setAppDocs(prev => [...prev, { name: file.name, size: file.size, dataUrl: reader.result }])
      reader.readAsDataURL(file)
    })
  }

  const resetApply = () => {
    setShowApply(null)
    setAppStep(1)
    setAppForm({})
    setAppDocs([])
    setAppSuccess(false)
    setAppTicket(null)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900">{t('Assets & Services')}</h1><p className="text-gray-500 text-sm mt-1">{t('Manage your assets, browse services, and track your economy share')}</p></div>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">{t('Total Assets')}</p><p className="text-xl font-bold text-blue-600">{allAssets.length}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">{t('Total Value')}</p><p className="text-xl font-bold text-green-600">{format(totalValue)} ETB</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">{t('Real Estate')}</p><p className="text-xl font-bold text-amber-600">{properties.length}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">{t('Vehicles')}</p><p className="text-xl font-bold text-purple-600">{vehicles.length}</p></div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><tab.icon className="w-4 h-4" />{t(tab.label)}</button>)}
      </div>

      {activeTab === 'realestate' && <AssetSection title={t('Real Estate')} items={properties} onAdd={() => resetForm('realestate')} onEdit={(i) => handleEdit(i, 'realestate')} onDelete={(i) => handleDelete(i.id, 'realestate')} renderItem={(p) => <div><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{p.name}</h3><p className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline" />{p.location} <span className="mx-1">•</span>{p.size}</p><div className="flex gap-2 mt-2"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{t(p.type)}</span><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusStyleMap[p.status] || 'bg-gray-100 text-gray-700'}`}>{t(p.status)}</span></div></div><div className="text-right"><p className="text-lg font-bold">{format(p.value)} ETB</p>{p.rentalIncome > 0 && <p className="text-xs text-purple-600">{format(p.rentalIncome)}{t('/mo')}</p>}</div></div></div>} />}

      {activeTab === 'vehicles' && <AssetSection title={t('Vehicles')} items={vehicles} onAdd={() => resetForm('vehicles')} onEdit={(i) => handleEdit(i, 'vehicles')} onDelete={(i) => handleDelete(i.id, 'vehicles')} renderItem={(v) => <div><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{v.name}</h3><p className="text-xs text-gray-500">{v.make} {v.model} <span className="mx-1">•</span>{v.year} <span className="mx-1">•</span>{v.plate || t('No plate')}<br />{t(v.type)} <span className="mx-2">•</span>{v.documents?.length || 0} {t('documents')}</p><div className="flex gap-2 mt-2"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusStyleMap[v.status] || 'bg-gray-100 text-gray-700'}`}>{t(v.status)}</span></div></div><div className="text-right"><p className="text-lg font-bold">{format(v.value)} ETB</p></div></div></div>} />}

      {activeTab === 'assets' && <AssetSection title={t('Other Assets')} items={otherAssets} onAdd={() => resetForm('assets')} onEdit={(i) => handleEdit(i, 'assets')} onDelete={(i) => handleDelete(i.id, 'assets')} renderItem={(a) => <div><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{a.name}</h3><p className="text-xs text-gray-500"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{t(a.category)}</span></p></div><div className="text-right"><p className="text-lg font-bold">{format(a.value)} ETB</p></div></div></div>} />}

      {activeTab === 'browse' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setBrowseTab('properties')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${browseTab === 'properties' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Building2 className="w-4 h-4 inline mr-1" />{t('Property Listings')}</button>
            <button onClick={() => setBrowseTab('cars')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${browseTab === 'cars' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Car className="w-4 h-4 inline mr-1" />{t('Car Listings')}</button>
          </div>
          {browseTab === 'properties' ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2"><img src="https://www.properties.et/favicon.ico" className="w-5 h-5 rounded" onError={e => e.target.style.display='none'} /><h3 className="font-semibold text-gray-900 text-sm">properties.et</h3></div>
              <iframe src="https://www.properties.et" className="w-full min-h-[300px] md:min-h-[450px] lg:min-h-[600px]" title="properties.et" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2"><img src="https://betoch.com/favicon.ico" className="w-5 h-5 rounded" onError={e => e.target.style.display='none'} /><h3 className="font-semibold text-gray-900 text-sm">betoch.com</h3></div>
              <iframe src="https://betoch.com" className="w-full min-h-[300px] md:min-h-[450px] lg:min-h-[600px]" title="betoch.com" loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </div>
          </div> : <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto"><Car className="w-16 h-16 mx-auto mb-4 text-purple-600" /><h2 className="text-xl font-bold text-gray-900 mb-2">{t('Browse Cars on mekina.net')}</h2><p className="text-gray-500 mb-6">{t('View car listings, compare prices, and find your next vehicle.')}</p><a href="https://mekina.net" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-200">{t('See Car Listings')} <ArrowUpRight className="w-5 h-5" /></a></div>}
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><Server className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">{t('No services available.')}</p></div>
          ) : services.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s.category}</span>
                    <span className="text-gray-400">{s.department}</span>
                    {s.processingTime && (
                      <span className="flex items-center gap-1 text-gray-500"><Clock className="w-3 h-3" /> {s.processingTime}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-green-600">{s.estimatedCost}</p>
                  <button onClick={() => { setShowApply(s); setAppStep(1); setAppForm({}); setAppDocs([]); setAppSuccess(false) }}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition w-full">
                    {t('Apply')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'economy' && (
        <div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"><PieChart className="w-8 h-8 mx-auto mb-2 text-blue-600" /><p className="text-sm text-gray-500">{t('GDP (est.)')}</p><p className="text-xl font-black">{economy?.gdp ? format(economy.gdp) : '—'} ETB</p></div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" /><p className="text-sm text-gray-500">{t('Growth Rate')}</p><p className="text-xl font-black text-green-600">{economy?.growthRate || '—'}%</p></div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"><Award className="w-8 h-8 mx-auto mb-2 text-amber-600" /><p className="text-sm text-gray-500">{t('Your Economy Share')}</p><p className="text-xl font-black text-amber-600">{totalValue > 0 ? format(Math.round(totalValue * 0.0001)) : '0'} ETB</p></div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-100"><p className="text-sm text-gray-600">{t('Your total asset value of')} <strong>{format(totalValue)} ETB</strong> {t('represents a share of Ethiopia\'s economy. As the economy grows, your assets appreciate. Current estimated GDP growth is')} <strong className="text-green-600">{economy?.growthRate || '—'}%</strong>.</p></div>
        </div>
      )}

      <AnimatePresence>{showForm && <AssetFormModal tab={activeTab} form={form} setForm={setForm} editingId={editingId} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}</AnimatePresence>

      <AnimatePresence>
        {showApply && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && resetApply()}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="font-bold text-gray-900">{appSuccess ? t('Application submitted!') : t('Apply for Service')}</h2>
                  <p className="text-sm text-gray-500">{appSuccess ? '' : showApply.name}</p>
                </div>
                <button onClick={resetApply} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>

              {!appSuccess && (
                <div className="flex items-center gap-2 px-5 py-4 bg-gray-50 border-b border-gray-100">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${appStep >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {appStep > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                      </div>
                      <span className={`text-xs font-medium ${appStep >= s ? 'text-blue-600' : 'text-gray-400'}`}>
                        {s === 1 ? t('Details') : t('Documents')}
                      </span>
                      {s < 2 && <div className={`w-8 h-0.5 ${appStep > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              )}

              <div className="p-5">
                {appSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{t('Application Submitted')}</h3>
                    <p className="text-gray-500 text-sm mb-4">{t('We have received your application. You will be contacted soon.')}</p>
                    {appTicket && (
                      <div className="bg-blue-50 rounded-xl p-4 mb-4 text-left max-w-sm mx-auto border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2"><Ticket className="w-4 h-4" /> {t('Appointment Ticket Generated')}</div>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">{t('Ticket Number')}</span><span className="font-bold text-gray-800">{appTicket.ticketNumber}</span></div>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">{t('Date')}</span><span className="font-medium text-gray-800">{new Date(appTicket.appointmentDate).toLocaleDateString()}</span></div>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-gray-500">{t('Time')}</span><span className="font-medium text-gray-800">{appTicket.appointmentTime}</span></div>
                        <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{t('Fee')}</span><span className="font-medium text-gray-800">{appTicket.fee} ETB</span></div>
                      </div>
                    )}
                    <div className="flex gap-3 justify-center">
                      <button onClick={resetApply} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">{t('Close')}</button>
                      <Link to="/citizen/tickets" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                        onClick={resetApply}>{t('View Tickets')}</Link>
                    </div>
                  </div>
                ) : appStep === 1 ? (
                  <form onSubmit={(e) => { e.preventDefault(); setAppStep(2) }} className="space-y-4">
                    <p className="text-sm text-gray-600">{t('Provide additional details for your application')}</p>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Full Name')}</label>
                      <input type="text" value={appForm.fullName || citizen?.firstName + ' ' + citizen?.lastName || ''}
                        onChange={e => setAppForm({ ...appForm, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Email')}</label>
                      <input type="email" value={appForm.email || citizen?.email || ''}
                        onChange={e => setAppForm({ ...appForm, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Phone')}</label>
                      <input type="tel" value={appForm.phone || citizen?.phone || ''}
                        onChange={e => setAppForm({ ...appForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Additional Notes')}</label>
                      <textarea value={appForm.notes || ''} onChange={e => setAppForm({ ...appForm, notes: e.target.value })}
                        rows={3} placeholder={t('Any additional information...')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={resetApply} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                        {t('Cancel')}
                      </button>
                      <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                        {t('Next: Documents')} <ArrowRight className="w-4 h-4 inline ml-1" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4">
                    <p className="text-sm text-gray-600">{t('Upload the required documents')}</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition">
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">{t('Drag files here or click to upload')}</p>
                      <input type="file" multiple onChange={handleFileAdd} className="hidden" id="svc-file-upload" />
                      <label htmlFor="svc-file-upload" className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-100 transition">
                        {t('Browse Files')}
                      </label>
                    </div>
                    {appDocs.length > 0 && (
                      <div className="space-y-2">
                        {appDocs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                              <span className="text-xs text-gray-400">({(doc.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button type="button" onClick={() => setAppDocs(prev => prev.filter((_, j) => j !== i))}
                              className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setAppStep(1)} className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                        {t('Back')}
                      </button>
                      <button type="submit" disabled={appLoading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                        {appLoading ? <Loader className="w-5 h-5 animate-spin" /> : <>{t('Submit Application')} <CheckCircle className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AssetSection({ title, items, onAdd, onEdit, onDelete, renderItem }) {
  const { t } = useLanguage()
  return <div><div className="flex gap-3 mb-4"><button onClick={onAdd} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5"><Plus className="w-4 h-4" />{t('Add')} {title}</button></div>
    {items.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><Package className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">{t('No')} {title.toLowerCase()} {t('listed.')}</p></div> : <div className="space-y-3">{items.map((item, i) => <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">{renderItem(item)}<div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50"><button onClick={() => onEdit(item)} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Edit3 className="w-3 h-3" />{t('Edit')}</button><button onClick={() => onDelete(item)} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-3 h-3" />{t('Remove')}</button></div></motion.div>)}</div>}</div>
}

function AssetFormModal({ tab, form, setForm, editingId, onClose, onSubmit }) {
  const { t } = useLanguage()
  const f = (k) => ({ value: form[k] || '', onChange: (e) => setForm({...form, [k]: e.target.value }) })
  const sel = (k, opts) => <select value={form[k] || opts[0]} onChange={e => setForm({...form, [k]: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white">{opts.map(o => <option key={o} value={o}>{t(o)}</option>)}</select>

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">{editingId ? t('Edit') : t('Add')} {tab === 'realestate' ? t('Real Estate') : tab === 'vehicles' ? t('Vehicle') : t('Asset')}</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
      <form onSubmit={onSubmit} className="space-y-4">
        {tab === 'realestate' && <>
          <input {...f('name')} placeholder={t('Property name')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3">{sel('type', TYPE_OPTS)}{sel('status', STATUS_OPTS)}</div>
          <div className="grid grid-cols-2 gap-3">{sel('location', LOCATION_OPTS)}<input {...f('size')} placeholder={t('Size (sqm)')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3"><input {...f('value')} type="number" placeholder={t('Value (ETB)')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /><input {...f('rentalIncome')} type="number" placeholder={t('Monthly rent')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
        </>}
        {tab === 'vehicles' && <>
          <input {...f('name')} placeholder={t('Vehicle name')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3"><input {...f('make')} placeholder={t('Make (e.g. Toyota)')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /><input {...f('model')} placeholder={t('Model (e.g. Corolla)')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3"><input {...f('year')} type="number" placeholder={t('Year')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /><input {...f('plate')} placeholder={t('Plate number')} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">{sel('type', VEHICLE_TYPES)}{sel('status', ['owned', 'financed'])}</div>
          <input {...f('value')} type="number" placeholder={t('Value (ETB)')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
        </>}
        {tab === 'assets' && <>
          <input {...f('name')} placeholder={t('Asset name')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3">{sel('category', ASSET_CATEGORIES)}<input {...f('value')} type="number" placeholder={t('Value (ETB)')} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
        </>}
        <textarea {...f('description')} placeholder={t('Description (optional)')} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm w-full" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">{editingId ? t('Update') : t('Add')}</button>
      </form>
    </motion.div>
  </motion.div>
}
