import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button, Input } from '../components/UI'
import BrandLogo from '../components/BrandLogo'
import { dashboardPathFor } from '../utils/helpers'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const user = await login(email, password)
      const redirect = searchParams.get('redirect') || dashboardPathFor(user?.role)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="glass p-8 relative overflow-hidden animate-slide-up">
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-4 group">
              <BrandLogo
                variant="xl"
                className="transition-transform duration-300 group-hover:scale-105 glow-cyan"
              />
              <span className="flex flex-col items-center gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text leading-none">
                  Smart Pothole Intelligence
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--accent-cyan)] mt-2">
                  FixMyCity · Smart City Command
                </span>
              </span>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              icon={<Mail className="w-5 h-5" />}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                icon={<Lock className="w-5 h-5" />}
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[var(--text-muted)] cursor-pointer select-none">
                <input type="checkbox" className="w-3.5 h-3.5 accent-cyan-400" aria-label="Remember me" />
                Remember me
              </label>
              <Link to="/login" className="text-[var(--accent-cyan)] hover:text-cyan-300 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full btn-glow uppercase tracking-[0.18em] font-bold text-sm" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[var(--accent-cyan)] hover:text-cyan-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="relative mt-6 p-4 bg-black/30 border border-[var(--border-subtle)] rounded-xl">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] mb-3 font-bold">Demo Credentials</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Citizen · Aarav Sharma:</span>
                <code className="text-[var(--accent-cyan)] bg-white/5 px-1.5 py-0.5 rounded">citizen@fixmycity.com</code>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Contractor · Ramesh Gupta:</span>
                <code className="text-[var(--accent-cyan)] bg-white/5 px-1.5 py-0.5 rounded">contractor@fixmycity.com</code>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Municipal · TMC Ward Officer:</span>
                <code className="text-[var(--accent-cyan)] bg-white/5 px-1.5 py-0.5 rounded">municipal@fixmycity.com</code>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Password:</span>
                <code className="text-[var(--accent-cyan)] bg-white/5 px-1.5 py-0.5 rounded">password123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}