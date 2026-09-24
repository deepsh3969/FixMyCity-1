import { useMemo } from 'react'
import { Badge, ProgressBar, Card, CardContent, CardHeader } from '../components/UI'
import { getScoreBarColor } from '../utils/helpers'
import { CheckCircle, XCircle, AlertCircle, HelpCircle, MapPin, Eye, Landmark, Route, AlertTriangle } from 'lucide-react'

const criteria = [
  { key: 'gpsScore', label: 'GPS Location', weight: 30, icon: MapPin, color: 'var(--accent-blue)' },
  { key: 'viewpointScore', label: 'Camera Viewpoint', weight: 20, icon: Eye, color: 'var(--accent-purple)' },
  { key: 'landmarkScore', label: 'Background', weight: 20, icon: Landmark, color: 'var(--accent-amber)' },
  { key: 'roadSceneScore', label: 'Road Geometry', weight: 20, icon: Route, color: 'var(--accent-green)' },
  { key: 'potholeScore', label: 'Pothole Region', weight: 10, icon: AlertTriangle, color: 'var(--accent-red)' },
]

const decisionConfig = {
  VERIFIED: { label: 'VERIFIED', pill: 'pill-verified', color: 'var(--accent-green)', glow: 'rgba(16,185,129,0.45)', bg: 'var(--accent-green-dim)', border: 'var(--accent-green)', icon: CheckCircle },
  MANUAL_REVIEW: { label: 'MANUAL REVIEW', pill: 'pill-review', color: 'var(--accent-amber)', glow: 'rgba(245,158,11,0.45)', bg: 'var(--accent-amber-dim)', border: 'var(--accent-amber)', icon: HelpCircle },
  REJECTED: { label: 'REJECTED', pill: 'pill-rejected', color: 'var(--accent-red)', glow: 'rgba(239,68,68,0.45)', bg: 'var(--accent-red-dim)', border: 'var(--accent-red)', icon: XCircle },
}

const scoreBarGradient = (score, max) => {
  const tone = getScoreBarColor(score, max)
  if (tone === 'bg-emerald-500') return 'linear-gradient(90deg, #047857 0%, #34D399 100%)'
  if (tone === 'bg-amber-500') return 'linear-gradient(90deg, #B45309 0%, #FBBF24 100%)'
  return 'linear-gradient(90deg, #B91C1C 0%, #F87171 100%)'
}

const scorePct = (value, max) => {
  if (!max) return 0
  return Math.min(100, Math.max(0, (value / max) * 100))
}

