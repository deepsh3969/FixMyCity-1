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
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    score: 'text-emerald-600',
    bar: 'bg-emerald-500'
  },
  red: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/10 text-red-600 border-red-500/30',
    score: 'text-red-600',
    bar: 'bg-red-500'
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    score: 'text-amber-600',
    bar: 'bg-amber-500'
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
    <div className={`rounded-xl border ${tone.border} ${tone.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/40 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone.badge}`}>
            {demoCase.label}
          </span>
          <span className="font-semibold text-sm text-slate-900 truncate">{demoCase.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`font-bold tabular-nums ${tone.score}`}>{demoCase.score}/100</span>
          <Badge variant={demoCase.result === 'VERIFIED' ? 'success' : demoCase.result === 'REJECTED' ? 'danger' : 'warning'}>
            {demoCase.result}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-200/70 pt-4">
          <p className="text-sm text-slate-600">{demoCase.scenario}</p>

          <div className="grid sm:grid-cols-5 gap-2">
            {SCORE_ROWS.map((row) => {
              const val = demoCase.scores[row.key]
              const pct = Math.round((val / row.max) * 100)
              return (
                <div key={row.key} className="rounded-lg bg-white/70 border border-slate-200/70 p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 mb-1.5">{row.label}</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums mb-1.5">{val}/{row.max}</p>
                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/70 border border-slate-200/70">
              <MapPinOff className="w-3.5 h-3.5" /> GPS drift: {demoCase.distanceMeters}m
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/70 border border-slate-200/70">
              Confidence: {demoCase.confidence}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">AI Explanation</p>
            <ul className="space-y-1.5">
              {demoCase.explanation.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-slate-400 mt-0.5">•</span>
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
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-slate-900">Verification Lab</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            Demo / Simulated Verification
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Three illustrative proof-of-repair scenarios. Scores below are <strong>simulated for demonstration</strong> — not live AI results.
          Real verifications run on actual uploaded evidence via the SIFT + Gemini pipeline.
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {DEMO_CASES.map((c) => (
          <CaseCard key={c.id} demoCase={c} compact={compact} />
        ))}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Decision thresholds (real system):</strong> 80–100 → VERIFIED · 60–79 → MANUAL REVIEW · 0–59 → REJECTED.
            Weights: GPS 30 · Viewpoint 20 · Landmarks 20 · Road Scene 20 · Pothole Region 10 = 100.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default VerificationLabCases
