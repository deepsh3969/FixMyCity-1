import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Search, AlertTriangle } from 'lucide-react'
import { Button, Card, CardContent } from '../components/UI'

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
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-8 sm:p-12">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-slate-500" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-slate-500 text-lg mb-6">Page Not Found</p>
          <p className="text-slate-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to={getDashboardPath()}>
                <Home className="w-5 h-5" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/">
                <Search className="w-5 h-5" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}