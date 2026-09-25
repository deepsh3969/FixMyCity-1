import { forwardRef, cloneElement, isValidElement, useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'

export const Button = forwardRef(function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled, 
  loading, 
  asChild = false,
  ...props 
}, ref) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-gradient-to-r from-[var(--accent-cyan)] to-cyan-500 text-[#030712] font-semibold hover:brightness-110 focus:ring-[var(--accent-cyan)] shadow-[0_0_18px_rgba(34,211,238,0.35)]',
    secondary: 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] focus:ring-[var(--border-default)] border border-[var(--border-subtle)] shadow-sm',
    outline: 'bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] focus:ring-[var(--border-default)] border border-[var(--border-default)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] focus:ring-[var(--border-default)]',
    danger: 'bg-[var(--accent-red)] text-white hover:brightness-110 focus:ring-[var(--accent-red)] shadow-sm',
    success: 'bg-[var(--accent-green)] text-white hover:brightness-110 focus:ring-[var(--accent-green)] shadow-sm'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3'
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ref,
      className: `${combinedClassName} ${children.props.className || ''}`.trim(),
      disabled: disabled || loading,
      ...props
    })
  }

  return (
    <button
      ref={ref}
      className={combinedClassName}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export const Input = forwardRef(function Input({ 
  label, 
  error, 
  className = '', 
  id, 
  ...props 
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border ${error ? 'border-[var(--accent-red)]' : 'border-[var(--border-default)]'} text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] transition-all ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-[var(--accent-red)]">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef(function Textarea({ 
  label, 
  error, 
  className = '', 
  id, 
  ...props 
}, ref) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border ${error ? 'border-[var(--accent-red)]' : 'border-[var(--border-default)]'} text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] transition-all resize-none ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-[var(--accent-red)]">{error}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export const Select = forwardRef(function Select({ 
  label, 
  error, 
  options = [], 
  className = '', 
  id, 
  placeholder,
  ...props 
}, ref) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={`w-full px-4 py-2.5 rounded-lg bg-[var(--bg-input)] border ${error ? 'border-[var(--accent-red)]' : 'border-[var(--border-default)]'} text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] transition-all appearance-none`}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-[var(--accent-red)]">{error}</p>}
    </div>
  )
})

Select.displayName = 'Select'

export const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-[var(--bg-card)] backdrop-blur-[10px] border border-[var(--border-subtle)] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${hover ? 'hover:border-[var(--border-default)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.45)] transition-all duration-200' : 'transition-colors duration-200'} ${className}`}>
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-[var(--border-subtle)] ${className}`}>
    {children}
  </div>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
)

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-base)] rounded-b-[14px] ${className}`}>
    {children}
  </div>
)

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/5 text-[var(--text-secondary)] border border-white/10',
    primary: 'bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[rgba(34,211,238,0.4)]',
    success: 'bg-[var(--accent-green-dim)] text-[var(--accent-green)] border border-[rgba(16,185,129,0.4)]',
    warning: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[rgba(245,158,11,0.4)]',
    danger: 'bg-[var(--accent-red-dim)] text-[var(--accent-red)] border border-[rgba(239,68,68,0.4)]',
    purple: 'bg-[var(--accent-purple-dim)] text-[var(--accent-purple)] border border-[rgba(139,92,246,0.4)]'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-[var(--border-subtle)] rounded ${className}`} />
)

