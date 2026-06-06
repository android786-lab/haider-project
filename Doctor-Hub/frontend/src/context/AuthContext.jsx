import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || ''

export const ROLE_REDIRECT = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  assistant: '/assistant/dashboard',
  admin: '/admin/dashboard',
  superadmin: '/admin/dashboard',
  super_admin: '/admin/dashboard',
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setAuthToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken)
      setToken(newToken)
    } else {
      localStorage.removeItem('token')
      setToken('')
      setUser(null)
    }
  }

  const logout = () => {
    setAuthToken(null)
  }

  const fetchUser = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        skipToast: true,
      })
      if (data.success) {
        setUser(data.user)
      } else {
        logout()
      }
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [token])

  const getRedirectPath = (role) => ROLE_REDIRECT[role === 'super_admin' ? 'superadmin' : role] || '/'

  const value = {
    token,
    user,
    loading,
    setAuthToken,
    logout,
    getRedirectPath,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthProvider
