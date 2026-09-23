import { Link } from 'react-router-dom'
import { Shield, MapPin, Hammer, CheckCircle, ArrowRight, Zap, Eye, Target, Layers, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '../components/UI'

const features = [
  {
    icon: MapPin,
    title: 'Report Instantly',
    description: 'Citizens can report potholes with photos, GPS location, and severity in seconds.'
  },
  {
    icon: Hammer,
    title: 'Contractor Assignment',
    description: 'Municipal authorities assign verified contractors with full context and original evidence.'
  },
  {
    icon: Eye,
    title: 'AI Verification',
    description: 'Computer vision compares original and repair photos using GPS, viewpoint, landmarks, and road scene analysis.'
  },
  {
    icon: CheckCircle,
    title: 'Proof of Repair',
    description: 'Get a verified confidence score (0-100) with detailed breakdown - no more fake repair photos.'
  },
  {
    icon: Target,
    title: 'Anti-Fraud Detection',
    description: 'Detects fraudulent submissions where contractors photograph different locations.'
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description: 'Municipal analytics on resolution rates, verification stats, and repair quality.'
  }
]

const workflowSteps = [
  { number: '01', title: 'REPORT', description: 'Citizen reports pothole with photo & GPS' },
  { number: '02', title: 'ASSIGN', description: 'Municipality assigns contractor' },
  { number: '03', title: 'REPAIR', description: 'Contractor performs repair' },
  { number: '04', title: 'AI VERIFY', description: 'AI compares before/after evidence' },
  { number: '05', title: 'RESOLVE', description: 'Verified repair closes complaint' }
]

const scoringBreakdown = [
  { label: 'GPS Location', max: 30, description: 'Distance between original & repair coordinates' },
  { label: 'Camera Viewpoint', max: 20, description: 'Perspective & keypoint distribution match' },
  { label: 'Background/Landmarks', max: 20, description: 'Buildings, poles, trees, signs matching' },
  { label: 'Road Scene', max: 20, description: 'Road markings, curbs, lane lines alignment' },
  { label: 'Pothole Region', max: 10, description: 'Repair area texture & context consistency' }
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.15)_0%,transparent_50%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(168,85,247,0.1)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Smart Cities & Urban Development Hackathon</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FixMyCity
            </h1>
            
            <p className="text-2xl sm:text-3xl text-slate-700 mb-8 font-medium">
              &ldquo;The Pothole Nobody Reported&rdquo;
            </p>
            
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Report it. Track it. Prove it was fixed.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="xl" asChild>
                <Link to="/register?role=citizen">
                  Report a Pothole
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/login">Login to Dashboard</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-600" /> AI Verified</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-green-600" /> GPS Tracked</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-600" /> Anti-Fraud</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">End-to-end pothole repair verification with AI-powered proof</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-1/2 -translate-x-1/2 w-px h-[calc(100%-4rem)] bg-gradient-to-b from-cyan-500/30 via-transparent to-purple-500/30" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-xl mb-4 relative z-10 ${
                      index === 3 ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-100 border border-slate-300 text-slate-500'
                    }`}>
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-slate-500 text-sm">{step.description}</p>
                  </div>
                  
                  {index < 4 && (
                    <div className="hidden lg:block absolute top-10 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent -translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Verification Highlight */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 text-sm font-medium mb-4">
                <Layers className="w-4 h-4" />
                <span>Core Innovation: AI Proof-of-Repair Verification</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">We verify the location, not just the repair.</h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                A contractor could photograph an already-repaired pothole elsewhere and submit it as proof. 
                FixMyCity solves this by comparing the citizen&apos;s original evidence with the contractor&apos;s repair evidence 
                using multi-factor computer vision analysis.
              </p>
              
              <div className="space-y-4">
                {scoringBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className="w-48 flex-shrink-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-cyan-600">/{item.max}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-600" />
                  Verification Scorecard
                </h3>
                
                <div className="space-y-4">
                  {[
                    { label: 'GPS LOCATION', score: 28, max: 30, color: 'green' },
                    { label: 'CAMERA VIEWPOINT', score: 17, max: 20, color: 'green' },
                    { label: 'BACKGROUND / LANDMARKS', score: 18, max: 20, color: 'green' },
                    { label: 'ROAD SCENE', score: 19, max: 20, color: 'green' },
                    { label: 'POTHOLE REGION', score: 8, max: 10, color: 'yellow' }
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className={`font-bold ${item.color === 'green' ? 'text-green-600' : 'text-amber-600'}`}>{item.score} / {item.max}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" 
                             style={{ 
                               width: `${(item.score/item.max)*100}%`,
                               background: item.color === 'green' ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                             }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-300 pt-6 mt-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-lg font-semibold">TOTAL</span>
                    <span className="text-3xl font-bold text-green-600">90 / 100</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full" style={{ width: '90%' }} />
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <span>VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Built for citizens, contractors, and municipal authorities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="group relative p-6 bg-white border border-slate-200 rounded-2xl hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/40 group-hover:to-purple-500/40 transition-all">
                    <Icon className="w-6 h-6 text-cyan-600 group-hover:text-cyan-700 transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-500">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Decision Thresholds */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Verification Decisions</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Configurable thresholds for automated decision-making</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { range: '80–100', label: 'VERIFIED', color: 'green', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', description: 'Automatic approval - repair confirmed at same location', icon: CheckCircle },
              { range: '60–79', label: 'MANUAL REVIEW', color: 'yellow', bgClass: 'bg-amber-100', textClass: 'text-amber-700', description: 'Requires human review - evidence inconclusive', icon: AlertTriangle },
              { range: '0–59', label: 'REJECTED', color: 'red', bgClass: 'bg-red-100', textClass: 'text-red-700', description: 'Automatic rejection - likely fraudulent or wrong location', icon: Shield }
            ].map((item) => (
              <div key={item.label} className="relative p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bgClass}`}>
                    <item.icon className={`w-6 h-6 ${item.textClass}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{item.label}</div>
                    <div className="text-cyan-600 font-mono">{item.range}</div>
                  </div>
                </div>
                <p className="text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to fix your city?</h2>
            <p className="text-slate-500 text-lg mb-10">Join citizens, contractors, and municipalities using AI-powered repair verification.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" asChild>
                <Link to="/register?role=citizen">Start Reporting</Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/login">Access Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm">
            FixMyCity &copy; 2026 &mdash; AI-Powered Proof-of-Repair Verification for Smart Cities
          </p>
          <p className="text-slate-600 text-xs mt-2">Built for Hackathon: Smart Cities & Urban Development</p>
        </div>
      </footer>
    </div>
  )
}