import { ShieldCheck, Beaker, Sparkles } from 'lucide-react'
import { Badge } from '../components/UI'
import { VerificationLabCases } from '../components/VerificationLabCases'

const SCORING = [
  { label: 'GPS Location', weight: 30, desc: 'Distance between original report and repair photo' },
  { label: 'Camera Viewpoint', weight: 20, desc: 'Homography / perspective agreement between shots' },
  { label: 'Background & Landmarks', weight: 20, desc: 'Upper-frame feature matches (buildings, poles, curbs)' },
  { label: 'Road Scene Geometry', weight: 20, desc: 'Lane lines, drains and horizontal spread alignment' },
  { label: 'Pothole Region', weight: 10, desc: 'Overlap + expected repair change in the damage area' }
]

const THRESHOLDS = [
  { range: '80 – 100', decision: 'VERIFIED', tone: 'text-[var(--accent-green)]', bar: 'bg-[var(--accent-green)]', barWidth: 100, desc: 'Auto-verified at the same location' },
  { range: '60 – 79', decision: 'MANUAL REVIEW', tone: 'text-[var(--accent-amber)]', bar: 'bg-[var(--accent-amber)]', barWidth: 70, desc: 'Municipal officer reviews evidence' },
  { range: '0 – 59', decision: 'REJECTED', tone: 'text-[var(--accent-red)]', bar: 'bg-[var(--accent-red)]', barWidth: 40, desc: 'Contractor must resubmit proof' }
]

export default function VerificationLab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <p className="panel-title text-[var(--accent-cyan)]">Proof-of-Repair Engine</p>
            <Badge variant="warning">Includes Simulated Demos</Badge>
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">Verification Lab</h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
            How FixMyCity proves a pothole was actually repaired — SIFT feature matching, GPS checks
            and a Gemini photo review on real evidence, with clearly labelled simulated examples below.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Beaker className="w-4 h-4 text-[var(--accent-cyan)]" />
          <span>Live runs happen automatically when contractors submit evidence</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass border-glow p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h3 className="panel-title text-[var(--accent-cyan)]">Scoring Model (100 points)</h3>
          </div>
          <div className="space-y-3">
            {SCORING.map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                <span className="shrink-0 w-12 text-right font-bold mono-num text-cyan-300">
                  {row.weight}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{row.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{row.desc}</p>
                  <div className="h-1 rounded-full bg-[var(--border-subtle)] mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--accent-cyan)]" style={{ width: `${row.weight}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h3 className="panel-title text-[var(--accent-cyan)]">Decision Thresholds</h3>
          </div>
          <div className="space-y-3">
            {THRESHOLDS.map((t) => (
              <div key={t.decision} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] p-3">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className={`text-sm font-bold ${t.tone}`}>{t.decision}</span>
                  <span className="text-xs font-mono mono-num text-[var(--text-muted)]">{t.range}</span>
                </div>
                <div className="h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${t.barWidth}%` }} />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{t.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-[var(--text-muted)] leading-relaxed">
            A Gemini repair-photo check can cap VERIFIED → MANUAL REVIEW when the photo is
            uncertain, and rejects outright when no repair is visible.
          </p>
        </div>
      </div>

      <VerificationLabCases />
    </div>
  )
}
