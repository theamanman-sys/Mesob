import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { userService } from '../services/userService'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { sessionStorage.removeItem('user') }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await userService.login(credentials)
    const result = data.data || data
    if (result.accessToken) {
      sessionStorage.setItem('accessToken', result.accessToken)
    }
    if (result.user || result.username) {
      const userData = result.user || result
      sessionStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    }
    return result
  }, [])

  const logout = useCallback(async () => {
    try { await userService.logout() } catch {}
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('user')
    setUser(null)
  }, [])

  const isAuthenticated = useCallback(() => !!sessionStorage.getItem('accessToken'), [])
  const isAdmin = useCallback(() => user?.role === 'admin', [user])

  const getProfile = useCallback(async () => {
    const { data } = await userService.getProfile()
    const profile = data.data || data
    setUser(profile)
    sessionStorage.setItem('user', JSON.stringify(profile))
    return profile
  }, [])

  const getAllUsers = useCallback(async (page = 1, limit = 10) => {
    const { data } = await userService.getAllUsers(page, limit)
    return data.data || data
  }, [])

  const deactivateUser = useCallback((id) => userService.deactivateUser(id), [])
  const activateUser = useCallback((id) => userService.activateUser(id), [])
  const unblockUser = useCallback((id) => userService.unblockUser(id), [])
  const deleteUser = useCallback((id) => userService.deleteUser(id), [])
  const resetUserPassword = useCallback(async (id) => {
    const { data } = await userService.resetPassword(id)
    return data.data || data
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, isAuthenticated, isAdmin, getProfile,
      getAllUsers, deactivateUser, activateUser, unblockUser, deleteUser, resetUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}
