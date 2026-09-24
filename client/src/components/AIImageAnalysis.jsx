import {
  ScanLine, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Eye,
  Sparkles, ShieldCheck, MapPinned, FileSearch, Clock3, Settings2
} from 'lucide-react'
import { Button } from './UI'

const severityTone = {
  LOW: 'pill pill-verified',
  MEDIUM: 'pill pill-review',
  HIGH: 'pill text-[var(--accent-amber)] bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.55)] shadow-[0_0_16px_rgba(245,158,11,0.22)]',
  CRITICAL: 'pill pill-rejected shadow-[0_0_16px_rgba(239,68,68,0.25)]'
}

const evidenceTone = {
  GOOD: 'text-[var(--accent-green)] bg-[var(--accent-green-dim)] border-[rgba(16,185,129,0.45)]',
  FAIR: 'text-[var(--accent-amber)] bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.45)]',
  POOR: 'text-[var(--accent-amber)] bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.6)]',
  INSUFFICIENT: 'text-[var(--accent-red)] bg-[var(--accent-red-dim)] border-[rgba(239,68,68,0.5)]'
}

function confidenceColor(conf) {
  if (conf >= 80) return 'from-[var(--accent-cyan)] to-[var(--accent-green)]'
  if (conf >= 60) return 'from-[var(--accent-cyan)] to-[var(--accent-amber)]'
  return 'from-[var(--accent-amber)] to-[var(--accent-red)]'
}

function confidenceTextColor(conf) {
  if (conf >= 80) return 'text-[var(--accent-green)]'
  if (conf >= 60) return 'text-[var(--accent-amber)]'
  return 'text-[var(--accent-red)]'
}

function PanelHeader({ subtitle, badge }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card-solid)]">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-[var(--accent-cyan)] shadow-[0_0_10px_2px_rgba(34,211,238,0.85)] animate-pulse" />
        <div className="min-w-0">
          <p className="tech-label">SMART POTHOLE INTELLIGENCE</p>
          {subtitle && <div className="text-sm font-semibold text-[var(--text-primary)] mt-1">{subtitle}</div>}
        </div>
      </div>
      {badge}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-4 py-3">
      <p className="tech-label sm:w-36 sm:pt-1.5 flex-shrink-0">{label}</p>
      <div className="text-sm text-[var(--text-primary)] leading-relaxed min-w-0">{children}</div>
    </div>
  )
}

