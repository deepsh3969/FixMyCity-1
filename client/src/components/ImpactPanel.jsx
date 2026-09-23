import { Link } from 'react-router-dom'
import { Card, CardContent, Badge } from './UI'
import { getStatusLabel, getBadgeVariant, formatRelativeTime } from '../utils/helpers'
import { TrendingUp, Megaphone, ArrowUpRight } from 'lucide-react'

/**
 * Clearly-labeled DEMO impact metrics for citizens.
 */
export default function ImpactPanel({ stats }) {
  const total = stats?.total || 0
  const resolved = stats?.resolved || 0
  const active = stats?.active || 0
  const repaired = stats?.underRepair || 0 + resolved

  const rows = [
    { label: 'Reports filed', value: total, hint: 'You helped surface these', tone: 'text-[var(--accent-cyan)]' },
    { label: 'Repairs completed', value: resolved, hint: 'Verified or resolved', tone: 'text-[var(--accent-green)]' },
    { label: 'Still active', value: active, hint: 'In progress city-wide on your account', tone: 'text-[var(--accent-amber)]' },
    {
      label: 'Verified rate',
      value: total > 0 ? `${Math.round((resolved / total) * 100)}%` : '—',
      hint: 'Resolved / reported',
      tone: 'text-[var(--accent-purple)]'
    }
  ]

  return (
    <Card className="border-[var(--accent-cyan)]/30 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--accent-cyan)]/20 bg-gradient-to-r from-[var(--accent-cyan-dim)] to-[var(--accent-green-dim)] flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
          <TrendingUp className="w-4 h-4 text-[var(--accent-cyan)]" />
          Your Impact
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--text-primary)] text-white">
          Demo metrics
        </span>
      </div>
      <CardContent className="p-5 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{r.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{r.hint}</p>
            </div>
            <span className={`text-2xl font-bold tabular-nums ${r.tone}`}>{r.value}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Megaphone className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            Keep reporting — safer roads for Thane.
          </div>
          <Link to="/citizen/report" className="text-xs font-semibold text-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] inline-flex items-center gap-1">
            Report <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