export default function VerificationPanel({ result, complaintId, isDemo = false, demoCase = null }) {
  const displayResult = isDemo && demoCase ? demoCase : result
  
  if (!displayResult) {
    return (
      <Card className="border-[var(--border-subtle)]">
        <CardContent className="p-6 text-center">
          <p className="panel-title mb-2">Proof of Repair</p>
          <p className="text-[var(--text-muted)]">No verification result available</p>
        </CardContent>
      </Card>
    )
  }

  const { totalScore, decision, confidence, distanceMeters, explanation = [], fallbackMode, geminiVerdict, geminiConfidence, geminiNotes } = displayResult

  const geminiConfig = {
    REPAIR_VISIBLE: { label: 'REPAIR PHOTO ACCEPTED', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', icon: CheckCircle },
    NOT_A_REPAIR: { label: 'REPAIR PHOTO REJECTED', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', icon: XCircle },
    UNCERTAIN: { label: 'REPAIR PHOTO UNCERTAIN', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', icon: HelpCircle },
    SKIPPED: { label: 'REPAIR PHOTO CHECK SKIPPED', color: 'var(--text-muted)', bg: 'var(--bg-card-hover)', icon: AlertCircle },
  }
  const geminiStyle = geminiVerdict ? geminiConfig[geminiVerdict] : null
  const GeminiIcon = geminiStyle?.icon
  
  const decisionStyle = decisionConfig[decision] || decisionConfig.MANUAL_REVIEW
  const DecisionIcon = decisionStyle.icon
  const totalPct = Math.min(100, Math.max(0, Number(totalScore) || 0))
  
  const progressBars = useMemo(() => criteria.map(c => ({
    ...c,
    value: displayResult[c.key] || 0,
    max: c.weight
  })), [displayResult])

  return (
    <Card className="border-[var(--border-subtle)] overflow-hidden">
      <CardHeader className="bg-[var(--bg-card-hover)] border-b border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[var(--border-subtle)]" style={{ backgroundColor: decisionStyle.bg }}>
              <DecisionIcon className="w-6 h-6" style={{ color: decisionStyle.color }} />
            </div>
            <div>
              <p className="tech-label text-[var(--accent-cyan)] mb-1">Proof of Repair</p>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">AI Verification</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">BEFORE VS AFTER · {complaintId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-right">
              <p className="panel-title mb-1">Total Score</p>
              <p
                className="mono-num text-4xl sm:text-5xl font-extrabold leading-none"
                style={{ color: decisionStyle.color, textShadow: `0 0 26px ${decisionStyle.glow}` }}
              >
                {totalScore}
                <span className="text-xl font-semibold text-[var(--text-muted)]"> / 100</span>
              </p>
            </div>
            <span className={`pill ${decisionStyle.pill}`}>{decisionStyle.label}</span>
            {isDemo && (
              <Badge variant="warning" className="text-xs">DEMO MODE</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-1 border-b border-[var(--border-subtle)]">
              <p className="panel-title">Verification Breakdown</p>
              <p className="tech-label text-[var(--accent-cyan)]">{totalScore} / 100</p>
            </div>
            {progressBars.map(({ key, label, value, max, icon: Icon, color }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                    <span className="tech-label truncate">{label}</span>
                  </div>
                  <div className="flex items-baseline gap-1 flex-shrink-0">
                    <span className="mono-num text-sm font-bold" style={{ color }}>{value}</span>
                    <span className="mono-num text-xs text-[var(--text-muted)]">/ {max}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${scorePct(value, max)}%`, backgroundImage: scoreBarGradient(value, max) }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <div className="glass h-full flex flex-col items-center justify-center gap-4 p-5 text-center">
              <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center relative animate-pulse-ring border-2" style={{ backgroundColor: decisionStyle.bg, borderColor: decisionStyle.color }}>
                <DecisionIcon className="w-11 h-11" style={{ color: decisionStyle.color }} />
              </div>
              <div>
                <p className="tech-label mb-1">Decision</p>
                <p className="text-2xl font-bold mono-num" style={{ color: decisionStyle.color, textShadow: `0 0 20px ${decisionStyle.glow}` }}>
                  {decisionStyle.label}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                <span
                  className="mono-num px-2 py-1 rounded-full border uppercase tracking-widest"
                  style={{ backgroundColor: decisionStyle.bg, color: decisionStyle.color, borderColor: decisionStyle.border }}
                >
                  {confidence} CONFIDENCE
                </span>
                {typeof distanceMeters === 'number' && (
                  <span className="mono-num px-2 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                    {distanceMeters}m GPS DRIFT
                  </span>
                )}
              </div>
              {fallbackMode && (
                <Badge variant="warning" className="mt-1">Fallback Mode</Badge>
              )}
            </div>
          </div>
        </div>

        {geminiStyle && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]" style={{ backgroundColor: geminiStyle.bg }}>
            <GeminiIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: geminiStyle.color }} />
            <div className="min-w-0">
              <p className="tech-label" style={{ color: geminiStyle.color }}>
                {geminiStyle.label}
                {typeof geminiConfidence === 'number' && ` · ${geminiConfidence}%`}
              </p>
              {geminiNotes && (
                <p className="text-sm text-[var(--text-secondary)] mt-1 break-words">{geminiNotes}</p>
              )}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <p className="panel-title">Composite Score</p>
            <div className="mono-num text-2xl font-bold gradient-text">{totalScore}<span className="text-base text-[var(--text-muted)]">/100</span></div>
          </div>
          <ProgressBar value={totalPct} max={100} showLabel={false} className="h-3" color="var(--accent-cyan)" />
        </div>
        
        {explanation.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <p className="panel-title mb-3">Analysis Details</p>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {explanation.map((exp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--accent-cyan)]" />
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