function AnalyzingView({ previewUrl }) {
  return (
    <div
      className="scan-line rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] backdrop-blur-[14px] overflow-hidden shadow-[0_0_26px_rgba(34,211,238,0.16)]"
      data-testid="ai-analysis-analyzing"
      aria-live="polite"
    >
      <PanelHeader
        subtitle={
          <span className="inline-flex items-center gap-2 text-[var(--accent-cyan)] text-glow-cyan">
            <ScanLine className="w-4 h-4 animate-pulse" />
            ANALYZING…
          </span>
        }
        badge={
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[var(--border-default)] flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping" />
            Live
          </span>
        }
      />

      <div className="relative">
        {previewUrl && (
          <div className="relative max-h-56 overflow-hidden">
            <img src={previewUrl} alt="Analyzing uploaded evidence" className="w-full max-h-56 object-contain bg-[var(--bg-card-solid)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-cyan-dim)] via-transparent to-[var(--accent-cyan-dim)]" />
          </div>
        )}
        <div className="p-5 space-y-3">
          {['Detecting road defects', 'Extracting scene features', 'Grading evidence quality'].map((step, i) => (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span className="w-5 h-5 rounded-full border-2 border-[var(--accent-cyan)] border-t-transparent animate-spin flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
              <span className="text-[var(--text-secondary)]">{step}</span>
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
      className="rounded-xl border border-[rgba(239,68,68,0.5)] bg-[var(--bg-card)] backdrop-blur-[14px] overflow-hidden shadow-[0_0_26px_rgba(239,68,68,0.12)]"
      data-testid="ai-analysis-error"
      role="alert"
    >
      <PanelHeader
        subtitle={isConfig ? 'Configuration required' : 'AI analysis unavailable'}
        badge={<span className="pill pill-rejected flex-shrink-0">AI ERROR</span>}
      />
      <div className="flex items-start gap-3 p-5">
        <div className="w-10 h-10 rounded-lg bg-[var(--accent-red-dim)] border border-[rgba(239,68,68,0.45)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[var(--accent-red)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-secondary)]">{error.message}</p>
          {!isConfig && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[var(--accent-red-dim)]"
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
  return (
    <div className="p-5 space-y-4">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] divide-y divide-[var(--border-subtle)]">
        <Row label="Confidence">
          <p className={`mono-num text-3xl font-bold leading-none ${confidenceTextColor(result.confidence)}`}>
            {result.confidence}%
          </p>
          <div className="h-2 mt-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${confidenceColor(result.confidence)} shadow-[0_0_12px_rgba(34,211,238,0.45)] transition-all duration-700`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
        </Row>

        <Row label="Severity">
          {result.isPothole && result.severity ? (
            <span className={severityTone[result.severity] || severityTone.MEDIUM}>
              {result.severity}
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">—</span>
          )}
        </Row>

        <Row label="Description">
          <p className="text-[var(--text-secondary)]">{result.description || '—'}</p>
        </Row>

        <Row label="Environment">
          <p className="text-[var(--text-secondary)]">{result.environment || '—'}</p>
        </Row>

        <Row label="Evidence Quality">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.12em] border ${evidenceTone[result.evidenceQuality] || evidenceTone.FAIR}`}>
            {result.evidenceQuality}
          </span>
        </Row>

        {result.defectType && (
          <Row label="Defect">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--accent-cyan)]">
              <FileSearch className="w-4 h-4 flex-shrink-0" />
              {result.defectType}
            </span>
          </Row>
        )}
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
    <div
      className="rounded-xl border border-[rgba(16,185,129,0.45)] bg-[var(--bg-card)] backdrop-blur-[14px] overflow-hidden shadow-[0_0_28px_rgba(16,185,129,0.14)]"
      data-testid="ai-analysis-accepted"
    >
      <PanelHeader
        subtitle="Pothole detected — evidence accepted"
        badge={
          <span className="pill pill-verified flex-shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            ACCEPTED
          </span>
        }
      />
      <div className="px-5 pt-5">
        <p className="flex items-center gap-2.5 text-base font-bold uppercase tracking-[0.14em] text-[var(--accent-green)] text-glow-cyan">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-green)] shadow-[0_0_12px_3px_rgba(16,185,129,0.7)] flex-shrink-0" />
          POTHOLE DETECTED
        </p>
      </div>
      <ResultBody result={result} />
    </div>
  )
}

function NoPotholeView({ result }) {
  const invalid = result.evidenceStatus === 'INVALID_EVIDENCE'
  const Icon = invalid ? XCircle : Clock3
  const accent = invalid ? 'text-[var(--accent-red)]' : 'text-[var(--accent-amber)]'
  const panel = invalid
    ? 'border-[rgba(239,68,68,0.5)] shadow-[0_0_28px_rgba(239,68,68,0.14)]'
    : 'border-[rgba(245,158,11,0.5)] shadow-[0_0_28px_rgba(245,158,11,0.12)]'
  const box = invalid
    ? 'bg-[var(--accent-red-dim)] border-[rgba(239,68,68,0.45)]'
    : 'bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.45)]'
  const glow = invalid ? 'rgba(239,68,68,0.55)' : 'rgba(245,158,11,0.5)'

  return (
    <div
      className={`rounded-xl border ${panel} bg-[var(--bg-card)] backdrop-blur-[14px] overflow-hidden`}
      data-testid={invalid ? 'ai-analysis-invalid' : 'ai-analysis-review'}
    >
      <PanelHeader
        subtitle={invalid ? 'Image does not show a road defect' : 'Uncertain result — officer review recommended'}
        badge={
          <span className={`${invalid ? 'pill pill-rejected' : 'pill pill-review'} flex-shrink-0`}>
            {invalid ? 'INVALID EVIDENCE' : 'MANUAL REVIEW'}
          </span>
        }
      />

      <div className="px-5 pt-4">
        <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${box}`}>
          <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${accent}`} />
          <div className="min-w-0">
            <p className={`font-bold text-sm tracking-[0.1em] ${accent}`} style={{ textShadow: `0 0 16px ${glow}` }}>
              {invalid ? '⚠ NO POTHOLE DETECTED' : 'Manual review required'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Status: <strong className={accent}>{invalid ? 'INVALID EVIDENCE' : 'MANUAL REVIEW'}</strong>
              {' — '}
              {invalid ? 'this upload cannot be submitted as a pothole report.' : 'an officer will confirm this evidence.'}
            </p>
          </div>
        </div>
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
