import { useState, useEffect } from 'react'
import { serviceService } from '../services/serviceService'
import { useToast } from '../context/ToastContext'

export default function AdminServices() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', organizationId: '', languageId: '', isActive: true })
  const { showToast } = useToast()

  const fetch = async () => { try { const { data } = await serviceService.getWithLanguageAndOrganization(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try { edit ? await serviceService.update(edit, form) : await serviceService.create(form); showToast(`Service ${edit ? 'updated' : 'created'}`, 'success'); setModal(false); setEdit(null); setForm({ title: '', description: '', organizationId: '', languageId: '', isActive: true }); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Services</h1>
        <button onClick={() => { setEdit(null); setForm({ title: '', description: '', organizationId: '', languageId: '', isActive: true }); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Add Service</button></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.title}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => { setForm({ title: item.title, description: item.description || '', organizationId: item.organizationId || '', languageId: item.languageId || '', isActive: item.isActive ?? true }); setEdit(item.id); setModal(true) }} className="text-blue-600">Edit</button>
                  <button onClick={async () => { if (window.confirm('Delete?')) try { await serviceService.delete(item.id); showToast('Deleted', 'success'); fetch() } catch { showToast('Failed', 'error') } }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">{edit ? 'Edit' : 'Add'} Service</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={3} />
              <input type="text" placeholder="Organization ID" value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              <input type="text" placeholder="Language ID" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              <label className="flex items-center"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="mr-2" /> Active</label>
              <div className="flex space-x-3">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md">{edit ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
