import { Link } from 'react-router-dom'
import { Shield, MapPin, Hammer, CheckCircle, ArrowRight, Zap, Eye, Target, Layers, TrendingUp, AlertTriangle, Camera, Users, Building2, HardHat, Landmark } from 'lucide-react'
import { Button } from '../components/UI'
import BrandLogo from '../components/BrandLogo'

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
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.16)_0%,transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(139,92,246,0.12)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-cyan-dim)] border border-[rgba(34,211,238,0.35)] text-[var(--accent-cyan)] text-sm font-medium mb-8 backdrop-blur-sm">
              <Zap className="w-4 h-4" />
              <span>Smart Cities &amp; Urban Development Hackathon</span>
            </div>

            <div className="flex justify-center mb-6">
              <BrandLogo
                variant="xl"
                className="glow-cyan rounded-[2rem]"
              />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 gradient-text text-glow-cyan">
              FixMyCity
            </h1>
            
            <p className="text-xl sm:text-2xl text-[var(--text-primary)] mb-4 font-semibold tracking-wide">
              &ldquo;The Pothole Nobody Reported&rdquo;
            </p>
            
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Report it. Track it. Prove it was fixed.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Button size="xl" className="btn-glow uppercase tracking-wider font-bold" asChild>
                <Link to="/register?role=citizen">
                  Report a Pothole
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" className="backdrop-blur-sm uppercase tracking-wider font-semibold" asChild>
                <Link to="/login">Login to Dashboard</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-[var(--text-muted)] text-sm">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--accent-cyan)]" /> AI Verified</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--accent-green)]" /> GPS Tracked</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[var(--accent-amber)]" /> Anti-Fraud</span>
            </div>
          </div>
        </div>
      </section>

      {/* Three Steps (reference composition) */}
      <section className="pb-20 lg:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 'STEP 1',
                icon: Camera,
                accent: 'cyan',
                title: 'AI-Verified Reporting',
                description: 'Citizens capture road damage with their phone. AI verifies each report automatically — no false or duplicate reports ever enter the system.'
              },
              {
                step: 'STEP 2',
                icon: MapPin,
                accent: 'purple',
                title: 'GPS Tracked Dispatch',
                description: 'Every complaint is pinned with GPS coordinates, severity scored, and instantly dispatched to the nearest municipal zone and contractor.'
              },
              {
                step: 'STEP 3',
                icon: Shield,
                accent: 'green',
                title: 'Anti-Fraud Proof of Fix',
                description: 'Every repair is validated by AI — GPS, viewpoint, landmarks, road geometry. Nobody can fake a fix that never happened.'
              }
            ].map((card, i) => (
              <div
                key={card.step}
                className={`glass hover-lift p-6 relative overflow-hidden group ${i === 1 ? 'md:-translate-y-3' : ''}`}
              >
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${
                  card.accent === 'cyan' ? 'bg-cyan-400' : card.accent === 'purple' ? 'bg-purple-500' : 'bg-emerald-400'
                }`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <span className="tech-label text-[var(--accent-cyan)]">{card.step}</span>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                      card.accent === 'cyan'
                        ? 'bg-[var(--accent-cyan-dim)] border-[rgba(34,211,238,0.4)] text-[var(--accent-cyan)]'
                        : card.accent === 'purple'
                          ? 'bg-[var(--accent-purple-dim)] border-[rgba(139,92,246,0.4)] text-[var(--accent-purple)]'
                          : 'bg-[var(--accent-green-dim)] border-[rgba(16,185,129,0.4)] text-[var(--accent-green)]'
                    }`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--accent-cyan)] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
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
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-600" />
                    Verification Scorecard
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                    Example · Simulated
                  </span>
                </div>
                <p className="text-xs text-slate-500 -mt-3 mb-5">
                  Illustrative scores to show the report format. Real results are computed per complaint
                  from actual before/after evidence.
                </p>
                
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

      {/* Ecosystem / Impact */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">One Platform, Four Perspectives</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">From citizen-reported potholes to a continuously improving city</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Citizen', flow: ['Report', 'Track', 'Verify'], accent: 'cyan', description: 'Report damage in seconds and follow every step until the fix is AI-verified.' },
              { icon: Building2, label: 'Municipality', flow: ['Monitor', 'Assign', 'Audit'], accent: 'purple', description: 'Command-center visibility over every complaint, contractor, and score.' },
              { icon: HardHat, label: 'Contractor', flow: ['Repair', 'Submit Evidence', 'Verify'], accent: 'amber', description: 'Get dispatched with full context and prove repairs with real evidence.' },
              { icon: Landmark, label: 'City', flow: ['Detect', 'Maintain', 'Improve'], accent: 'green', description: 'Turn verified repairs into analytics for smarter road maintenance.' }
            ].map((item) => (
              <div key={item.label} className="glass hover-lift p-6 relative overflow-hidden group">
                <div className={`absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity ${
                  item.accent === 'cyan' ? 'bg-cyan-400' : item.accent === 'purple' ? 'bg-purple-500' : item.accent === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <div className="relative">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-4 ${
                    item.accent === 'cyan'
                      ? 'bg-[var(--accent-cyan-dim)] border-[rgba(34,211,238,0.4)] text-[var(--accent-cyan)]'
                      : item.accent === 'purple'
                        ? 'bg-[var(--accent-purple-dim)] border-[rgba(139,92,246,0.4)] text-[var(--accent-purple)]'
                        : item.accent === 'amber'
                          ? 'bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.4)] text-[var(--accent-amber)]'
                          : 'bg-[var(--accent-green-dim)] border-[rgba(16,185,129,0.4)] text-[var(--accent-green)]'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wide">{item.label}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {item.flow.map((step, i) => (
                      <span key={step} className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-cyan)]">
                        {i > 0 && <span className="text-[var(--text-muted)]">→</span>}
                        {step}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
                </div>
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