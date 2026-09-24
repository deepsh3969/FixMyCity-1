import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button, Input, Card, CardContent } from '../components/UI'
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center gap-5 mb-8 group">
            <BrandLogo
              variant="xl"
              className="transition-transform duration-300 group-hover:scale-105 shadow-2xl shadow-cyan-500/25"
            />
            <span className="flex flex-col items-center gap-1.5">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-none">
                FixMyCity
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-600">
                Smart City · Pothole Intelligence
              </span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-slate-500">Sign in to your account</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-lg text-sm">
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
                  className="absolute right-4 top-[38px] text-slate-500 hover:text-slate-900 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-cyan-600 hover:text-cyan-300 font-medium">
                  Sign up
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500 mb-3 font-medium">Demo Credentials:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Citizen · Aarav Sharma:</span>
                  <code className="text-cyan-300 bg-white px-1.5 py-0.5 rounded">citizen@fixmycity.com</code>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Contractor · Ramesh Gupta:</span>
                  <code className="text-cyan-300 bg-white px-1.5 py-0.5 rounded">contractor@fixmycity.com</code>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Municipal · TMC Ward Officer:</span>
                  <code className="text-cyan-300 bg-white px-1.5 py-0.5 rounded">municipal@fixmycity.com</code>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Password:</span>
                  <code className="text-cyan-300 bg-white px-1.5 py-0.5 rounded">password123</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}