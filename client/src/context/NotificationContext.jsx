import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    setLoading(true)
    try {
      const response = await api.get('/notifications', { params: { limit: 50 } })
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchNotifications()
    }
  }, [authLoading, fetchNotifications])

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      // ignore
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (error) {
      // ignore
    }
  }

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev])
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1)
    }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
