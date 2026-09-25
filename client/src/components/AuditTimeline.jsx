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
  REPORT_CREATED: { icon: FilePlus2, color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)', border: 'rgba(59,130,246,0.35)', glow: 'rgba(59,130,246,0.45)' },
  ASSIGNED: { icon: UserPlus, color: 'var(--accent-purple)', bg: 'var(--accent-purple-dim)', border: 'rgba(139,92,246,0.35)', glow: 'rgba(139,92,246,0.45)' },
  REPAIR_STARTED: { icon: Hammer, color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'rgba(245,158,11,0.35)', glow: 'rgba(245,158,11,0.45)' },
  EVIDENCE_UPLOADED: { icon: Upload, color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', border: 'rgba(34,211,238,0.4)', glow: 'rgba(34,211,238,0.5)' },
  AI_VERIFICATION: { icon: Cpu, color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', border: 'rgba(34,211,238,0.4)', glow: 'rgba(34,211,238,0.5)' },
  MUNICIPAL_REVIEW: { icon: Eye, color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'rgba(245,158,11,0.35)', glow: 'rgba(245,158,11,0.45)' },
  STATUS_CHANGED: { icon: RefreshCw, color: 'var(--text-secondary)', bg: 'var(--bg-card-hover)', border: 'var(--border-subtle)', glow: 'rgba(148,163,184,0.35)' },
  RESOLVED: { icon: CheckCircle2, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', border: 'rgba(16,185,129,0.4)', glow: 'rgba(16,185,129,0.5)' },
  REJECTED: { icon: XCircle, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', border: 'rgba(239,68,68,0.4)', glow: 'rgba(239,68,68,0.5)' }
}

const ACTOR_BADGE = {
  Citizen: 'bg-[var(--accent-blue-dim)] text-[#60A5FA] border-[rgba(59,130,246,0.35)]',
  Municipality: 'bg-[var(--accent-purple-dim)] text-[#A78BFA] border-[rgba(139,92,246,0.35)]',
  Contractor: 'bg-[var(--accent-amber-dim)] text-[#FBBF24] border-[rgba(245,158,11,0.35)]',
  AI: 'bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border-[rgba(34,211,238,0.35)]',
  System: 'bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
}

const STATUS_PILL = {
  REPORTED: 'pill-reported',
  ASSIGNED: 'pill-assigned',
  UNDER_REPAIR: 'pill-repair',
  VERIFICATION: 'pill-verification',
  VERIFIED: 'pill-verified',
  MANUAL_REVIEW: 'pill-review',
  REJECTED: 'pill-rejected',
  RESOLVED: 'pill-resolved'
}

const statusPill = (status) => STATUS_PILL[status] || 'pill-verification'

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
        <p className="panel-title">{emptyMessage}</p>
      </div>
    )
  }

  const events = [...timeline].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  )

  return (
    <div className="relative">
      <div
        className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-[var(--accent-cyan)] via-[var(--accent-cyan)] to-transparent opacity-70"
        aria-hidden="true"
      />
      <ol className="space-y-5">
        {events.map((ev, idx) => {
          const cfg = EVENT_CONFIG[ev.event] || EVENT_CONFIG.STATUS_CHANGED
          const Icon = cfg.icon
          return (
            <li
              key={`${ev.event}-${idx}-${ev.timestamp}`}
              className="relative flex gap-4 animate-fade-in"
              style={{ animationDelay: `${Math.min(idx, 8) * 80}ms` }}
            >
              <div
                className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-sm"
                style={{ backgroundColor: cfg.bg, borderColor: cfg.border, boxShadow: `0 0 10px ${cfg.glow}` }}
              >
                <Icon className="w-5 h-5" style={{ color: cfg.color }} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="tech-label text-[11px] text-[var(--text-primary)]">
                    {(ev.event || '').replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      ACTOR_BADGE[ev.actor] || ACTOR_BADGE.System
                    }`}
                  >
                    {ev.actor}
                  </span>
                </div>
                {ev.message && (
                  <p className="text-xs text-[var(--text-secondary)] mb-1.5 break-words">{ev.message}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="mono-num text-[11px]">{formatTimestamp(ev.timestamp)}</span>
                  {ev.status && (
                    <span className={`pill ${statusPill(ev.status)}`}>{ev.status}</span>
                  )}
                  {typeof ev.score === 'number' && (
                    <span className="mono-num text-[11px] font-semibold text-[var(--accent-cyan)]">{ev.score}/100</span>
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
