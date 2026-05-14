import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/userService'
import { useToast } from '../context/ToastContext'
import { User, Mail, Lock } from 'lucide-react'

export default function AdminAccountSettings() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('info')
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleEmailChange = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await userService.changeEmail(emailForm)
      showToast('Email updated successfully', 'success')
      setEmailForm({ newEmail: '', password: '' })
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update email', 'error')
    } finally { setSubmitting(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', 'error'); return
    }
    try {
      setSubmitting(true)
      await userService.changePassword(passwordForm)
      showToast('Password updated successfully', 'success')
      sessionStorage.removeItem('mustChangePassword')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update password', 'error')
    } finally { setSubmitting(false) }
  }

  const tabs = [
    { id: 'info', label: 'Account Info', icon: User },
    { id: 'email', label: 'Change Email', icon: Mail },
    { id: 'password', label: 'Change Password', icon: Lock }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition
            ${activeTab === t.id ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {activeTab === 'info' && (
          <div>
            <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Account Information</h3></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm text-gray-500 mb-1">Username</label><p className="font-medium">{user?.username || 'N/A'}</p></div>
              <div><label className="block text-sm text-gray-500 mb-1">Email</label><p className="font-medium">{user?.email || 'N/A'}</p></div>
              <div><label className="block text-sm text-gray-500 mb-1">Phone</label><p className="font-medium">{user?.phone || 'N/A'}</p></div>
              <div><label className="block text-sm text-gray-500 mb-1">Role</label><p className="font-medium capitalize">{user?.role || 'N/A'}</p></div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Change Email</h3>
            <form onSubmit={handleEmailChange} className="max-w-md space-y-4">
              <input type="email" placeholder="New Email" required value={emailForm.newEmail}
                onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <input type="password" placeholder="Current Password" required value={emailForm.password}
                onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
              <input type="password" placeholder="Current Password" required value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <input type="password" placeholder="New Password" required value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <input type="password" placeholder="Confirm New Password" required value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
              <button type="submit" disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
