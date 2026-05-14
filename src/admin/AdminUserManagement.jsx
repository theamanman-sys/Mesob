import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePagination } from '../hooks/usePagination'

function PasswordResetModal({ isOpen, username, password, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!isOpen) return null
  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { const el = document.createElement('textarea'); el.value = password; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Password Reset</h2>
        <p className="mb-2">New password for <strong>{username}</strong>:</p>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4">
          <code className="flex-1 text-sm">{password}</code>
          <button onClick={copyToClipboard} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-md">Close</button>
      </div>
    </div>
  )
}

export default function AdminUserManagement() {
  const { user: currentUser, getAllUsers, deactivateUser, activateUser, unblockUser, deleteUser, resetUserPassword, isAdmin } = useAuth()
  const { showToast } = useToast()
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, username: '', password: '' })
  const { data: users, pagination, loading, refresh, page, setPage } = usePagination(getAllUsers, 10)

  if (!isAdmin()) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-gray-600">You need admin privileges to access user management.</p>
      </div>
    </div>
  )

  const handleDeactivate = async (id, username) => {
    if (username === currentUser?.username) { showToast('You cannot deactivate your own account', 'error'); return }
    try { await deactivateUser(id); showToast('User deactivated', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }

  const handleActivate = async (id) => {
    try { await activateUser(id); showToast('User activated', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }

  const handleUnblock = async (id) => {
    try { await unblockUser(id); showToast('User unblocked', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }

  const handleResetPassword = async (id, username) => {
    if (username === currentUser?.username) { showToast('You cannot reset your own password', 'error'); return }
    if (!window.confirm(`Reset password for "${username}"? A new password will be generated.`)) return
    try { const result = await resetUserPassword(id); result?.newPassword && setPasswordModal({ isOpen: true, username, password: result.newPassword }) }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }

  const handleDelete = async (id, username) => {
    if (username === currentUser?.username) { showToast('You cannot delete your own account', 'error'); return }
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try { await deleteUser(id); showToast('User deleted', 'success'); refresh() }
    catch (err) { showToast(err?.message || 'Failed', 'error') }
  }

  const isBlocked = (user) => user.blockedUntil ? new Date(user.blockedUntil) > new Date() : false

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="text-sm text-gray-600">Total: {pagination?.totalItems ?? users.length}</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 text-sm font-medium">{u.username}</td>
                <td className="px-6 py-4 text-sm">{u.email}</td>
                <td className="px-6 py-4 text-sm capitalize">{u.role}</td>
                <td className="px-6 py-4">
                  {isBlocked(u) ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Blocked</span>
                  ) : u.isActive !== false ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  {u.isActive !== false
                    ? <button onClick={() => handleDeactivate(u.id, u.username)} className="text-yellow-600">Deactivate</button>
                    : <button onClick={() => handleActivate(u.id)} className="text-green-600">Activate</button>}
                  {isBlocked(u) && <button onClick={() => handleUnblock(u.id)} className="text-blue-600">Unblock</button>}
                  <button onClick={() => handleResetPassword(u.id, u.username)} className="text-purple-600">Reset Pwd</button>
                  <button onClick={() => handleDelete(u.id, u.username)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && <div className="text-center py-8 text-gray-500">No users found.</div>}
      </div>
      {pagination?.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${page === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
      <PasswordResetModal {...passwordModal} onClose={() => setPasswordModal({ isOpen: false, username: '', password: '' })} />
    </div>
  )
}
