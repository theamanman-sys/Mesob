import { useState, useEffect } from 'react'
import { bannerService } from '../services/bannerService'
import { useToast } from '../context/ToastContext'

export default function AdminBanner() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ languageId: '', title: '', subtitle: '', description: '', imageUrl: '', isActive: true })
  const { showToast } = useToast()
  const fetch = async () => { try { const { data } = await bannerService.getAll(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try { edit ? await bannerService.update(edit, form) : await bannerService.create(form); showToast(`Banner ${edit ? 'updated' : 'created'}`, 'success'); setModal(false); setEdit(null); setForm({ languageId: '', title: '', subtitle: '', description: '', imageUrl: '', isActive: true }); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed to save', 'error') }
  }

  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await bannerService.delete(id); showToast('Deleted', 'success'); fetch() } catch (err) { showToast('Failed to delete', 'error') } }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Banner Data</h1>
        <button onClick={() => { setEdit(null); setForm({ languageId: '', title: '', subtitle: '', description: '', imageUrl: '', isActive: true }); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Add Banner</button></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm">{item.id}</td>
                <td className="px-6 py-4 text-sm">{item.title}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => { setForm({ languageId: item.languageId || '', title: item.title || '', subtitle: item.subtitle || '', description: item.description || '', imageUrl: item.imageUrl || '', isActive: item.isActive ?? true }); setEdit(item.id); setModal(true) }} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="text-center py-8 text-gray-500">No banner data found.</div>}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">{edit ? 'Edit Banner' : 'Add Banner'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Language ID" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: e.target.value })} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <input type="text" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <input type="text" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" rows={3} />
              <input type="text" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <label className="flex items-center"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="mr-2" /> Active</label>
              <div className="flex space-x-3">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{edit ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
