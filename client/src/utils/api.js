import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      const path = window.location.pathname
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me')
}

export const complaintAPI = {
  create: (data) => api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: (params) => api.get('/complaints/my', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getAll: (params) => api.get('/complaints', { params }),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  assignContractor: (id, contractorId) => api.post(`/complaints/${id}/assign`, { contractorId }),
  getStats: () => api.get('/complaints/stats'),
  getContractors: () => api.get('/complaints/contractors')
}

export const contractorAPI = {
  getAssignments: (params) => api.get('/contractor', { params }),
  getAssignmentById: (id) => api.get(`/contractor/${id}`),
  startRepair: (id) => api.post(`/contractor/${id}/start-repair`),
  submitRepair: (id, data) => api.post(`/contractor/${id}/repair-submission`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
}

export default api
