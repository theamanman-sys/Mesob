import { useState, useEffect } from 'react'
import { newsUiTextService } from '../services/newsUiTextService'
import { languageService } from '../services/languageService'
import { useToast } from '../context/ToastContext'

const defaultForm = {
  languageId: '', title: '', latestNews: '', allCategories: '', showLess: '', viewMore: '',
  showLessNews: '', viewMoreNews: '', readMoreAt: '', more: '', minRead: '',
  documentsRequired: '', document: '', noServicesFound: '', tryDifferentTerm: '',
  clearSearch: '', institutions: '', services: '', of: '', found: '', close: '',
  Government: '', Investment: '', Technology: '', Education: '', Security: ''
}

export default function AdminNewsUiText() {
  const [items, setItems] = useState([]); const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null); const [form, setForm] = useState(defaultForm)
  const { showToast } = useToast()

  const fetch = async () => { try { const { data } = await newsUiTextService.getAll(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch(); (async () => { try { const { data } = await languageService.getAll(); setLanguages(data.data || data || []) } catch { setLanguages([]) } })() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try { edit ? await newsUiTextService.update(edit, form) : await newsUiTextService.create(form); showToast(`Saved`, 'success'); setModal(false); setEdit(null); setForm(defaultForm); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
  }

  const renderField = (field, label) => (
    <div key={field}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
    </div>
  )

  const fieldGroups = [
    { label: 'Categories', fields: ['latestNews', 'allCategories'] },
    { label: 'Actions', fields: ['showLess', 'viewMore', 'showLessNews', 'viewMoreNews', 'readMoreAt', 'more', 'minRead'] },
    { label: 'Documents', fields: ['documentsRequired', 'document'] },
    { label: 'Search', fields: ['noServicesFound', 'tryDifferentTerm', 'clearSearch'] },
    { label: 'Navigation', fields: ['institutions', 'services', 'of', 'found', 'close'] },
    { label: 'Categories', fields: ['Government', 'Investment', 'Technology', 'Education', 'Security'] }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">News UI Text</h1>
        <button onClick={() => { setEdit(null); setForm(defaultForm); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Add</button></div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{item.title}</td>
                <td className="px-6 py-4 text-sm">{languages.find((l) => l.id === item.languageId)?.name || `Lang ID: ${item.languageId}`}</td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => { setForm({ ...defaultForm, ...item }); setEdit(item.id); setModal(true) }} className="text-blue-600">Edit</button>
                  <button onClick={async () => { if (window.confirm('Delete?')) try { await newsUiTextService.delete(item.id); showToast('Deleted', 'success'); fetch() } catch { showToast('Failed', 'error') } }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{edit ? 'Edit' : 'Add'} News UI Text</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select value={form.languageId} onChange={(e) => setForm({ ...form, languageId: e.target.value })} required className="w-full px-3 py-2 border rounded-md">
                    <option value="">Select Language</option>
                    {languages.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                  </select>
                </div>
                {renderField('title', 'Title')}
              </div>
              {fieldGroups.map((group) => (
                <div key={group.label} className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{group.label}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {group.fields.map((f) => renderField(f, f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())))}
                  </div>
                </div>
              ))}
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
