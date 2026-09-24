import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { complaintAPI, notificationAPI } from '../utils/api'
import {
  formatRelativeTime, getStatusLabel, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK
} from '../utils/helpers'
import {
  MapPin, AlertTriangle, Clock, CheckCircle, Users, TrendingUp, Search, Filter, ChevronRight, XCircle,
  Settings, Building2, Hammer, Radio, Flame, ArrowUpRight, ClipboardList, BarChart3, Target, Loader2, AlertCircle,
  Zap
} from 'lucide-react'
import {
  Button, Card, CardContent, Badge, EmptyState, Select, Skeleton, SkeletonList, Spinner, Alert, Tabs, TabPanel
} from '../components/UI'
import ComplaintMap from '../components/ComplaintMap'
import ActivityFeed from '../components/ActivityFeed'
import AnalyticsPanel from '../components/AnalyticsPanel'
import { VerificationLabCases } from '../components/VerificationLabCases'

const statusOptions = ['REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED']
const severityOptions = ['low', 'medium', 'high', 'critical']

const viewConfig = {
  dashboard: { title: 'Municipal Command Center', subtitle: 'REPORT → TRACK → REPAIR → AI VERIFY → PROVE', showStats: true },
  complaints: { title: 'All Complaints', subtitle: 'Search, filter, and manage every reported pothole', showStats: false },
  map: { title: 'City Map', subtitle: 'Live markers across Thane with status filters + demo heatmap', showStats: false },
  verification: {
    title: 'Verification Center',
    subtitle: 'AI Proof-of-Repair — simulated lab cases + repairs awaiting review',
    showStats: false,
    status: 'VERIFICATION,MANUAL_REVIEW',
    verificationOnly: true
  },
  analytics: { title: 'Analytics', subtitle: 'Resolution rates and verification performance', showStats: true, statsOnly: true },
  contractors: { title: 'Contractors', subtitle: 'Registered contractors available for assignment', showStats: false, contractorsOnly: true },
  settings: { title: 'Settings', subtitle: 'Account and platform settings', showStats: false, settingsOnly: true }
}

const NAV_STATS = (stats) => [
  {
    label: 'TOTAL', value: stats.totalComplaints, color: 'text-[var(--text-primary)]', bg: 'bg-[var(--accent-blue-dim)]',
    icon: MapPin, iconColor: 'text-[var(--accent-blue)]'
  },
  {
    label: 'ACTIVE', value: stats.reported + stats.assigned + stats.underRepair + stats.verification,
    color: 'text-[var(--accent-amber)]', bg: 'bg-[var(--accent-amber-dim)]', icon: Clock, iconColor: 'text-[var(--accent-amber)]'
  },
  {
    label: 'UNDER REPAIR', value: stats.underRepair, color: 'text-[var(--accent-amber)]', bg: 'bg-[var(--accent-amber-dim)]',
    icon: Hammer, iconColor: 'text-[var(--accent-amber)]'
  },
  {
    label: 'AWAITING VERIFICATION', value: stats.verification, color: 'text-[var(--accent-cyan)]', bg: 'bg-[var(--accent-cyan-dim)]',
    icon: Target, iconColor: 'text-[var(--accent-cyan)]'
  },
  {
    label: 'VERIFIED', value: stats.verified, color: 'text-[var(--accent-green)]', bg: 'bg-[var(--accent-green-dim)]',
    icon: CheckCircle, iconColor: 'text-[var(--accent-green)]'
  },
  {
    label: 'MANUAL REVIEW', value: stats.manualReview, color: 'text-[var(--accent-amber)]', bg: 'bg-[var(--accent-amber-dim)]',
    icon: AlertCircle, iconColor: 'text-[var(--accent-amber)]'
  },
  {
    label: 'REJECTED', value: stats.rejected, color: 'text-[var(--accent-red)]', bg: 'bg-[var(--accent-red-dim)]',
    icon: XCircle, iconColor: 'text-[var(--accent-red)]'
  },
  {
    label: 'RESOLVED', value: stats.resolved, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--border-subtle)]',
    icon: CheckCircle, iconColor: 'text-[var(--text-secondary)]'
  }
]

