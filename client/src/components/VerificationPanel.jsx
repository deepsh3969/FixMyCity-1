import { useMemo } from 'react'
import { Badge, ProgressBar, Card, CardContent, CardHeader } from '../components/UI'
import { CheckCircle, XCircle, AlertCircle, HelpCircle, MapPin, Eye, Landmark, Route, AlertTriangle } from 'lucide-react'

const criteria = [
  { key: 'gps', label: 'GPS Match', weight: 30, icon: MapPin, color: 'var(--accent-blue)' },
  { key: 'viewpoint', label: 'Viewpoint Match', weight: 20, icon: Eye, color: 'var(--accent-purple)' },
  { key: 'landmark', label: 'Landmark Visibility', weight: 20, icon: Landmark, color: 'var(--accent-amber)' },
  { key: 'roadScene', label: 'Road Scene Match', weight: 20, icon: Route, color: 'var(--accent-green)' },
  { key: 'pothole', label: 'Pothole Match', weight: 10, icon: AlertTriangle, color: 'var(--accent-red)' },
]

const decisionConfig = {
  VERIFIED: { label: 'VERIFIED', color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', border: 'var(--accent-green)', icon: CheckCircle },
  MANUAL_REVIEW: { label: 'MANUAL REVIEW', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'var(--accent-amber)', icon: HelpCircle },
  REJECTED: { label: 'REJECTED', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', border: 'var(--accent-red)', icon: XCircle },
}

export default function VerificationPanel({ result, complaintId, isDemo = false, demoCase = null }) {
  const displayResult = isDemo && demoCase ? demoCase : result
  
  if (!displayResult) {
    return (
      <Card className="border-[var(--border-subtle)]">
        <CardContent className="p-6 text-center">
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
  
  const progressBars = useMemo(() => criteria.map(c => ({
    ...c,
    value: displayResult[c.key] || 0,
    max: c.weight
  })), [displayResult])

  return (
    <Card className="border-[var(--border-subtle)] overflow-hidden">
      <CardHeader className="bg-[var(--bg-card-hover)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: decisionStyle.bg }}>
              <DecisionIcon className="w-6 h-6" style={{ color: decisionStyle.color }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">AI Proof-of-Repair Verification</h3>
              <p className="text-sm text-[var(--text-muted)]">Before vs After analysis for complaint {complaintId}</p>
            </div>
          </div>
          {isDemo && (
            <Badge variant="warning" className="text-xs">DEMO MODE</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {progressBars.map(({ key, label, value, max, weight, icon: Icon, color }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color }} />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
                    <Badge variant="default" className="text-xs">/{weight}</Badge>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ color }}>
                    {value}/{max}
                  </span>
                </div>
                <ProgressBar 
                  value={value} 
                  max={max} 
                  showLabel={false}
                  color={color}
                  className="h-2"
                />
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <div className="text-center space-y-4 p-4 rounded-xl" style={{ backgroundColor: decisionStyle.bg, borderColor: decisionStyle.border }}>
              <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center relative animate-pulse-ring" style={{ backgroundColor: decisionStyle.bg }}>
                <DecisionIcon className="w-12 h-12" style={{ color: decisionStyle.color }} />
                <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: decisionStyle.color }} />
              </div>
              <div>
                <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider">Decision</p>
                <p className="text-3xl font-bold" style={{ color: decisionStyle.color }}>{decisionStyle.label}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: decisionStyle.bg, color: decisionStyle.color }}>
                  {confidence} CONFIDENCE
                </span>
                {distanceMeters && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)]">
                    {distanceMeters}m GPS drift
                  </span>
                )}
              </div>
              {fallbackMode && (
                <Badge variant="warning" className="mt-2">Fallback Mode</Badge>
              )}
            </div>
          </div>
        </div>

        {geminiStyle && (
          <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor: geminiStyle.bg, borderColor: geminiStyle.color }}>
            <GeminiIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: geminiStyle.color }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: geminiStyle.color }}>
                {geminiStyle.label}
                {typeof geminiConfidence === 'number' && ` · ${geminiConfidence}%`}
              </p>
              {geminiNotes && (
                <p className="text-sm text-[var(--text-secondary)] mt-0.5 break-words">{geminiNotes}</p>
              )}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[var(--text-primary)]">Total Score</h4>
            <div className="text-2xl font-bold text-[var(--accent-cyan)]">{totalScore}/100</div>
          </div>
          <ProgressBar value={totalScore} max={100} showLabel={false} className="h-3" color="var(--accent-cyan)" />
        </div>
        
        {explanation.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <h4 className="font-medium text-[var(--text-primary)] mb-3">Analysis Details</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {explanation.map((exp, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--text-muted)]" />
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