export function dashboardPathFor(role) {
  if (role === 'municipal') return '/municipal/dashboard'
  if (role === 'contractor') return '/contractor/dashboard'
  return '/citizen/dashboard'
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

export function getSeverityColor(severity) {
  const colors = {
    low: 'text-emerald-800 bg-emerald-100 border border-emerald-300',
    medium: 'text-amber-800 bg-amber-100 border border-amber-300',
    high: 'text-orange-800 bg-orange-100 border border-orange-300',
    critical: 'text-red-800 bg-red-100 border border-red-300'
  }
  return colors[severity] || colors.low
}

export function getSeverityBadgeVariant(severity) {
  if (severity === 'critical') return 'danger'
  if (severity === 'high') return 'warning'
  if (severity === 'medium') return 'primary'
  return 'success'
}

export function getSeverityLabel(severity) {
  return severity.charAt(0).toUpperCase() + severity.slice(1)
}

export function getStatusColor(status) {
  const colors = {
    REPORTED: 'text-sky-800 bg-sky-100 border border-sky-300',
    ASSIGNED: 'text-indigo-800 bg-indigo-100 border border-indigo-300',
    UNDER_REPAIR: 'text-orange-800 bg-orange-100 border border-orange-300',
    VERIFICATION: 'text-cyan-800 bg-cyan-100 border border-cyan-300',
    VERIFIED: 'text-emerald-800 bg-emerald-100 border border-emerald-300',
    MANUAL_REVIEW: 'text-amber-800 bg-amber-100 border border-amber-300',
    REJECTED: 'text-red-800 bg-red-100 border border-red-300',
    RESOLVED: 'text-slate-700 bg-slate-100 border border-slate-300'
  }
  return colors[status] || colors.REPORTED
}

export const IMAGE_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="#1e293b" width="80" height="80"/><circle cx="40" cy="34" r="10" fill="#475569"/><path d="M20 58c0-8 9-14 20-14s20 6 20 14" fill="none" stroke="#475569" stroke-width="3"/></svg>'
)

export function getBadgeVariant(status) {
  if (status === 'VERIFIED' || status === 'RESOLVED') return 'success'
  if (status === 'MANUAL_REVIEW' || status === 'UNDER_REPAIR') return 'warning'
  if (status === 'REJECTED') return 'danger'
  if (status === 'ASSIGNED') return 'purple'
  if (status === 'VERIFICATION') return 'primary'
  return 'primary'
}

export function getStatusLabel(status) {
  return status.replace(/_/g, ' ')
}

export function getDecisionColor(decision) {
  const colors = {
    VERIFIED: 'text-emerald-700',
    MANUAL_REVIEW: 'text-amber-700',
    REJECTED: 'text-red-700'
  }
  return colors[decision] || 'text-slate-500'
}

export function getConfidenceColor(confidence) {
  const colors = {
    HIGH: 'text-emerald-700',
    MEDIUM: 'text-amber-700',
    LOW: 'text-red-700'
  }
  return colors[confidence] || 'text-slate-500'
}

export function getScoreColor(score, max) {
  const percentage = (score / max) * 100
  if (percentage >= 80) return 'text-emerald-700'
  if (percentage >= 60) return 'text-amber-700'
  return 'text-red-700'
}

export function getScoreBarColor(score, max) {
  const percentage = (score / max) * 100
  if (percentage >= 80) return 'bg-emerald-500'
  if (percentage >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Please upload JPEG, PNG, or WebP.'
  }

  if (file.size > maxSize) {
    return 'File too large. Maximum size is 10MB.'
  }

  return null
}

export function createObjectURL(file) {
  return URL.createObjectURL(file)
}

export function revokeObjectURL(url) {
  URL.revokeObjectURL(url)
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function generateComplaintId() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `FM-${year}-${random}`
}