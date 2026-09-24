import { ShieldCheck, Beaker, Sparkles } from 'lucide-react'
import { Card, CardContent, Badge } from '../components/UI'
import { VerificationLabCases } from '../components/VerificationLabCases'

const SCORING = [
  { label: 'GPS Location', weight: 30, desc: 'Distance between original report and repair photo' },
  { label: 'Camera Viewpoint', weight: 20, desc: 'Homography / perspective agreement between shots' },
  { label: 'Background & Landmarks', weight: 20, desc: 'Upper-frame feature matches (buildings, poles, curbs)' },
  { label: 'Road Scene Geometry', weight: 20, desc: 'Lane lines, drains and horizontal spread alignment' },
  { label: 'Pothole Region', weight: 10, desc: 'Overlap + expected repair change in the damage area' }
]

const THRESHOLDS = [
  { range: '80 – 100', decision: 'VERIFIED', tone: 'text-emerald-600', desc: 'Auto-verified at the same location' },
  { range: '60 – 79', decision: 'MANUAL REVIEW', tone: 'text-amber-600', desc: 'Municipal officer reviews evidence' },
  { range: '0 – 59', decision: 'REJECTED', tone: 'text-red-600', desc: 'Contractor must resubmit proof' }
]

export default function VerificationLab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">Verification Lab</h1>
            <Badge variant="warning">Includes Simulated Demos</Badge>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">
            How FixMyCity proves a pothole was actually repaired — SIFT feature matching, GPS checks
            and a Gemini photo review on real evidence, with clearly labelled simulated examples below.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Beaker className="w-4 h-4 text-cyan-600" />
          <span>Live runs happen automatically when contractors submit evidence</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-slate-200 lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold text-slate-900">Scoring Model (100 points)</h3>
            </div>
            <div className="space-y-3">
              {SCORING.map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <span className="shrink-0 w-12 text-right font-bold tabular-nums text-cyan-600">
                    {row.weight}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{row.label}</p>
                    <p className="text-xs text-slate-500">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              <h3 className="font-semibold text-slate-900">Decision Thresholds</h3>
            </div>
            <div className="space-y-3">
              {THRESHOLDS.map((t) => (
                <div key={t.decision} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${t.tone}`}>{t.decision}</span>
                    <span className="text-xs font-mono text-slate-500">{t.range}</span>
                  </div>
                  <p className="text-xs text-slate-600">{t.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              A Gemini repair-photo check can cap VERIFIED → MANUAL REVIEW when the photo is
              uncertain, and rejects outright when no repair is visible.
            </p>
          </CardContent>
        </Card>
      </div>

      <VerificationLabCases />
    </div>
  )
}
