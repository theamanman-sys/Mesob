import { useState, useEffect } from 'react'
import { languageService } from '../services/languageService'
import { useToast } from '../context/ToastContext'

export default function AdminLanguages() {
  const [languages, setLanguages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', isActive: true })
  const { showToast } = useToast()

  const fetch = async () => {
    try {
      const { data } = await languageService.getAll()
      setLanguages(data.data || data || [])
    } catch { setLanguages([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await languageService.update(editing, form)
        showToast('Language updated successfully', 'success')
      } else {
        await languageService.create(form)
        showToast('Language created successfully', 'success')
      }
      setModalOpen(false)
      setEditing(null)
      setForm({ name: '', code: '', isActive: true })
      fetch()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save language', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this language?')) return
    try {
      await languageService.delete(id)
      showToast('Language deleted', 'success')
      fetch()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete', 'error')
    }
  }

  const openEdit = (lang) => {
    setForm({ name: lang.name, code: lang.code, isActive: lang.isActive ?? true })
    setEditing(lang.id)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Languages</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', code: '', isActive: true }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Add Language
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {languages.map((lang) => (
              <tr key={lang.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm text-gray-900">{lang.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{lang.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{lang.code}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${lang.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {lang.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button onClick={() => openEdit(lang)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(lang.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {languages.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">No languages found.</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editing ? 'Edit Language' : 'Add Language'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                <input type="text" required value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