export default function MunicipalDashboard({ view = 'dashboard' }) {
  const { user } = useAuth()
  const config = viewConfig[view] || viewConfig.dashboard
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ status: config.status || '', severity: '', search: '' })
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [contractors, setContractors] = useState([])
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [mapComplaints, setMapComplaints] = useState([])
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setFilters({ status: config.status || '', severity: '', search: '' })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [view])

  useEffect(() => {
    const onSearch = (e) => {
      setFilters((prev) => ({ ...prev, search: String(e.detail || '') }))
      setPagination((prev) => ({ ...prev, page: 1 }))
    }
    window.addEventListener('app-search', onSearch)
    return () => window.removeEventListener('app-search', onSearch)
  }, [])

  const fetchData = async () => {
    if (config.settingsOnly || config.contractorsOnly) {
      setLoading(false)
      setInitialLoaded(true)
      return
    }
    if (!initialLoaded) setLoading(true)
    setError('')
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters }
      const requests = [complaintAPI.getAll(params), complaintAPI.getStats()]
      if (view === 'map' || view === 'dashboard' || view === 'verification') {
        requests.push(complaintAPI.getAll({ limit: 200, ...(view === 'verification' ? { status: config.status } : {}) }))
      }
      const results = await Promise.all(requests)
      const complaintsRes = results[0]
      const statsRes = results[1]
      setComplaints(complaintsRes.data.complaints || [])
      setPagination((prev) => ({
        ...prev,
        total: complaintsRes.data.pagination?.total || 0,
        pages: complaintsRes.data.pagination?.pages || 0
      }))
      setStats(statsRes.data)
      if (results[2]) setMapComplaints(results[2].data.complaints || [])
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setInitialLoaded(true)
    }
  }

  useEffect(() => {
    fetchData()
    fetchContractors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters, view, reloadKey])

  const fetchContractors = async () => {
    try {
      const response = await complaintAPI.getContractors()
      setContractors(response.data.contractors || [])
    } catch {
      setContractors([])
    }
  }

  const handleAssignContractor = async (complaintId, contractorId) => {
    setAssignmentLoading(true)
    try {
      await complaintAPI.assignContractor(complaintId, contractorId)
      setShowAssignmentModal(false)
      setReloadKey((k) => k + 1)
    } catch {
      alert('Failed to assign contractor')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await complaintAPI.updateStatus(complaintId, newStatus)
      setReloadKey((k) => k + 1)
    } catch {
      alert('Failed to update status')
    }
  }

  const openAssignmentModal = (complaint) => {
    setSelectedComplaint(complaint)
    setShowAssignmentModal(true)
  }

  if (config.settingsOnly) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{config.title}</h1>
          <p className="text-[var(--text-muted)]">{config.subtitle}</p>
        </div>
        <Card className="border-[var(--border-subtle)]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-cyan-dim)] flex items-center justify-center">
                <Settings className="w-6 h-6 text-[var(--accent-cyan)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{user?.name}</p>
                <p className="text-sm text-[var(--text-muted)] capitalize">{user?.role} · {user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                <p className="text-[var(--text-muted)]">Phone</p>
                <p className="text-[var(--text-primary)]">{user?.phone || '—'}</p>
              </div>
              <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                <p className="text-[var(--text-muted)]">Address</p>
                <p className="text-[var(--text-primary)]">{user?.address || '—'}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Platform preferences are managed by the municipality administrator.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (config.contractorsOnly) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{config.title}</h1>
          <p className="text-[var(--text-muted)]">{config.subtitle}</p>
        </div>
        <Card className="border-[var(--border-subtle)]">
          {contractors.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Contractors"
              description="No contractor accounts registered yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-left text-sm text-[var(--text-muted)]">
                    <th className="pb-3 px-4 font-medium">Name</th>
                    <th className="pb-3 px-4 font-medium">Email</th>
                    <th className="pb-3 px-4 font-medium">Phone</th>
                    <th className="pb-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {contractors.map((c) => (
                    <tr key={c._id} className="hover:bg-[var(--bg-card-hover)] transition-all duration-200">
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{c.name}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{c.email}</td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">{c.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success">Available</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    )
  }

  if (config.statsOnly && stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{config.title}</h1>
          <p className="text-[var(--text-muted)]">{config.subtitle}</p>
        </div>
        <AnalyticsPanel stats={stats} complaints={complaints} />
      </div>
    )
  }

  if (view === 'map') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{config.title}</h1>
          <p className="text-[var(--text-muted)]">{config.subtitle}</p>
        </div>
        {loading && !initialLoaded ? (
          <Card><div className="p-8 flex items-center justify-center"><Spinner size="lg" /></div></Card>
        ) : (
          <>
            <MapFilters filters={filters} setFilters={setFilters} statusOptions={statusOptions} severityOptions={severityOptions} />
            <ComplaintMap complaints={mapComplaints.length ? mapComplaints : complaints} height={560} heatmap heatmapLabels={['Majiwada', 'Naupada', 'Pokhran', 'Kolshet']} />
          </>
        )}
      </div>
    )
  }

  if (loading && !initialLoaded) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{config.title}</h1>
          <p className="text-[var(--text-muted)]">{config.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-[var(--border-subtle)]"><CardContent className="p-4 space-y-3"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-8 w-1/3" /></CardContent></Card>
          ))}
        </div>
        <Card className="border-[var(--border-subtle)]"><SkeletonList rows={5} /></Card>
      </div>
    )
  }

  const showStatsGrid = config.showStats && stats && view === 'dashboard'
  const filteredForFeed = view === 'dashboard' || view === 'verification' ? mapComplaints.length ? mapComplaints : complaints : complaints
  const verificationQueue = complaints

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{config.title}</h1>
            {view === 'dashboard' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]">
                Thane · TMC
              </span>
            )}
          </div>
          <p className="text-[var(--text-muted)]">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/municipal/verification">
            <Button variant="outline" size="sm"><Target className="w-4 h-4" /> Verification Center</Button>
          </Link>
          <Link to="/municipal/map">
            <Button variant="outline" size="sm"><Flame className="w-4 h-4" /> Heatmap</Button>
          </Link>
        </div>
      </div>

      {/* 8 command stats */}
      {showStatsGrid && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {NAV_STATS(stats).map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} hover className="border-[var(--border-subtle)]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] leading-tight">{s.label}</span>
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dashboard extras: verification lab cases + feed */}
      {view === 'dashboard' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <VerificationLabCases compact />
          </div>
          <div>
            <ActivityFeed complaints={filteredForFeed} />
          </div>
        </div>
      )}

      {view === 'verification' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VerificationLabCases />
          </div>
          <div>
            <ActivityFeed complaints={filteredForFeed} limit={6} />
          </div>
        </div>
      )}

      {view === 'dashboard' && stats && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-[var(--border-subtle)] h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--accent-cyan)]" /> City overview</h3>
                  <Link to="/municipal/map" className="text-xs text-[var(--accent-cyan)] font-medium inline-flex items-center gap-1">
                    Full map <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <ComplaintMap complaints={mapComplaints.length ? mapComplaints : complaints} height={340} heatmap heatmapLabels={['Majiwada', 'Naupada', 'Pokhran', 'Kolshet']} />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-[var(--border-subtle)] h-full">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[var(--accent-cyan)]" /> Verified rate</h3>
                <p className="text-4xl font-bold text-[var(--accent-green)]">{stats.verificationStats?.verifiedRate || 0}%</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {stats.verificationStats?.verified || 0} verified · {stats.verificationStats?.manualReview || 0} manual · {stats.verificationStats?.rejected || 0} rejected
                </p>
                <div className="h-2.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-cyan)] rounded-full transition-all"
                    style={{ width: `${stats.verificationStats?.verifiedRate || 0}%` }} />
                </div>
                <div className="pt-3 border-t border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                  <p className="flex justify-between"><span>Avg resolution</span>
                    <strong>{stats.avgResolutionTimeMs ? `${Math.round(stats.avgResolutionTimeMs / 3600000)}h` : '—'}</strong></p>
                  <p className="flex justify-between mt-1"><span>Saved for demo (DEMO)</span>
                    <Badge variant="primary">Illustrative</Badge></p>
                </div>
                <Link to="/municipal/analytics" className="inline-flex">
                  <Button variant="outline" size="sm" className="w-full">Open Analytics</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {view === 'verification' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Awaiting verification / manual review</h2>
            <Badge variant="primary">{verificationQueue.length} item(s)</Badge>
          </div>
          {verificationQueue.length === 0 ? (
            <Card><EmptyState icon={<Target className="w-8 h-8" />} title="Queue clear" description="No repairs awaiting verification right now." /></Card>
          ) : (
            <Card className="border-[var(--border-subtle)]">
              <VerificationQueueList items={verificationQueue} onStatus={handleStatusChange} />
            </Card>
          )}
        </div>
      )}

      {/* Filters (non-map, non-verification-queue-only) */}
      <MapFilters filters={filters} setFilters={setFilters} statusOptions={statusOptions} severityOptions={severityOptions} />

      {/* Complaints Table */}
      <Card className="border-[var(--border-subtle)]">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Complaints</h3>
          <span className="text-xs text-[var(--text-muted)]">{pagination.total} total</span>
        </div>
        {loading && !initialLoaded ? (
          <SkeletonList rows={5} />
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Failed to Load"
            description={error}
            action={<Button onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>}
          />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-8 h-8" />}
            title="No Complaints Found"
            description="No complaints match your current filters."
            action={<Button onClick={() => setFilters({ status: '', severity: '', search: '' })}>Clear Filters</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-left text-sm text-[var(--text-muted)]">
                  <th className="pb-3 px-4 font-medium">ID</th>
                  <th className="pb-3 px-4 font-medium">Title</th>
                  <th className="pb-3 px-4 font-medium hidden md:table-cell">Citizen</th>
                  <th className="pb-3 px-4 font-medium hidden xl:table-cell">Authority</th>
                  <th className="pb-3 px-4 font-medium">Severity</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium hidden lg:table-cell">Assigned</th>
                  <th className="pb-3 px-4 font-medium hidden lg:table-cell">Verification</th>
                  <th className="pb-3 px-4 font-medium">Date</th>
                  <th className="pb-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {complaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-[var(--bg-card-hover)] transition-all duration-200">
                    <td className="py-4 px-4 font-mono text-sm text-[var(--text-primary)]">{complaint.complaintId}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] flex-shrink-0">
                          <img
                            src={complaint.imageUrl || IMAGE_FALLBACK}
                            alt=""
                            className="w-10 h-10 object-cover rounded-md"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                          />
                        </div>
                        <Link to={`/municipal/complaint/${complaint._id}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-cyan)] transition-colors">
                          {complaint.title}
                        </Link>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell text-[var(--text-muted)]">{complaint.citizenId?.name || 'Unknown'}</td>
                    <td className="py-4 px-4 hidden xl:table-cell text-xs text-[var(--accent-cyan)]">{complaint.assignedAuthority || 'TMC'}</td>
                    <td className="py-4 px-4">
                      <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="capitalize">{complaint.severity}</Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getBadgeVariant(complaint.status)}>{getStatusLabel(complaint.status)}</Badge>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      {complaint.contractorId ? (
                        <span className="text-[var(--accent-cyan)]">{complaint.contractorId.name}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">
                      {complaint.verificationResultId ? (
                        <Badge variant={complaint.verificationResultId.decision === 'VERIFIED' ? 'success' : complaint.verificationResultId.decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'}>
                          {complaint.verificationResultId.decision} ({complaint.verificationResultId.totalScore})
                        </Badge>
                      ) : (
                        <span className="text-[var(--text-muted)]">Pending</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-[var(--text-muted)]">{formatRelativeTime(complaint.createdAt)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Link to={`/municipal/complaint/${complaint._id}`}>
                          <Button variant="ghost" size="sm"><ChevronRight className="w-4 h-4" /></Button>
                        </Link>
                        {!complaint.contractorId && complaint.status === 'REPORTED' && (
                          <Button variant="outline" size="sm" onClick={() => openAssignmentModal(complaint)}>Assign</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.pages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Assign modal */}
      {showAssignmentModal && selectedComplaint && (
        <div className="fixed inset-0 z-[var(--z-floating)] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Assign Contractor</h2>
              <p className="text-sm text-[var(--text-muted)]">{selectedComplaint.complaintId} · {selectedComplaint.title}</p>
            </div>
            {contractors.length === 0 ? (
              <Alert variant="warning">No contractors available. Contractors must register first.</Alert>
            ) : (
              <Select
                value=""
                onChange={(e) => e.target.value && handleAssignContractor(selectedComplaint._id, e.target.value)}
                options={[{ value: '', label: 'Select contractor…' }, ...contractors.map((c) => ({ value: c._id, label: `${c.name} (${c.email})` }))]}
              />
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAssignmentModal(false); setSelectedComplaint(null) }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MapFilters({ filters, setFilters, statusOptions, severityOptions }) {
  return (
    <Card className="border-[var(--border-subtle)]">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={filters.search}
              onChange={(e) => { setFilters((prev) => ({ ...prev, search: e.target.value })) }}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-card-hover)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]"
            />
          </div>
          <Select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            options={statusOptions.map((s) => ({ value: s, label: getStatusLabel(s) }))}
            placeholder="All Statuses"
            className="sm:w-48"
          />
          <Select
            value={filters.severity}
            onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value }))}
            options={severityOptions.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            placeholder="All Severities"
            className="sm:w-40"
          />
          <Button variant="outline" onClick={() => setFilters({ status: '', severity: '', search: '' })}>
            <Filter className="w-4 h-4" /> Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function VerificationQueueList({ items, onStatus }) {
  return (
    <div className="divide-y divide-[var(--border-subtle)]">
      {items.map((c) => (
        <div key={c._id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[var(--bg-card-hover)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/municipal/complaint/${c._id}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-cyan)]">{c.title}</Link>
              <Badge variant={getBadgeVariant(c.status)}>{getStatusLabel(c.status)}</Badge>
              {c.verificationResultId && (
                <Badge variant={c.verificationResultId.decision === 'VERIFIED' ? 'success' : c.verificationResultId.decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'}>
                  {c.verificationResultId.totalScore}/100
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{c.complaintId} · {formatRelativeTime(c.createdAt)}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="success" onClick={() => onStatus(c._id, 'VERIFIED')}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => onStatus(c._id, 'MANUAL_REVIEW')}>Manual</Button>
            <Button size="sm" variant="danger" onClick={() => onStatus(c._id, 'REJECTED')}>Reject</Button>
          </div>
        </div>
      ))}
    </div>
  )
}
