import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contractorAPI } from '../utils/api'
import { formatRelativeTime, getSeverityColor, getStatusColor, getStatusLabel, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK } from '../utils/helpers'
import { describeLocation } from '../utils/geocode'
import { MapPin, AlertTriangle, Hammer, CheckCircle, Loader2, ChevronRight, Play, Camera, TrendingUp, Megaphone, ArrowUpRight, ClipboardList, AlertCircle, XCircle } from 'lucide-react'
import { Button, Card, CardContent, Badge, EmptyState, SkeletonList } from '../components/UI'
import ImpactPanel from '../components/ImpactPanel'

const statusOptions = ['ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED']

const statusPillClass = {
  REPORTED: 'pill-reported',
  ASSIGNED: 'pill-assigned',
  UNDER_REPAIR: 'pill-repair',
  VERIFICATION: 'pill-verification',
  VERIFIED: 'pill-verified',
  MANUAL_REVIEW: 'pill-review',
  REJECTED: 'pill-rejected',
  RESOLVED: 'pill-resolved'
}

const kpiTones = {
  cyan: { box: 'bg-[var(--accent-cyan-dim)] border-[rgba(34,211,238,0.3)]', text: 'text-[var(--accent-cyan)]', bar: 'from-[var(--accent-cyan)]' },
  purple: { box: 'bg-[var(--accent-purple-dim)] border-[rgba(139,92,246,0.3)]', text: 'text-[var(--accent-purple)]', bar: 'from-[var(--accent-purple)]' },
  blue: { box: 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.3)]', text: 'text-[var(--accent-blue)]', bar: 'from-[var(--accent-blue)]' },
  amber: { box: 'bg-[var(--accent-amber-dim)] border-[rgba(245,158,11,0.3)]', text: 'text-[var(--accent-amber)]', bar: 'from-[var(--accent-amber)]' },
  green: { box: 'bg-[var(--accent-green-dim)] border-[rgba(16,185,129,0.3)]', text: 'text-[var(--accent-green)]', bar: 'from-[var(--accent-green)]' },
  red: { box: 'bg-[var(--accent-red-dim)] border-[rgba(239,68,68,0.3)]', text: 'text-[var(--accent-red)]', bar: 'from-[var(--accent-red)]' }
}

const viewTabs = {
  dashboard: 'all',
  active: 'UNDER_REPAIR',
  submitted: 'VERIFICATION,MANUAL_REVIEW,REJECTED',
  verified: 'VERIFIED,RESOLVED'
}

const viewTitles = {
  dashboard: { title: 'My Assignments', subtitle: 'View and manage your assigned repair jobs' },
  active: { title: 'Active Repairs', subtitle: 'Jobs currently under repair' },
  submitted: { title: 'Submitted', subtitle: 'Evidence submitted and awaiting verification' },
  verified: { title: 'Verified', subtitle: 'Successfully verified and resolved repairs' }
}

