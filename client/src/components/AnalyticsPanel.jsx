import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts'
import { Badge, Card, CardContent, Button } from './UI'
import { getStatusLabel, getBadgeVariant } from '../utils/helpers'
import { BarChart3, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

/**
 * Analytics with a real interactive bar chart (recharts).
 */
export default function AnalyticsPanel({ stats, complaints = [], compact = false }) {
  const [mode, setMode] = useState('status')

  const TONE_HEX = {
    REPORTED: '#A855F7',
    ASSIGNED: '#6366F1',
    UNDER_REPAIR: '#3B82F6',
    VERIFICATION: '#F59E0B',
    VERIFIED: '#10B981',
    MANUAL_REVIEW: '#F59E0B',
    REJECTED: '#EF4444',
    RESOLVED: '#10B981',
    low: '#10B981',
    medium: '#06b6d4',
    high: '#f59e0b',
    critical: '#ef4444'
  }

  const prettyLabel = (s) =>
    String(s).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

  const statusRows = useMemo(() => {
    const keys = ['REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED']
    const counts = stats?.statusStats || {}
    return keys.map((k) => ({ label: prettyLabel(getStatusLabel(k)), value: Number(counts[k] || 0), status: k }))
  }, [stats])

  const severityRows = useMemo(() => {
    const sev = stats?.severityStats || {}
    return ['low', 'medium', 'high', 'critical'].map((s) => ({
      label: prettyLabel(s),
      value: Number(sev[s] || 0),
      status: s
    }))
  }, [stats])

  const verification = stats?.verificationStats || {}
  const rows = mode === 'status' ? statusRows : severityRows
  const chartData = useMemo(
    () => rows.map((r) => ({ ...r, tone: TONE_HEX[r.status] || '#0ea5e9' })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  )

  const avgH = stats?.avgResolutionTimeMs ? Math.round(stats.avgResolutionTimeMs / 3600000) : null

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover className="border-[var(--border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" /> Verified rate
              </div>
              <p className="text-3xl font-bold mono-num text-[var(--accent-green)]">{verification.verifiedRate || 0}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{verification.verified || 0} of {verification.total || 0} verifications</p>
            </CardContent>
          </Card>
          <Card hover className="border-[var(--border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <AlertCircle className="w-4 h-4 text-[var(--accent-amber)]" /> Manual review
              </div>
              <p className="text-3xl font-bold mono-num text-[var(--accent-amber)]">{verification.manualReview || 0}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Needs officer decision</p>
            </CardContent>
          </Card>
          <Card hover className="border-[var(--border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <XCircle className="w-4 h-4 text-[var(--accent-red)]" /> Rejected (fraud)
              </div>
              <p className="text-3xl font-bold mono-num text-[var(--accent-red)]">{verification.rejected || 0}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Anti-fraud detections</p>
            </CardContent>
          </Card>
          <Card hover className="border-[var(--border-subtle)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                <Clock className="w-4 h-4 text-[var(--accent-cyan)]" /> Avg resolution
              </div>
              <p className="text-3xl font-bold mono-num text-[var(--accent-cyan)]">{avgH != null ? `${avgH}h` : '—'}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Report → resolved</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-[var(--border-subtle)]">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="panel-title flex items-center gap-2 text-[var(--text-primary)]">
                <BarChart3 className="w-4 h-4 text-[var(--accent-cyan)]" />
                Status Distribution
              </h3>
              <p className="tech-label text-[var(--text-muted)] mt-1">Reported → Resolved pipeline</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant={mode === 'status' ? 'primary' : 'outline'} onClick={() => setMode('status')}>
                By status
              </Button>
              <Button size="sm" variant={mode === 'severity' ? 'primary' : 'outline'} onClick={() => setMode('severity')}>
                By severity
              </Button>
            </div>
          </div>

          <div className="h-72 w-full" data-testid="analytics-bar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                  tickLine={false}
                  label={{
                    value: mode === 'status' ? 'Complaints' : 'Count',
                    position: 'insideBottom',
                    offset: -2,
                    fontSize: 10,
                    fill: '#64748B'
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  tick={{ fontSize: 11, fill: '#CBD5E1', fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(148,163,184,0.25)' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(34, 211, 238, 0.06)' }}
                  contentStyle={{
                    background: 'rgba(6, 17, 31, 0.96)',
                    borderRadius: '8px',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    fontSize: '12px',
                    color: '#E6EDF3',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)'
                  }}
                  formatter={(value) => [value, mode === 'status' ? 'Complaints' : 'Count']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={700}>
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.tone} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 700, fill: '#E6EDF3' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {complaints.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-subtle)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Recent scores</p>
              <div className="flex flex-wrap gap-2">
                {complaints.filter((c) => c.verificationResultId).slice(0, 6).map((c) => (
                  <Linkish key={c._id} id={c._id} decision={c.verificationResultId.decision} score={c.verificationResultId.totalScore} cid={c.complaintId} />
                ))}
                {!complaints.some((c) => c.verificationResultId) && (
                  <p className="text-xs text-[var(--text-muted)]">No verification results yet in this view.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Linkish({ id, decision, score, cid }) {
  const tone = decision === 'VERIFIED' ? 'success' : decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'
  return (
    <a href={`/municipal/complaint/${id}`} className="inline-flex">
      <Badge variant={tone}>{cid} · {score}</Badge>
    </a>
  )
}
