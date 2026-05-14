import { useState, useEffect } from 'react'
import { advImageService } from '../services/advImageService'
import { uploadService } from '../services/uploadService'
import { useToast } from '../context/ToastContext'

const API_BASE = 'https://mesobportalback.mesobcenter.et'

export default function AdminAdvImage() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ path: '', status: true })
  const [file, setFile] = useState(null); const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  const fetch = async () => { try { const { data } = await advImageService.getAll(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch() }, [])

  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)) } }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let path = form.path
    if (file) { setUploading(true); try { const { data } = await uploadService.uploadSingle(file, 'image'); path = data.path || data.data?.path || path } catch { showToast('Upload failed', 'error'); setUploading(false); return } setUploading(false) }
    try { edit ? await advImageService.update(edit, { path, status: form.status }) : await advImageService.create({ path, status: form.status }); showToast(`Saved`, 'success'); setModal(false); setEdit(null); setForm({ path: '', status: true }); setFile(null); setPreview(''); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
  }

  const toggleStatus = async (id, current) => {
    try { await advImageService.updateStatus(id, !current); showToast('Status updated', 'success'); fetch() }
    catch { showToast('Failed', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Advertisement Images</h1>
        <button onClick={() => { setEdit(null); setForm({ path: '', status: true }); setFile(null); setPreview(''); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Add</button></div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.id}</td>
                <td className="px-6 py-4"><img src={`${API_BASE}${item.path}`} alt="" className="h-16 w-auto object-contain border rounded" /></td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(item.id, item.status)} className={`px-2 py-1 text-xs rounded-full ${item.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status ? 'Active' : 'Inactive'}</button>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => { setForm({ path: item.path || '', status: item.status ?? true }); setEdit(item.id); setModal(true) }} className="text-blue-600">Edit</button>
                  <button onClick={async () => { if (window.confirm('Delete?')) try { await advImageService.delete(item.id); showToast('Deleted', 'success'); fetch() } catch { showToast('Failed', 'error') } }} className="text-red-600">Delete</button>
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
              <input type="file" accept="image/*" onChange={handleFile} className="w-full" />
              {preview && <img src={preview} alt="preview" className="h-32 w-auto object-contain border rounded" />}
              {form.path && !file && <div><p className="text-sm text-gray-500">Current:</p><img src={`${API_BASE}${form.path}`} alt="" className="h-32 w-auto object-contain border rounded" /></div>}
              <label className="flex items-center"><input type="checkbox" checked={form.status} onChange={(e) => setForm({ ...form, status: e.target.checked })} className="mr-2" /> Active</label>
              <div className="flex space-x-3">
                <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded-md">{uploading ? 'Uploading...' : edit ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded-md">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
