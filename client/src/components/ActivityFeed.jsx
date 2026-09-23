import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, CardContent, EmptyState } from './UI'
import { getStatusLabel, getBadgeVariant, formatRelativeTime } from '../utils/helpers'
import { Radio, ArrowRight } from 'lucide-react'

/**
 * Live activity feed — derives recent events from complaints list (persisted backend data).
 */
export default function ActivityFeed({ complaints = [], limit = 8 }) {
  const events = []
  for (const c of complaints) {
    const base = {
      id: c._id,
      complaintId: c.complaintId,
      title: c.title,
      status: c.status,
      at: c.updatedAt || c.createdAt
    }
    if (c.status === 'REPORTED') events.push({ ...base, kind: 'New report', tone: 'info' })
    else if (c.status === 'ASSIGNED') events.push({ ...base, kind: 'Contractor assigned', tone: 'purple' })
    else if (c.status === 'UNDER_REPAIR') events.push({ ...base, kind: 'Repair started', tone: 'warning' })
    else if (c.status === 'VERIFICATION') events.push({ ...base, kind: 'Evidence awaiting AI', tone: 'cyan' })
    else if (c.status === 'VERIFIED') events.push({ ...base, kind: 'AI verified', tone: 'success' })
    else if (c.status === 'MANUAL_REVIEW') events.push({ ...base, kind: 'Manual review', tone: 'warning' })
    else if (c.status === 'REJECTED') events.push({ ...base, kind: 'Repair rejected', tone: 'danger' })
    else if (c.status === 'RESOLVED') events.push({ ...base, kind: 'Marked resolved', tone: 'success' })
  }

  events.sort((a, b) => new Date(b.at) - new Date(a.at))
  const shown = events.slice(0, limit)

  const toneClass = {
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
    warning: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    success: 'bg-emerald-500',
    danger: 'bg-red-500'
  }

  return (
    <Card className="border-slate-200 h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-600" />
            Live Activity
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {shown.length === 0 ? (
          <EmptyState
            icon={<Radio className="w-7 h-7" />}
            title="No activity yet"
            description="New complaints and status changes will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {shown.map((e) => (
              <li key={e.kind + e.id + e.at}>
                <Link
                  to={`/municipal/complaint/${e.id}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${toneClass[e.tone] || 'bg-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 truncate">{e.kind}</span>
                      <Badge variant={getBadgeVariant(e.status)} className="text-[10px]">
                        {getStatusLabel(e.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{e.complaintId} · {e.title}</p>
                    <p className="text-[11px] text-slate-400">{formatRelativeTime(e.at)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 mt-1 flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
