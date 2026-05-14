import { useState, useEffect } from 'react'
import { aboutUsService } from '../services/aboutUsService'
import { languageService } from '../services/languageService'
import { useToast } from '../context/ToastContext'

const defaultForm = {
  languageId: '', pageTitle: '', pageSubtitle: '', missionTitle: '', missionDescription: '',
  visionTitle: '', visionDescription: '', coreValuesTitle: '', efficiencyTitle: '',
  efficiencyDescription: '', securityTitle: '', securityDescription: '', accessibilityTitle: '',
  accessibilityDescription: '', futureTitle: '', futureDescription: ''
}

export default function AdminAboutUs() {
  const [items, setItems] = useState([]); const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null); const [form, setForm] = useState(defaultForm)
  const { showToast } = useToast()

  const fetch = async () => { try { const { data } = await aboutUsService.getAll(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch(); (async () => { try { const { data } = await languageService.getAll(); setLanguages(data.data || data || []) } catch { setLanguages([]) } })() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try { edit ? await aboutUsService.update(edit, form) : await aboutUsService.create(form); showToast(`Saved`, 'success'); setModal(false); setEdit(null); setForm(defaultForm); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
  }

  const openEdit = (item) => {
    setForm({
      languageId: item.languageId || '', pageTitle: item.pageTitle || '', pageSubtitle: item.pageSubtitle || '',
      missionTitle: item.missionTitle || '', missionDescription: item.missionDescription || '',
      visionTitle: item.visionTitle || '', visionDescription: item.visionDescription || '',
      coreValuesTitle: item.coreValuesTitle || '', efficiencyTitle: item.efficiencyTitle || '',
      efficiencyDescription: item.efficiencyDescription || '', securityTitle: item.securityTitle || '',
      securityDescription: item.securityDescription || '', accessibilityTitle: item.accessibilityTitle || '',
      accessibilityDescription: item.accessibilityDescription || '', futureTitle: item.futureTitle || '',
      futureDescription: item.futureDescription || ''
    })
    setEdit(item.id)
    setModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">About Us Content</h1>
        <button onClick={() => { setEdit(null); setForm(defaultForm); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Add</button></div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{languages.find((l) => l.id === item.languageId)?.name || `Lang ID: ${item.languageId}`}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.pageTitle}</td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => openEdit(item)} className="text-blue-600">Edit</button>
                  <button onClick={async () => { if (window.confirm('Delete?')) try { await aboutUsService.delete(item.id); showToast('Deleted', 'success'); fetch() } catch { showToast('Failed', 'error') } }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{edit ? 'Edit' : 'Add'} About Us Content</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Language</label>
                <select value={form.languageId} onChange={(e) => setForm({ ...form, languageId: e.target.value })} required className="w-full px-3 py-2 border rounded-md">
                  <option value="">Select Language</option>
                  {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Page Title</label><input type="text" required value={form.pageTitle} onChange={(e) => setForm({ ...form, pageTitle: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-sm font-medium mb-1">Page Subtitle</label><input type="text" value={form.pageSubtitle} onChange={(e) => setForm({ ...form, pageSubtitle: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
              </div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-2">Mission</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={form.missionTitle} onChange={(e) => setForm({ ...form, missionTitle: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.missionDescription} onChange={(e) => setForm({ ...form, missionDescription: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={3} /></div>
                </div>
              </div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-2">Vision</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={form.visionTitle} onChange={(e) => setForm({ ...form, visionTitle: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.visionDescription} onChange={(e) => setForm({ ...form, visionDescription: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={3} /></div>
                </div>
              </div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-2">Core Values</h3>
                {['Efficiency', 'Security', 'Accessibility'].map((val) => (
                  <div key={val} className="mb-4">
                    <h4 className="font-medium text-sm text-gray-600">{val}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <input type="text" placeholder={`${val} Title`} value={form[`${val[0].toLowerCase() + val.slice(1)}Title`] || ''} onChange={(e) => setForm({ ...form, [`${val[0].toLowerCase() + val.slice(1)}Title`]: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                      <textarea placeholder={`${val} Description`} value={form[`${val[0].toLowerCase() + val.slice(1)}Description`] || ''} onChange={(e) => setForm({ ...form, [`${val[0].toLowerCase() + val.slice(1)}Description`]: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={2} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4"><h3 className="font-semibold mb-2">Future</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" value={form.futureTitle} onChange={(e) => setForm({ ...form, futureTitle: e.target.value })} className="w-full px-3 py-2 border rounded-md" /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.futureDescription} onChange={(e) => setForm({ ...form, futureDescription: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={3} /></div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md">{edit ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setModal(false)} className="bg-gray-500 text-white px-6 py-2 rounded-md">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
