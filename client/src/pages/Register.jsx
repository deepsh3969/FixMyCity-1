import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Phone, MapPin, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { Button, Input, Select } from '../components/UI'
import BrandLogo from '../components/BrandLogo'
import { dashboardPathFor } from '../utils/helpers'

const roleOptions = [
  { value: 'citizen', label: 'Citizen - Report potholes' },
  { value: 'contractor', label: 'Contractor - Repair potholes' },
  { value: 'municipal', label: 'Municipal Officer - Manage complaints' }
]

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
    phone: '',
    address: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillRole = searchParams.get('role')

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.role) newErrors.role = 'Role is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setLoading(true)
    setErrors({})
    
    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        address: formData.address
      })
      setSuccess(true)
      const redirect = searchParams.get('redirect') || dashboardPathFor(user?.role || formData.role)
      setTimeout(() => navigate(redirect, { replace: true }), 1500)
    } catch (err) {
      setErrors({ form: err.response?.data?.error || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass p-8 relative overflow-hidden text-center animate-slide-up">
            <div className="absolute -top-24 -left-24 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-green-dim)] border border-[rgba(16,185,129,0.4)] flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <CheckCircle className="w-8 h-8 text-[var(--accent-green)]" />
              </div>
              <p className="tech-label text-[var(--accent-green)] mb-2">Account Verified</p>
              <h1 className="text-2xl font-bold mb-2 gradient-text">Account Created!</h1>
              <p className="text-sm text-[var(--text-muted)]">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass p-8 relative overflow-hidden animate-slide-up">
          <div className="absolute -top-24 -left-24 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-4 group">
              <BrandLogo
                variant="lg"
                className="transition-transform duration-300 group-hover:scale-105 glow-cyan"
              />
              <span className="flex flex-col items-center gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text leading-none">
                  FixMyCity
                </span>
                <span className="tech-label text-[var(--accent-cyan)] mt-2">
                  Smart City · Pothole Intelligence
                </span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold mt-6 mb-1 gradient-text">Create Account</h1>
            <p className="text-sm text-[var(--text-muted)]">Join the smart city repair verification network</p>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-4">
            {errors.form && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <Input
              label={<span className="tech-label">Full Name</span>}
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Aarav Sharma"
              required
              error={errors.name}
              icon={<User className="w-5 h-5" />}
              autoComplete="name"
            />

            <Input
              label={<span className="tech-label">Email</span>}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label={<span className="tech-label">Password</span>}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                error={errors.password}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label={<span className="tech-label">Confirm Password</span>}
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              error={errors.confirmPassword}
              icon={<Lock className="w-5 h-5" />}
              autoComplete="new-password"
            />

            <Select
              label={<span className="tech-label">Role</span>}
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roleOptions}
              placeholder="Select your role"
              required
              error={errors.role}
              icon={<Shield className="w-5 h-5" />}
            />

            <Input
              label={<span className="tech-label">Phone (Optional)</span>}
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              icon={<Phone className="w-5 h-5" />}
              autoComplete="tel"
            />

            <Input
              label={<span className="tech-label">Address (Optional)</span>}
              name="address"
              type="text"
              value={formData.address}
              onChange={handleChange}
              placeholder="Pokhran Road No. 2, Thane West"
              icon={<MapPin className="w-5 h-5" />}
              autoComplete="street-address"
            />

            <Button type="submit" className="w-full btn-glow uppercase tracking-[0.18em] font-bold text-sm" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--accent-cyan)] hover:text-cyan-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
