import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Home, Plus, TrendingUp, DollarSign, FileText, MapPin, Calculator, Globe, Trash2, Edit3, X, Search, Wallet, Car, Package, Server, PieChart, RefreshCw, Gauge, Wrench, Shield, Award, ArrowUpRight } from 'lucide-react'
import { citizenService } from '../../services/citizenService'

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

export default function CitizenProperty() {
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

  useEffect(() => { fetchData() }, [])

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

  const handleDelete = async (id, tab) => { if (!confirm('Remove this item?')) return; try { if (tab === 'realestate') await citizenService.deleteProperty(id); else if (tab === 'vehicles') await citizenService.deleteVehicle(id); else await citizenService.deleteOtherAsset(id); fetchData() } catch {} }

  const resetForm = (tab) => {
    setEditingId(null); setShowForm(true)
    if (tab === 'realestate') setForm({ name: '', type: 'Residential', location: '', size: '', value: '', status: 'owned', description: '', rentalIncome: '' })
    else if (tab === 'vehicles') setForm({ name: '', make: '', model: '', year: '', plate: '', type: 'Sedan', value: '', status: 'owned', description: '' })
    else setForm({ name: '', category: 'Jewelry', value: '', description: '' })
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900">Assets &amp; Services</h1><p className="text-gray-500 text-sm mt-1">Manage your assets, browse services, and track your economy share</p></div>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Total Assets</p><p className="text-xl font-bold text-blue-600">{allAssets.length}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Total Value</p><p className="text-xl font-bold text-green-600">{format(totalValue)} ETB</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Real Estate</p><p className="text-xl font-bold text-amber-600">{properties.length}</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Vehicles</p><p className="text-xl font-bold text-purple-600">{vehicles.length}</p></div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><t.icon className="w-4 h-4" />{t.label}</button>)}
      </div>

      {/* Real Estate */}
      {activeTab === 'realestate' && <AssetSection title="Real Estate" items={properties} onAdd={() => resetForm('realestate')} onEdit={(i) => handleEdit(i, 'realestate')} onDelete={(i) => handleDelete(i.id, 'realestate')} renderItem={(p) => <div><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{p.name}</h3><p className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline" />{p.location} <span className="mx-1">•</span>{p.size}</p><div className="flex gap-2 mt-2"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{p.type}</span><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.status === 'owned' ? 'bg-green-100 text-green-700' : p.status === 'mortgage' ? 'bg-yellow-100 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>{p.status}</span></div></div><div className="text-right"><p className="text-lg font-bold">{format(p.value)} ETB</p>{p.rentalIncome > 0 && <p className="text-xs text-purple-600">{format(p.rentalIncome)}/mo</p>}</div></div></div>} />}

      {/* Vehicles */}
      {activeTab === 'vehicles' && <AssetSection title="Vehicles" items={vehicles} onAdd={() => resetForm('vehicles')} onEdit={(i) => handleEdit(i, 'vehicles')} onDelete={(i) => handleDelete(i.id, 'vehicles')} renderItem={(v) => <div><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{v.name}</h3><p className="text-xs text-gray-500">{v.make} {v.model} <span className="mx-1">•</span>{v.year} <span className="mx-1">•</span>{v.plate || 'No plate'}<br />{v.type} <span className="mx-2">•</span>{v.documents?.length || 0} documents</p><div className="flex gap-2 mt-2"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${v.status === 'owned' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.status}</span></div></div><div className="text-right"><p className="text-lg font-bold">{format(v.value)} ETB</p></div></div></div>} />}

      {/* Other Assets */}
      {activeTab === 'assets' && <AssetSection title="Other Assets" items={otherAssets} onAdd={() => resetForm('assets')} onEdit={(i) => handleEdit(i, 'assets')} onDelete={(i) => handleDelete(i.id, 'assets')} renderItem={(a) => <div><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{a.name}</h3><p className="text-xs text-gray-500"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{a.category}</span></p></div><div className="text-right"><p className="text-lg font-bold">{format(a.value)} ETB</p></div></div></div>} />}

      {/* Browse Listings */}
      {activeTab === 'browse' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setBrowseTab('properties')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${browseTab === 'properties' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Building2 className="w-4 h-4 inline mr-1" />Property Listings</button>
            <button onClick={() => setBrowseTab('cars')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${browseTab === 'cars' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><Car className="w-4 h-4 inline mr-1" />Car Listings</button>
          </div>
          {browseTab === 'properties' ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2"><img src="https://www.properties.et/favicon.ico" className="w-5 h-5 rounded" onError={e => e.target.style.display='none'} /><h3 className="font-semibold text-gray-900 text-sm">properties.et</h3></div>
              <iframe src="https://www.properties.et" className="w-full h-[600px]" title="properties.et" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2"><img src="https://betoch.com/favicon.ico" className="w-5 h-5 rounded" onError={e => e.target.style.display='none'} /><h3 className="font-semibold text-gray-900 text-sm">betoch.com</h3></div>
              <iframe src="https://betoch.com" className="w-full h-[600px]" title="betoch.com" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </div>
          </div> : <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center max-w-md mx-auto"><Car className="w-16 h-16 mx-auto mb-4 text-purple-600" /><h2 className="text-xl font-bold text-gray-900 mb-2">Browse Cars on mekina.net</h2><p className="text-gray-500 mb-6">View car listings, compare prices, and find your next vehicle.</p><a href="https://mekina.net" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition shadow-lg shadow-purple-200">See Car Listings <ArrowUpRight className="w-5 h-5" /></a></div>}
        </div>
      )}

      {/* Available Services */}
      {activeTab === 'services' && (
        <div className="space-y-3">
          {services.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><Server className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">No services available.</p></div> : services.map(s => <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{s.name}</h3><p className="text-sm text-gray-500 mt-0.5">{s.description}</p><div className="flex gap-3 mt-2 text-xs text-gray-400"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s.category}</span><span>{s.department}</span></div></div><div className="text-right flex-shrink-0"><p className="text-sm font-semibold text-green-600">{s.estimatedCost}</p><p className="text-xs text-gray-400">{s.processingTime}</p></div></div></motion.div>)}
        </div>
      )}

      {/* Economy Share */}
      {activeTab === 'economy' && (
        <div>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"><PieChart className="w-8 h-8 mx-auto mb-2 text-blue-600" /><p className="text-sm text-gray-500">GDP (est.)</p><p className="text-xl font-black">{economy?.gdp ? format(economy.gdp) : '—'} ETB</p></div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" /><p className="text-sm text-gray-500">Growth Rate</p><p className="text-xl font-black text-green-600">{economy?.growthRate || '—'}%</p></div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center"><Award className="w-8 h-8 mx-auto mb-2 text-amber-600" /><p className="text-sm text-gray-500">Your Economy Share</p><p className="text-xl font-black text-amber-600">{totalValue > 0 ? format(Math.round(totalValue * 0.0001)) : '0'} ETB</p></div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-100"><p className="text-sm text-gray-600">Your total asset value of <strong>{format(totalValue)} ETB</strong> represents a share of Ethiopia's economy. As the economy grows, your assets appreciate. Current estimated GDP growth is <strong className="text-green-600">{economy?.growthRate || '—'}%</strong>.</p></div>
        </div>
      )}

      <AnimatePresence>{showForm && <AssetFormModal tab={activeTab} form={form} setForm={setForm} editingId={editingId} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}</AnimatePresence>
    </div>
  )
}

function AssetSection({ title, items, onAdd, onEdit, onDelete, renderItem }) {
  return <div><div className="flex gap-3 mb-4"><button onClick={onAdd} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1.5"><Plus className="w-4 h-4" />Add {title}</button></div>
    {items.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><Package className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">No {title.toLowerCase()} listed.</p></div> : <div className="space-y-3">{items.map((item, i) => <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">{renderItem(item)}<div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50"><button onClick={() => onEdit(item)} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Edit3 className="w-3 h-3" />Edit</button><button onClick={() => onDelete(item)} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-3 h-3" />Remove</button></div></motion.div>)}</div>}</div>
}

function AssetFormModal({ tab, form, setForm, editingId, onClose, onSubmit }) {
  const f = (k) => ({ value: form[k] || '', onChange: (e) => setForm({...form, [k]: e.target.value }) })
  const sel = (k, opts) => <select value={form[k] || opts[0]} onChange={e => setForm({...form, [k]: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm bg-white">{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">{editingId ? 'Edit' : 'Add'} {tab === 'realestate' ? 'Real Estate' : tab === 'vehicles' ? 'Vehicle' : 'Asset'}</h3><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
      <form onSubmit={onSubmit} className="space-y-4">
        {tab === 'realestate' && <>
          <input {...f('name')} placeholder="Property name" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3">{sel('type', TYPE_OPTS)}{sel('status', STATUS_OPTS)}</div>
          <div className="grid grid-cols-2 gap-3">{sel('location', LOCATION_OPTS)}<input {...f('size')} placeholder="Size (sqm)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3"><input {...f('value')} type="number" placeholder="Value (ETB)" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /><input {...f('rentalIncome')} type="number" placeholder="Monthly rent" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
        </>}
        {tab === 'vehicles' && <>
          <input {...f('name')} placeholder="Vehicle name" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3"><input {...f('make')} placeholder="Make (e.g. Toyota)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /><input {...f('model')} placeholder="Model (e.g. Corolla)" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3"><input {...f('year')} type="number" placeholder="Year" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /><input {...f('plate')} placeholder="Plate number" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">{sel('type', VEHICLE_TYPES)}{sel('status', ['owned', 'financed'])}</div>
          <input {...f('value')} type="number" placeholder="Value (ETB)" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
        </>}
        {tab === 'assets' && <>
          <input {...f('name')} placeholder="Asset name" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3">{sel('category', ASSET_CATEGORIES)}<input {...f('value')} type="number" placeholder="Value (ETB)" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" /></div>
        </>}
        <textarea {...f('description')} placeholder="Description (optional)" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm w-full" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">{editingId ? 'Update' : 'Add'}</button>
      </form>
    </motion.div>
  </motion.div>
}