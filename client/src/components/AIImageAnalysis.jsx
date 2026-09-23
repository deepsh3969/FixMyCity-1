import {
  ScanLine, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Eye,
  Sparkles, ShieldCheck, MapPinned, FileSearch, Clock3, Settings2
} from 'lucide-react'
import { Button } from './UI'

const severityTone = {
  LOW: { dot: 'bg-emerald-500', text: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200' },
  MEDIUM: { dot: 'bg-amber-500', text: 'text-amber-700', chip: 'bg-amber-50 border-amber-200' },
  HIGH: { dot: 'bg-orange-500', text: 'text-orange-700', chip: 'bg-orange-50 border-orange-200' },
  CRITICAL: { dot: 'bg-red-500', text: 'text-red-700', chip: 'bg-red-50 border-red-200' }
}

const evidenceTone = {
  GOOD: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAIR: 'bg-amber-50 text-amber-700 border-amber-200',
  POOR: 'bg-orange-50 text-orange-700 border-orange-200',
  INSUFFICIENT: 'bg-red-50 text-red-700 border-red-200'
}

function confidenceColor(conf) {
  if (conf >= 80) return 'from-cyan-500 to-emerald-500'
  if (conf >= 60) return 'from-cyan-500 to-amber-500'
  return 'from-amber-500 to-red-500'
}

function confidenceTextColor(conf) {
  if (conf >= 80) return 'text-emerald-600'
  if (conf >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function PanelHeader({ icon: Icon, title, subtitle, tone }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b ${tone.header}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${tone.iconBg}`}>
          <Icon className={`w-5 h-5 ${tone.icon}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">AI Image Analysis</p>
          <p className={`font-semibold text-sm truncate ${tone.title}`}>{subtitle}</p>
        </div>
      </div>
      {title}
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] mb-1.5">{label}</p>
      <div className="text-sm text-[var(--text-primary)] leading-relaxed">{children}</div>
    </div>
  )
}

function AnalyzingView({ previewUrl }) {
  return (
    <div
      className="rounded-xl border border-[var(--accent-cyan)]/40 bg-slate-950 overflow-hidden"
      data-testid="ai-analysis-analyzing"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400/80">AI Image Analysis</p>
            <p className="font-semibold text-sm text-cyan-100">ANALYZING — computer vision in progress…</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
          Live
        </span>
      </div>

      <div className="relative">
        {previewUrl && (
          <div className="relative max-h-56 overflow-hidden">
            <img src={previewUrl} alt="Analyzing uploaded evidence" className="w-full max-h-56 object-contain bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10" />
            <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-400 shadow-[0_0_18px_4px_rgba(34,211,238,0.7)] animate-[scanline_2s_ease-in-out_infinite]" />
            <style>{`@keyframes scanline { 0%{top:0} 50%{top:calc(100% - 2px)} 100%{top:0} }`}</style>
          </div>
        )}
        <div className="p-5 space-y-3">
          {['Detecting road defects', 'Extracting scene features', 'Grading evidence quality'].map((step, i) => (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-full border-2 border-cyan-400/60 border-t-transparent animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
              <span className="text-slate-300">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorView({ error, onRetry }) {
  const isConfig = error.code === 'GEMINI_NOT_CONFIGURED'
  const Icon = isConfig ? Settings2 : AlertTriangle
  return (
    <div
      className="rounded-xl border border-red-300 bg-red-50 overflow-hidden"
      data-testid="ai-analysis-error"
      role="alert"
    >
      <div className="flex items-start gap-3 p-5">
        <div className="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-500">AI Image Analysis</p>
          <p className="font-semibold text-sm text-red-800">
            {isConfig ? 'Configuration required' : 'AI analysis unavailable'}
          </p>
          <p className="text-sm text-red-700/90 mt-1.5">{error.message}</p>
          {!isConfig && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Retry Analysis
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultBody({ result }) {
  const sev = severityTone[result.severity] || severityTone.MEDIUM
  return (
    <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] mb-1">Defect Detected</p>
          <p className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
            <FileSearch className="w-4 h-4 text-[var(--accent-cyan)] flex-shrink-0" />
            {result.defectType}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] mb-1">Confidence</p>
          <p className={`text-2xl font-bold tabular-nums ${confidenceTextColor(result.confidence)}`}>
            {result.confidence}%
          </p>
          <div className="h-1.5 mt-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(result.confidence)} transition-all duration-700`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] mb-1">Severity</p>
          {result.isPothole && result.severity ? (
            <span className={`inline-flex items-center gap-1.5 font-semibold text-sm px-2 py-1 rounded border ${sev.chip} ${sev.text}`}>
              <span className={`w-2 h-2 rounded-full ${sev.dot}`} />
              {result.severity}
            </span>
          ) : (
            <span className="text-sm text-[var(--text-muted)]">—</span>
          )}
        </div>
      </div>

      <Field label="Description">
        <p className="italic">"{result.description}"</p>
      </Field>

      <Field label="Surroundings">
        <p className="italic text-[var(--text-secondary)]">"{result.environment}"</p>
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Evidence Quality</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded border ${evidenceTone[result.evidenceQuality] || evidenceTone.FAIR}`}>
          {result.evidenceQuality}
        </span>
      </div>

      <p className="text-xs text-[var(--text-muted)] flex items-start gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" />
        Generated dynamically from this image by Gemini vision analysis.
      </p>
    </div>
  )
}

function AcceptedView({ result }) {
  return (
    <div className="rounded-xl border border-emerald-300 bg-white overflow-hidden shadow-sm" data-testid="ai-analysis-accepted">
      <PanelHeader
        icon={CheckCircle2}
        subtitle="Pothole detected — evidence accepted"
        title={
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-600 text-white flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Accepted
          </span>
        }
        tone={{
          header: 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200',
          iconBg: 'bg-emerald-100 border border-emerald-200',
          icon: 'text-emerald-600',
          title: 'text-emerald-800'
        }}
      />
      <ResultBody result={result} />
    </div>
  )
}

function NoPotholeView({ result }) {
  const invalid = result.evidenceStatus === 'INVALID_EVIDENCE'
  const Icon = invalid ? XCircle : Clock3
  return (
    <div
      className={`rounded-xl border overflow-hidden shadow-sm ${invalid ? 'border-red-300 bg-white' : 'border-amber-300 bg-white'}`}
      data-testid={invalid ? 'ai-analysis-invalid' : 'ai-analysis-review'}
    >
      <PanelHeader
        icon={Icon}
        subtitle={invalid ? 'Image does not show a road defect' : 'Uncertain result — officer review recommended'}
        title={
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border flex-shrink-0 ${invalid ? 'bg-red-600 text-white border-red-600' : 'bg-amber-500 text-white border-amber-500'}`}>
            {invalid ? 'Invalid Evidence' : 'Manual Review'}
          </span>
        }
        tone={invalid
          ? {
              header: 'bg-gradient-to-r from-red-50 to-white border-red-200',
              iconBg: 'bg-red-100 border border-red-200',
              icon: 'text-red-600',
              title: 'text-red-800'
            }
          : {
              header: 'bg-gradient-to-r from-amber-50 to-white border-amber-200',
              iconBg: 'bg-amber-100 border border-amber-200',
              icon: 'text-amber-600',
              title: 'text-amber-800'
            }}
      />

      {invalid && (
        <div className="px-5 pt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-800">⚠ No pothole detected</p>
              <p className="text-sm text-red-700/90 mt-0.5">Status: <strong>INVALID EVIDENCE</strong> — this upload cannot be submitted as a pothole report.</p>
            </div>
          </div>
        </div>
      )}

      {!invalid && (
        <div className="px-5 pt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Clock3 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-amber-800">Manual review required</p>
              <p className="text-sm text-amber-700/90 mt-0.5">Status: <strong>MANUAL REVIEW</strong> — an officer will confirm this evidence.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)] mb-1.5">AI Analysis</p>
        <p className="text-sm italic text-[var(--text-primary)] leading-relaxed">"{result.description}"</p>
      </div>

      <ResultBody result={result} />
    </div>
  )
}

export default function AIImageAnalysis({ state = 'idle', result, error, previewUrl, onRetry }) {
  if (state === 'idle') return null
  if (state === 'analyzing') return <AnalyzingView previewUrl={previewUrl} />
  if (state === 'error') return <ErrorView error={error || { code: 'UNKNOWN', message: 'AI analysis failed. Please try again.' }} onRetry={onRetry} />
  if (state === 'done' && result) {
    if (result.evidenceStatus === 'ACCEPTED') return <AcceptedView result={result} />
    if (result.evidenceStatus === 'INVALID_EVIDENCE') return <NoPotholeView result={result} />
    return <NoPotholeView result={result} />
  }
  return null
}
