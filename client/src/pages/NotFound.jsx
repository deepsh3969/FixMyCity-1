import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Search, AlertTriangle } from 'lucide-react'
import { Button } from '../components/UI'

export default function NotFound() {
  const { user } = useAuth()
  
  const getDashboardPath = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'citizen': return '/citizen/dashboard'
      case 'municipal': return '/municipal/dashboard'
      case 'contractor': return '/contractor/dashboard'
      default: return '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 sm:p-12 max-w-md w-full text-center relative overflow-hidden animate-slide-up">
        <div className="absolute -top-24 -left-24 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div
            className="w-20 h-20 rounded-full bg-[var(--accent-amber-dim)] border border-[rgba(245,158,11,0.4)] flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 26px rgba(245, 158, 11, 0.3)' }}
          >
            <AlertTriangle className="w-10 h-10 text-[var(--accent-amber)]" />
          </div>

          <p className="tech-label text-[var(--accent-cyan)] mb-2">Signal Lost · Route Unknown</p>
          <h1 className="text-6xl font-extrabold mono-num gradient-text mb-2 leading-none">404</h1>
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-3">Page Not Found</p>
          <p className="text-sm text-[var(--text-muted)] mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-glow uppercase tracking-[0.16em] text-xs font-bold">
              <Link to={getDashboardPath()}>
                <Home className="w-5 h-5" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="btn-glow uppercase tracking-[0.16em] text-xs font-bold">
              <Link to="/">
                <Search className="w-5 h-5" />
                Back to safety
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
