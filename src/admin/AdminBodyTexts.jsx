import { useState, useEffect } from 'react'
import { bodyTextService } from '../services/bodyTextService'
import { useToast } from '../context/ToastContext'

export default function AdminBodyTexts() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ key: '', content: '', languageId: '', isActive: true })
  const { showToast } = useToast()

  const fetch = async () => { try { const { data } = await bodyTextService.getAll(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try { edit ? await bodyTextService.update(edit, form) : await bodyTextService.create(form); showToast(`Saved`, 'success'); setModal(false); setEdit(null); setForm({ key: '', content: '', languageId: '', isActive: true }); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Body Texts</h1>
        <button onClick={() => { setEdit(null); setForm({ key: '', content: '', languageId: '', isActive: true }); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Add</button></div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{item.key}</td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => { setForm({ key: item.key, content: item.content || '', languageId: item.languageId || '', isActive: item.isActive ?? true }); setEdit(item.id); setModal(true) }} className="text-blue-600">Edit</button>
                  <button onClick={async () => { if (window.confirm('Delete?')) try { await bodyTextService.delete(item.id); showToast('Deleted', 'success'); fetch() } catch { showToast('Failed', 'error') } }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Key" required value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              <textarea placeholder="Content" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={4} />
              <input type="text" placeholder="Language ID" value={form.languageId} onChange={(e) => setForm({ ...form, languageId: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
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
