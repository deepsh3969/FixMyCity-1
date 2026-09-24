import { useState } from 'react'
import { Beaker, ShieldCheck, MapPinOff, HelpCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, Badge } from './UI'

const DEMO_CASES = [
  {
    id: 'A',
    title: 'Case A — Genuine Repair',
    scenario: 'Same pothole, same location, repaired properly',
    result: 'VERIFIED',
    score: 91,
    confidence: 'HIGH',
    distanceMeters: 4.1,
    scores: { gps: 28, viewpoint: 18, landmark: 18, roadScene: 19, pothole: 8 },
    explanation: [
      'GPS location matches within 4 meters — same reported spot',
      'Camera viewpoint shows same perspective with minor angle difference',
      'Background buildings, curb and road markings align',
      'Road scene geometry (lane lines, drain) matches original',
      'Pothole region shows proper asphalt patch with consistent surrounding texture'
    ],
    label: 'SIMULATED',
    tone: 'emerald'
  },
  {
    id: 'B',
    title: 'Case B — Different Pothole',
    scenario: 'Contractor photographed a different pothole on another road',
    result: 'REJECTED',
    score: 18,
    confidence: 'HIGH',
    distanceMeters: 520.7,
    scores: { gps: 0, viewpoint: 5, landmark: 4, roadScene: 6, pothole: 3 },
    explanation: [
      'GPS mismatch — 520m from original report (score: 0/30)',
      'Camera viewpoint completely different — different street orientation',
      'No matching background landmarks detected (buildings/structures differ)',
      'Road scene features do not match original location',
      'Pothole region shows different damage pattern entirely — potential evidence mismatch'
    ],
    label: 'SIMULATED',
    tone: 'red'
  },
  {
    id: 'C',
    title: 'Case C — Unclear Evidence',
    scenario: 'Same location but poor angle / partially visible road',
    result: 'MANUAL_REVIEW',
    score: 68,
    confidence: 'MEDIUM',
    distanceMeters: 16.2,
    scores: { gps: 22, viewpoint: 11, landmark: 13, roadScene: 14, pothole: 8 },
    explanation: [
      'GPS location within acceptable range (16.2m from original)',
      'Camera viewpoint shows noticeable perspective shift — angle differs',
      'Some background landmarks match but others are occluded',
      'Road scene partially matches; lighting conditions vary',
      'Pothole region shows repair but surrounding context uncertain — recommend human review'
    ],
    label: 'SIMULATED',
    tone: 'amber'
  }
]

const TONE_STYLES = {
  emerald: {
    border: 'border-[rgba(16,185,129,0.45)]',
    bg: 'bg-[rgba(16,185,129,0.07)]',
    badge: 'bg-[var(--accent-green-dim)] text-[var(--accent-green)] border-[rgba(16,185,129,0.45)]',
    score: 'text-[var(--accent-green)]',
    bar: 'bg-[var(--accent-green)]',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.18)]'
  },
  red: {
    border: 'border-[rgba(239,68,68,0.45)]',
    bg: 'bg-[rgba(239,68,68,0.07)]',
    badge: 'bg-[var(--accent-red-dim)] text-[var(--accent-red)] border-[rgba(239,68,68,0.45)]',
    score: 'text-[var(--accent-red)]',
    bar: 'bg-[var(--accent-red)]',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.18)]'
  },
  amber: {
    border: 'border-[rgba(245,158,11,0.45)]',
    bg: 'bg-[rgba(245,158,11,0.07)]',
    badge: 'bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border-[rgba(245,158,11,0.45)]',
    score: 'text-[var(--accent-amber)]',
    bar: 'bg-[var(--accent-amber)]',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.18)]'
  }
}

const SCORE_ROWS = [
  { key: 'gps', label: 'GPS Location', max: 30 },
  { key: 'viewpoint', label: 'Camera Viewpoint', max: 20 },
  { key: 'landmark', label: 'Background / Landmarks', max: 20 },
  { key: 'roadScene', label: 'Road Scene / Geometry', max: 20 },
  { key: 'pothole', label: 'Pothole Region', max: 10 }
]

function CaseCard({ demoCase, compact }) {
  const [expanded, setExpanded] = useState(!compact)
  const tone = TONE_STYLES[demoCase.tone]

  return (
    <div className={`rounded-xl border ${tone.border} ${tone.bg} ${tone.glow} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone.badge}`}>
            {demoCase.label}
          </span>
          <span className="font-semibold text-sm text-[var(--text-primary)] min-w-0">{demoCase.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <span className={`font-bold mono-num tabular-nums ${tone.score}`}>{demoCase.score}/100</span>
          <Badge variant={demoCase.result === 'VERIFIED' ? 'success' : demoCase.result === 'REJECTED' ? 'danger' : 'warning'}>
            {demoCase.result}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
          <p className="text-sm text-[var(--text-secondary)]">{demoCase.scenario}</p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SCORE_ROWS.map((row) => {
              const val = demoCase.scores[row.key]
              const pct = Math.round((val / row.max) * 100)
              return (
                <div key={row.key} className="rounded-lg bg-[var(--panel-2)] border border-[var(--border-subtle)] p-2.5">
                  <p className="tech-label mb-1.5">{row.label}</p>
                  <p className="text-sm font-bold text-[var(--text-primary)] mono-num tabular-nums mb-1.5">{val}/{row.max}</p>
                  <div className="h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--panel-2)] border border-[var(--border-subtle)]">
              <MapPinOff className="w-3.5 h-3.5" /> GPS drift: {demoCase.distanceMeters}m
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--panel-2)] border border-[var(--border-subtle)]">
              Confidence: {demoCase.confidence}
            </span>
          </div>

          <div>
            <p className="tech-label mb-2">AI Explanation</p>
            <ul className="space-y-1.5">
              {demoCase.explanation.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--accent-cyan)] mt-0.5">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export function VerificationLabCases({ compact = false }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h3 className="panel-title text-[var(--accent-cyan)]">Verification Lab</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--accent-amber-dim)] text-[var(--accent-amber)] border border-[rgba(245,158,11,0.45)]">
            <AlertTriangle className="w-3 h-3" />
            Demo / Simulated Verification
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1.5">
          Three illustrative proof-of-repair scenarios. Scores below are <strong className="text-[var(--text-secondary)]">simulated for demonstration</strong> — not live AI results.
          Real verifications run on actual uploaded evidence via the SIFT + Gemini pipeline.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {DEMO_CASES.map((c) => (
          <CaseCard key={c.id} demoCase={c} compact={compact} />
        ))}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--accent-cyan-dim)] border border-[rgba(34,211,238,0.3)] text-xs text-[var(--text-secondary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-[var(--text-primary)]">Decision thresholds (real system):</strong> 80–100 → VERIFIED · 60–79 → MANUAL REVIEW · 0–59 → REJECTED.
            Weights: GPS 30 · Viewpoint 20 · Landmarks 20 · Road Scene 20 · Pothole Region 10 = 100.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default VerificationLabCases
