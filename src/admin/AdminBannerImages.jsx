import { useState, useEffect } from 'react'
import { bannerImageService } from '../services/bannerImageService'
import { uploadService } from '../services/uploadService'
import { useToast } from '../context/ToastContext'

const API_BASE = 'https://mesobportalback.mesobcenter.et'

export default function AdminBannerImages() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ imageUrl: '', isActive: true })
  const [file, setFile] = useState(null); const [preview, setPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const { showToast } = useToast()

  const fetch = async () => { try { const { data } = await bannerImageService.getAll(); setItems(data.data || data || []) } catch {} finally { setLoading(false) } }
  useEffect(() => { fetch() }, [])

  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)) } }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let url = form.imageUrl
    if (file) { setUploading(true); try { const { data } = await uploadService.uploadSingle(file, 'image'); url = data.path || data.data?.path || url } catch { showToast('Upload failed', 'error'); setUploading(false); return } setUploading(false) }
    try { edit ? await bannerImageService.update(edit, { ...form, imageUrl: url }) : await bannerImageService.create({ ...form, imageUrl: url }); showToast(`Banner image ${edit ? 'updated' : 'created'}`, 'success'); setModal(false); setEdit(null); setForm({ imageUrl: '', isActive: true }); setFile(null); setPreview(''); fetch() }
    catch (err) { showToast(err?.response?.data?.message || 'Failed', 'error') }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Banner Images</h1>
        <button onClick={() => { setEdit(null); setForm({ imageUrl: '', isActive: true }); setFile(null); setPreview(''); setModal(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Add Image</button></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{item.id}</td>
                <td className="px-6 py-4"><img src={`${API_BASE}${item.imageUrl}`} alt="" className="h-16 w-auto object-contain border rounded" /></td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => { setForm({ imageUrl: item.imageUrl || '', isActive: item.isActive ?? true }); setEdit(item.id); setModal(true) }} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={async () => { if (window.confirm('Delete?')) try { await bannerImageService.delete(item.id); showToast('Deleted', 'success'); fetch() } catch { showToast('Failed', 'error') } }} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="text-center py-8 text-gray-500">No banner images found.</div>}
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">{edit ? 'Edit' : 'Add'} Banner Image</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="file" accept="image/*" onChange={handleFile} className="w-full" />
              {preview && <img src={preview} alt="preview" className="h-32 w-auto object-contain border rounded" />}
              {form.imageUrl && !file && <div><p className="text-sm text-gray-500 mb-1">Current:</p><img src={`${API_BASE}${form.imageUrl}`} alt="" className="h-32 w-auto object-contain border rounded" /></div>}
              <label className="flex items-center"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="mr-2" /> Active</label>
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
