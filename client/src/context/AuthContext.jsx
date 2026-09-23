import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData)
    const { user, token } = response.data
    localStorage.setItem('token', token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    api.post('/auth/logout').catch(() => {})
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