export const CoordsBadge = ({ latitude, longitude, className = '', showDetailsLabel = false }) => {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const badge = (
    <span
      title={`GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
      className="inline-flex items-center text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] px-2 py-0.5 rounded"
    >
      {lat.toFixed(5)}, {lng.toFixed(5)}
    </span>
  )
  if (!showDetailsLabel) {
    return <span className={className}>{badge}</span>
  }
  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Location Details</span>
      {badge}
    </span>
  )
}

export const SkeletonList = ({ rows = 3 }) => (
  <div className="divide-y divide-[var(--border-subtle)]">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 flex gap-4">
        <Skeleton className="w-20 h-20 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
)

export const ProgressBar = ({ value, max = 100, className = '', showLabel = true, color }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor = color || (percentage >= 80 ? 'bg-[var(--accent-green)]' : percentage >= 60 ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-red)]')
  
  return (
    <div className={className}>
      <div className="h-2.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
        <div 
          className={`${barColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
          <span>{value}/{max}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
}

export const Alert = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    info: 'bg-[var(--accent-blue-dim)] border-[var(--accent-blue)] text-[var(--accent-blue)]',
    success: 'bg-[var(--accent-green-dim)] border-[var(--accent-green)] text-[var(--accent-green)]',
    warning: 'bg-[var(--accent-amber-dim)] border-[var(--accent-amber)] text-[var(--accent-amber)]',
    error: 'bg-[var(--accent-red-dim)] border-[var(--accent-red)] text-[var(--accent-red)]'
  }
  return (
    <div className={`p-4 rounded-lg border ${variants[variant]} ${className}`}>
      {children}
    </div>
  )
}

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-3',
    lg: 'w-10 h-10 border-3',
    xl: 'w-16 h-16 border-4'
  }
  return (
    <div className={`${sizes[size]} border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin ${className}`} />
  )
}

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-[var(--accent-cyan-dim)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-cyan)] mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
    <p className="text-[var(--text-muted)] mb-6 max-w-sm">{description}</p>
    {action}
  </div>
)

export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-xl ${className}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export const Tabs = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`flex gap-1 bg-[var(--bg-card-hover)] rounded-lg p-1 ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-150 ${
          activeTab === tab.id
            ? 'bg-[var(--accent-cyan)] text-[#030712] font-semibold shadow-[0_0_16px_rgba(34,211,238,0.4)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
)

export const TabPanel = ({ activeTab, tabId, children }) => {
  if (activeTab !== tabId) return null
  return <div>{children}</div>
}

export const Avatar = ({ src, alt, name, size = 'md', className = '', status, statusPosition = 'bottom-right' }) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  }
  const statusSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  }
  const statusColors = {
    online: 'var(--accent-green)',
    away: 'var(--accent-amber)',
    busy: 'var(--accent-red)',
    offline: 'var(--text-muted)'
  }
  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img src={src} alt={alt || name} className={`rounded-full object-cover ${sizes[size]}`} />
      ) : (
        <div className={`flex items-center justify-center bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white font-medium ${sizes[size]} rounded-full`}>
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`absolute rounded-full border-2 border-[var(--bg-card)] ${statusSizes[size] || statusSizes.md} ${
            statusPosition === 'bottom-right' ? 'bottom-0 right-0' : ''
          } ${statusPosition === 'bottom-left' ? 'bottom-0 left-0' : ''} ${
            statusPosition === 'top-right' ? 'top-0 right-0' : ''
          } ${statusPosition === 'top-left' ? 'top-0 left-0' : ''}`}
          style={{ backgroundColor: statusColors[status] || statusColors.online }}
        />
      )}
    </div>
  )
}

export const Dropdown = ({ trigger, items, align = 'right', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute z-[var(--z-floating)] mt-2 min-w-[200px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl ${align === 'right' ? 'right-0' : 'left-0'}`}
          role="menu"
        >
          <div className="py-1">
            {items.map((item, index) =>
              item.divider ? (
                <hr key={index} className="my-1 border-[var(--border-subtle)]" />
              ) : (
                <button
                  key={item.key || index}
                  onClick={() => {
                    item.onClick?.()
                    if (!item.keepOpen) setIsOpen(false)
                  }}
                  disabled={item.disabled}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] ${item.danger ? 'text-[var(--accent-red)] hover:bg-[var(--accent-red-dim)]' : ''}`}
                  role="menuitem"
                >
                  {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const DropdownItem = ({ label, onClick, icon, disabled, danger, divider }) => {
  if (divider) return <hr className="my-1 border-[var(--border-subtle)]" />
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] ${danger ? 'text-[var(--accent-red)] hover:bg-[var(--accent-red-dim)]' : ''}`}
    >
      {icon && <span className="w-5 h-5 flex-shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  )
}

export function Breadcrumbs({ items = [] }) {
  if (!items.length) return null
  return (
    <nav className="flex items-center gap-1 text-sm mb-2" aria-label="Breadcrumb">
      <NavLink to="/" className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <Home className="w-3.5 h-3.5" />
      </NavLink>
      {items.map((item, index) => (
        <span key={item.path || index} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          {item.path ? (
            <NavLink to={item.path} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium">
              {item.label}
            </NavLink>
          ) : (
            <span className="text-[var(--text-primary)] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}