export default function ContractorDashboard({ view = 'dashboard' }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [activeTab, setActiveTab] = useState(viewTabs[view] || 'all')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    setActiveTab(viewTabs[view] || 'all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [view])

  const meta = viewTitles[view] || viewTitles.dashboard

  const countStatus = (...statuses) => complaints.filter(c => statuses.includes(c.status)).length

  const kpis = [
    { label: 'Assigned Repairs', value: stats?.totalAssigned ?? pagination.total, icon: ClipboardList, tone: 'cyan' },
    { label: 'Pending Repairs', value: stats?.pendingRepairs ?? countStatus('ASSIGNED'), icon: AlertTriangle, tone: 'purple' },
    { label: 'Under Repair', value: stats?.underRepair ?? countStatus('UNDER_REPAIR'), icon: Hammer, tone: 'blue' },
    { label: 'Evidence Required', value: stats?.evidencePending ?? countStatus('ASSIGNED', 'UNDER_REPAIR'), icon: Camera, tone: 'amber' },
    { label: 'Verification Pending', value: stats?.verificationPending ?? countStatus('VERIFICATION'), icon: Loader2, tone: 'cyan' },
    { label: 'Verified', value: stats ? stats.verified + stats.resolved : countStatus('VERIFIED', 'RESOLVED'), icon: CheckCircle, tone: 'green' },
    { label: 'Manual Review', value: stats?.manualReview ?? countStatus('MANUAL_REVIEW'), icon: AlertCircle, tone: 'amber' },
    { label: 'Rejected', value: stats?.rejected ?? countStatus('REJECTED'), icon: XCircle, tone: 'red' }
  ]

  useEffect(() => {
    let cancelled = false
    contractorAPI.getStats()
      .then((res) => { if (!cancelled) setStats(res.data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const fetchAssignments = async () => {
    if (!initialLoaded) setLoading(true)
    setError('')
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (activeTab !== 'all') params.status = activeTab
      
      const response = await contractorAPI.getAssignments(params)
      setComplaints(response.data.complaints)
      setPagination(prev => ({ ...prev, total: response.data.pagination.total, pages: response.data.pagination.pages }))
    } catch (err) {
      setError('Failed to load assignments')
    } finally {
      setLoading(false)
      setInitialLoaded(true)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [pagination.page, activeTab])

  const handleStartRepair = async (complaintId) => {
    try {
      await contractorAPI.startRepair(complaintId)
      fetchAssignments()
    } catch (err) {
      alert('Failed to start repair')
    }
  }

  if (loading && !initialLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_14px_rgba(34,211,238,0.65)] flex-shrink-0" />
          <div>
            <p className="tech-label mb-1">Contractor Command Center</p>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{meta.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">{meta.subtitle}</p>
          </div>
        </div>
        <Card className="border-[var(--border-subtle)]"><SkeletonList rows={5} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-1 h-10 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_14px_rgba(34,211,238,0.65)] flex-shrink-0" />
          <div>
            <p className="tech-label mb-1">Contractor Command Center</p>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] text-glow-cyan">{meta.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* KPI strip — real counts from /api/contractor/stats (fallback: loaded assignments) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const tone = kpiTones[kpi.tone]
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} hover className="relative overflow-hidden group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="panel-title mb-1.5">{kpi.label}</p>
                    <p className="text-3xl font-bold mono-num text-[var(--text-primary)] group-hover:text-glow-cyan transition-all">{kpi.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${tone.box}`}>
                    <Icon className={`w-5 h-5 ${tone.text}`} />
                  </div>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${tone.bar} to-transparent opacity-70`} />
            </Card>
          )
        })}
      </div>

      {/* Impact metrics */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ImpactPanel stats={{
            total: stats?.totalAssigned ?? pagination.total,
            resolved: stats ? stats.verified + stats.resolved : complaints.filter(c => ['VERIFIED', 'RESOLVED'].includes(c.status)).length,
            active: stats?.evidencePending ?? complaints.filter(c => ['ASSIGNED', 'UNDER_REPAIR'].includes(c.status)).length,
            underRepair: stats?.underRepair ?? complaints.filter(c => c.status === 'UNDER_REPAIR').length
          }} />
        </div>
        <div className="lg:col-span-2">
          <Card className="border-[rgba(34,211,238,0.3)] h-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-purple-dim)] to-[var(--accent-cyan-dim)] flex items-center justify-between">
              <h3 className="panel-title text-[var(--accent-cyan)]">How FixMyCity works</h3>
              <span className="tech-label px-2 py-0.5 rounded bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[rgba(34,211,238,0.35)]">Demo</span>
            </div>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {['REPORT', 'TRACK', 'REPAIR', 'AI VERIFY', 'PROVE'].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded font-mono tracking-wider bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[rgba(34,211,238,0.35)]">{s}</span>
                    {i < arr.length - 1 && <span className="flow-arrow">→</span>}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-3">
                We verify the location, not just the repair — GPS + viewpoint + landmarks + road geometry + pothole region (score /100).
              </p>
              {stats && (
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold mono-num text-[var(--accent-cyan)]">{stats.avgScore || 0}</p>
                    <p className="tech-label mt-0.5">Avg AI score</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold mono-num text-[var(--accent-amber)]">{stats.verificationPending || 0}</p>
                    <p className="tech-label mt-0.5">In review</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold mono-num text-[var(--accent-green)]">{stats.completedVerifications || 0}</p>
                    <p className="tech-label mt-0.5">AI decisions</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', ...statusOptions].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPagination(prev => ({ ...prev, page: 1 })) }}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white shadow-[0_0_18px_rgba(34,211,238,0.35)]'
                : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] border border-transparent hover:border-[var(--border-subtle)]'
            }`}
          >
            {tab === 'all' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <Card className="border-[var(--border-subtle)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent flex items-center justify-between">
          <h3 className="panel-title text-[var(--accent-cyan)]">Repair Queue</h3>
          <span className="tech-label mono-num">{pagination.total} Total</span>
        </div>
        {loading && !initialLoaded ? (
          <SkeletonList rows={5} />
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Failed to Load"
            description={error}
            action={<Button onClick={fetchAssignments}>Retry</Button>}
          />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={<Hammer className="w-8 h-8" />}
            title={activeTab === 'all' ? 'No Assignments' : `No ${getStatusLabel(activeTab).toLowerCase()} Assignments`}
            description={activeTab === 'all' 
              ? "You don't have any repair assignments at the moment."
              : `You don't have any ${getStatusLabel(activeTab).toLowerCase()} assignments at the moment.`}
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {complaints.map((complaint) => (
              <Link key={complaint._id} to={`/contractor/complaint/${complaint._id}`} className="block group transition-all duration-200">
                <div className="p-4 hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-subtle)] border border-transparent transition-all duration-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-20 h-20 flex-shrink-0 relative rounded-lg overflow-hidden bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
                      {complaint.imageUrl ? (
                        <img
                          src={complaint.imageUrl}
                          alt={complaint.title}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                        />
                      ) : (
                        <img src={IMAGE_FALLBACK} alt="No image" className="w-20 h-20 object-cover rounded-lg" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base lg:text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">{complaint.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-mono mono-num">{complaint.complaintId} • {formatRelativeTime(complaint.createdAt)}</p>
                        </div>
                        <span className={`pill ${statusPillClass[complaint.status] || 'pill-reported'} flex-shrink-0`}>
                          {getStatusLabel(complaint.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="capitalize">
                            {complaint.severity}
                          </Badge>
                        </span>
                        {(complaint.address || complaint.latitude) && (
                          <span className="flex items-center gap-1.5 min-w-0 px-2 py-0.5 rounded-md bg-[var(--accent-cyan-dim)] border border-[rgba(34,211,238,0.3)]">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent-cyan)]" />
                            <span className="truncate text-xs font-medium text-[var(--accent-cyan)]">{describeLocation(complaint.latitude, complaint.longitude, complaint.address)}</span>
                          </span>
                        )}
                        {complaint.assignedAuthority && (
                          <span className="flex items-center gap-1">
                            <span className="tech-label">Authority</span>
                            <span className="font-medium text-[var(--text-secondary)]">{complaint.assignedAuthority}</span>
                          </span>
                        )}
                        {complaint.citizenId && (
                          <span className="flex items-center gap-1">
                            <span className="tech-label">Reported by</span>
                            <span className="font-medium text-[var(--text-secondary)]">{complaint.citizenId.name}</span>
                          </span>
                        )}
                      </div>

                      {complaint.verificationResultId && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="tech-label">Verification</span>
                          <Badge variant={complaint.verificationResultId.decision === 'VERIFIED' ? 'success' : complaint.verificationResultId.decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'}>
                            {complaint.verificationResultId.decision} <span className="mono-num ml-1">{complaint.verificationResultId.totalScore}/100</span>
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md text-[var(--accent-cyan)] bg-[var(--accent-cyan-dim)] border border-[rgba(34,211,238,0.35)] group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-shadow">
                        {['ASSIGNED', 'UNDER_REPAIR', 'REJECTED'].includes(complaint.status) && !complaint.repairSubmissionId
                          ? 'Upload Evidence →'
                          : 'Open Details →'}
                      </span>
                    </div>

                    <ChevronRight className="hidden sm:block w-5 h-5 text-[var(--text-muted)] flex-shrink-0 group-hover:text-[var(--accent-cyan)] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}