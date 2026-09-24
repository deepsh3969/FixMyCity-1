import {
  FilePlus2,
  UserPlus,
  Hammer,
  Upload,
  Cpu,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Circle
} from 'lucide-react'

const EVENT_CONFIG = {
  REPORT_CREATED: { icon: FilePlus2, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  ASSIGNED: { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  REPAIR_STARTED: { icon: Hammer, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  EVIDENCE_UPLOADED: { icon: Upload, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  AI_VERIFICATION: { icon: Cpu, color: 'text-cyan-600', bg: 'bg-cyan-600/10', border: 'border-cyan-600/30' },
  MUNICIPAL_REVIEW: { icon: Eye, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30' },
  STATUS_CHANGED: { icon: RefreshCw, color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  RESOLVED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-600/10', border: 'border-emerald-600/30' },
  REJECTED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' }
}

const ACTOR_BADGE = {
  Citizen: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Municipality: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Contractor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  AI: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  System: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
}

function formatTimestamp(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export default function AuditTimeline({ timeline = [], emptyMessage = 'No audit events recorded yet.' }) {
  if (!timeline.length) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
        <Circle className="w-5 h-5 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    )
  }

  const events = [...timeline].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  )

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--border-subtle)]" aria-hidden="true" />
      <ol className="space-y-5">
        {events.map((ev, idx) => {
          const cfg = EVENT_CONFIG[ev.event] || EVENT_CONFIG.STATUS_CHANGED
          const Icon = cfg.icon
          const isLast = idx === events.length - 1
          return (
            <li key={`${ev.event}-${idx}-${ev.timestamp}`} className="relative flex gap-4">
              <div
                className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${cfg.bg} ${cfg.border}`}
              >
                <Icon className={`w-5 h-5 ${cfg.color}`} aria-hidden="true" />
              </div>
              <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-1'}`}>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                    {ev.message || ev.event.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      ACTOR_BADGE[ev.actor] || ACTOR_BADGE.System
                    }`}
                  >
                    {ev.actor}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>{formatTimestamp(ev.timestamp)}</span>
                  {ev.status && (
                    <span className="font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
                      {ev.status}
                    </span>
                  )}
                  {typeof ev.score === 'number' && (
                    <span className="font-semibold text-cyan-600">{ev.score}/100</span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
