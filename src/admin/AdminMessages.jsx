import { useState, useEffect } from 'react'
import { messageService } from '../services/messageService'
import { useToast } from '../context/ToastContext'

export default function AdminMessages() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewModal, setViewModal] = useState(false); const [selected, setSelected] = useState(null)
  const { showToast } = useToast()

  const fetch = async () => {
    try {
      const params = { page: 1, limit: 50 }
      if (search) params.search = search
      const { data } = await messageService.getAll(params.page, params.limit, search ? { search } : {})
      setItems(data.data || data || [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetch() }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-bold">Messages</h1>
        <div className="flex space-x-2">
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
          <button onClick={fetch} className="bg-blue-600 text-white px-4 py-2 rounded-md">Filter</button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                <td className="px-6 py-4 text-sm">{item.email}</td>
                <td className="px-6 py-4 text-sm">{item.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">
                  <button onClick={() => { setSelected(item); setViewModal(true) }} className="text-blue-600">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="text-center py-8 text-gray-500">No messages found.</div>}
      </div>
      {viewModal && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Message Details</h2>
            <div className="space-y-4">
              <div><label className="text-xs uppercase tracking-wide text-gray-500">Name</label><p className="text-gray-900">{selected.name}</p></div>
              <div><label className="text-xs uppercase tracking-wide text-gray-500">Email</label><p className="text-gray-900">{selected.email}</p></div>
              <div><label className="text-xs uppercase tracking-wide text-gray-500">Phone</label><p className="text-gray-900">{selected.phone || 'N/A'}</p></div>
              <div><label className="text-xs uppercase tracking-wide text-gray-500">Message</label><p className="text-gray-900 whitespace-pre-line">{selected.message}</p></div>
              {selected.createdAt && <div><label className="text-xs uppercase tracking-wide text-gray-500">Date</label><p className="text-gray-900">{new Date(selected.createdAt).toLocaleString()}</p></div>}
            </div>
            <button onClick={() => setViewModal(false)} className="mt-6 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
