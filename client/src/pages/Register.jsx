import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { Button, Input, Select, Card, CardContent } from '../components/UI'
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
          <p className="text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">FixMyCity</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-slate-500">Join the smart city repair verification network</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.form && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <Input
                label="Full Name"
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
                label="Email"
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
                  label="Password"
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
                  className="absolute right-4 top-[38px] text-slate-500 hover:text-slate-900 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
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
                label="Role"
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
                label="Phone (Optional)"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                icon={<Phone className="w-5 h-5" />}
                autoComplete="tel"
              />

              <Input
                label="Address (Optional)"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                placeholder="Pokhran Road No. 2, Thane West"
                icon={<MapPin className="w-5 h-5" />}
                autoComplete="street-address"
              />

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}