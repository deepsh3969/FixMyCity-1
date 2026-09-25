import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { complaintAPI } from '../utils/api'
import { formatRelativeTime, getSeverityColor, getStatusColor, getStatusLabel, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK } from '../utils/helpers'
import { Plus, MapPin, AlertTriangle, CheckCircle, ChevronRight, Activity, Sparkles, Hammer, Shield, Map as MapIcon } from 'lucide-react'
import { Button, Card, CardContent, Badge, ProgressBar, EmptyState, Spinner, SkeletonList } from '../components/UI'
import ComplaintMap from '../components/ComplaintMap'
import ImpactPanel from '../components/ImpactPanel'
import { describeLocation } from '../utils/geocode'

export default function CitizenDashboard({ view = 'dashboard' }) {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    underRepair: 0,
    resolved: 0,
    aiVerified: 0
  })
  const [aiStats, setAiStats] = useState({ analyzed: 0, highConf: 0, manual: 0, unverified: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [mapComplaints, setMapComplaints] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const isMapView = view === 'map'
  const isHistoryView = view === 'history'

  const fetchComplaints = async () => {
    if (!initialLoaded) setLoading(true)
    setError('')
    try {
      const params = { page: pagination.page, limit: isHistoryView ? 50 : pagination.limit }
      if (activeTab !== 'all') params.status = activeTab
      
      const response = await complaintAPI.getMy(params)
      setComplaints(response.data.complaints)
      setPagination(prev => ({ ...prev, total: response.data.pagination.total, pages: response.data.pagination.pages }))
      
      const allComplaints = await complaintAPI.getMy({ limit: 100 })
      const all = allComplaints.data.complaints
      setMapComplaints(all)
      const withVer = all.filter(c => c.verificationResultId)
      setStats({
        total: all.length,
        active: all.filter(c => ['REPORTED', 'ASSIGNED', 'VERIFICATION', 'MANUAL_REVIEW'].includes(c.status)).length,
        underRepair: all.filter(c => c.status === 'UNDER_REPAIR').length,
        resolved: all.filter(c => c.status === 'RESOLVED').length,
        aiVerified: withVer.filter(c => c.verificationResultId.decision === 'VERIFIED').length
      })
      setAiStats({
        analyzed: withVer.length,
        highConf: withVer.filter(c => c.verificationResultId.confidence === 'HIGH').length,
        manual: all.filter(c => c.status === 'MANUAL_REVIEW' || c.verificationResultId?.decision === 'MANUAL_REVIEW').length,
        unverified: all.length - withVer.length
      })
    } catch (err) {
      setError('Failed to load complaints')
    } finally {
      setLoading(false)
      setInitialLoaded(true)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [pagination.page, activeTab])

  useEffect(() => {
    const onSearch = (e) => setSearch(String(e.detail || '').trim())
    window.addEventListener('app-search', onSearch)
    return () => window.removeEventListener('app-search', onSearch)
  }, [])

  const statusOrder = ['REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED']
  const getStatusIndex = (status) => statusOrder.indexOf(status)
  const progressPct = (status) => {
    const idx = getStatusIndex(status)
    if (status === 'RESOLVED') return 100
    if (status === 'REJECTED') return 45
    if (idx < 0) return 0
    return Math.min(95, Math.round(((idx + 1) / statusOrder.length) * 100))
  }

  const filteredComplaints = complaints.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.complaintId || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    )
  })

  const sortedComplaints = [...filteredComplaints].sort((a, b) => getStatusIndex(a.status) - getStatusIndex(b.status))

  const pageMeta = isMapView
    ? { title: 'Map View', subtitle: 'Your reported potholes on the city map' }
    : isHistoryView
      ? { title: 'Report History', subtitle: 'Full history of your pothole reports' }
      : { title: 'My Reports', subtitle: 'Track your pothole complaints and repair progress' }

  if (isMapView) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{pageMeta.title}</h1>
          <p className="text-[var(--text-muted)]">{pageMeta.subtitle}</p>
        </div>
        {loading ? (
          <Card className="border-[var(--border-subtle)]"><SkeletonList rows={4} /></Card>
        ) : (
          <ComplaintMap complaints={complaints} height={520} showHeading />
        )}
        <Card className="border-[var(--border-subtle)]">
          <div className="p-4 text-sm text-[var(--text-muted)]">{complaints.length} report(s) plotted</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{pageMeta.title}</h1>
          <p className="text-[var(--text-muted)]">{pageMeta.subtitle}</p>
        </div>
        <Link to="/citizen/report">
          <Button size="lg">
            <Plus className="w-5 h-5" />
            Report Pothole
          </Button>
        </Link>
      </div>

      {/* History summary strip */}
      {isHistoryView && initialLoaded && !error && complaints.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {[
            { label: 'Total', value: stats.total, cls: 'text-[var(--text-primary)]' },
            { label: 'Active', value: stats.active, cls: 'text-[var(--accent-amber)]' },
            { label: 'Under repair', value: stats.underRepair, cls: 'text-[var(--accent-amber)]' },
            { label: 'Resolved', value: stats.resolved, cls: 'text-[var(--accent-green)]' }
          ].map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
              <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
              <span className={`font-bold tabular-nums ${s.cls}`}>{s.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {!isHistoryView && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Reports', value: stats.active, icon: Activity, tone: 'cyan' },
          { label: 'Auto / AI Verified', value: stats.aiVerified, icon: Sparkles, tone: 'purple' },
          { label: 'Under Repair', value: stats.underRepair, icon: Hammer, tone: 'blue' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, tone: 'green' }
        ].map((kpi) => {
          const tones = {
            cyan: { box: 'bg-[var(--accent-cyan-dim)] border-[rgba(34,211,238,0.3)]', text: 'text-[var(--accent-cyan)]', bar: 'from-[var(--accent-cyan)]' },
            purple: { box: 'bg-[var(--accent-purple-dim)] border-[rgba(139,92,246,0.3)]', text: 'text-[var(--accent-purple)]', bar: 'from-[var(--accent-purple)]' },
            blue: { box: 'bg-[var(--accent-blue-dim)] border-[rgba(59,130,246,0.3)]', text: 'text-[var(--accent-blue)]', bar: 'from-[var(--accent-blue)]' },
            green: { box: 'bg-[var(--accent-green-dim)] border-[rgba(16,185,129,0.3)]', text: 'text-[var(--accent-green)]', bar: 'from-[var(--accent-green)]' }
          }
          const t = tones[kpi.tone]
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} hover className="relative overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="panel-title mb-1.5">{kpi.label}</p>
                    <p className="text-3xl font-bold mono-num text-[var(--text-primary)] group-hover:text-glow-cyan transition-all">{kpi.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${t.box}`}>
                    <Icon className={`w-6 h-6 ${t.text}`} />
                  </div>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${t.bar} to-transparent opacity-70`} />
            </Card>
          )
        })}
      </div>
      )}

      {/* Reference row: Report Flow + Live Map + How It Really Works */}
      {!isHistoryView && !loading && !error && (
        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <ImpactPanel stats={stats} />
          </div>

          <Card className="lg:col-span-2 border-[var(--accent-cyan)]/30 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[rgba(34,211,238,0.25)] bg-gradient-to-r from-[var(--accent-cyan-dim)] to-transparent flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
                <MapIcon className="w-4 h-4 text-[var(--accent-cyan)]" />
                Live City Map
              </h3>
              <span className="tech-label text-[var(--accent-cyan)]">MAP</span>
            </div>
            <ComplaintMap complaints={mapComplaints} height={320} heatmap />
          </Card>

          <Card className="border-[var(--accent-purple)]/30 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[rgba(139,92,246,0.25)] bg-gradient-to-r from-[var(--accent-purple-dim)] to-transparent flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
                <Shield className="w-4 h-4 text-[var(--accent-purple)]" />
                How It Really Works
              </h3>
            </div>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                {['REPORT', 'VERIFY', 'DISPATCH', 'TRACK', 'FIXED'].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={`px-2 py-1 rounded font-mono tracking-wider ${
                      s === 'FIXED'
                        ? 'bg-[var(--accent-green)] text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-[var(--accent-cyan)] text-[#030712] shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                    }`}>{s}</span>
                    {i < arr.length - 1 && <span className="flow-arrow">→</span>}
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                <li><span className="text-[var(--accent-cyan)] font-semibold">Every report</span> gets AI-verified, GPS-stamped and dispatched instantly.</li>
                <li>Duplicate detection uses road geometry + location match before dispatch.</li>
                <li>Repairs close only after AI confirms before/after evidence — <span className="text-[var(--accent-green)] font-semibold">no fake fixes</span>.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Report Intelligence */}
      {!isHistoryView && initialLoaded && !error && (
        <Card className="overflow-hidden border-[rgba(34,211,238,0.3)]">
          <div className="px-5 py-3.5 border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-[var(--text-primary)]">
              <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
              AI Report Intelligence
            </h3>
            <span className="tech-label text-[var(--accent-green)]">LIVE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--border-subtle)]">
            {[
              { label: 'Reports analyzed', value: aiStats.analyzed, tone: 'text-[var(--accent-cyan)]' },
              { label: 'High confidence', value: aiStats.highConf, tone: 'text-[var(--accent-green)]' },
              { label: 'Manual review', value: aiStats.manual, tone: 'text-[var(--accent-amber)]' },
              { label: 'Unverified', value: aiStats.unverified, tone: 'text-[var(--text-secondary)]' }
            ].map((cell) => (
              <div key={cell.label} className="px-5 py-4">
                <p className="tech-label mb-1.5">{cell.label}</p>
                <p className={`text-2xl font-bold mono-num ${cell.tone}`}>{cell.value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPagination(prev => ({ ...prev, page: 1 })) }}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white shadow-md'
                : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
            }`}
          >
            {tab === 'all' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      <Card className="border-[var(--border-subtle)]">
        {loading && !initialLoaded ? (
          <SkeletonList rows={5} />
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Failed to Load"
            description={error}
            action={<Button onClick={fetchComplaints}>Retry</Button>}
          />
        ) : sortedComplaints.length === 0 ? (
          <EmptyState
            icon={<MapPin className="w-8 h-8" />}
            title={activeTab === 'all' ? 'No Reports Yet' : `No ${getStatusLabel(activeTab).toLowerCase()} Reports`}
            description={activeTab === 'all' 
              ? 'Start by reporting your first pothole. Help make your city better!'
              : `You don't have any ${getStatusLabel(activeTab).toLowerCase()} complaints at the moment.`}
            action={activeTab === 'all' && (
              <Link to="/citizen/report">
                <Button><Plus className="w-5 h-5" /> Report Pothole</Button>
              </Link>
            )}
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {sortedComplaints.map((complaint) => (
              <Link key={complaint._id} to={`/citizen/complaint/${complaint._id}`} className="block group transition-all duration-200">
                <div className="p-4 hover:bg-white/[0.03] border border-transparent hover:border-[var(--border-subtle)] transition-all duration-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-20 h-20 flex-shrink-0 relative rounded-md overflow-hidden bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]">
                      {complaint.imageUrl ? (
                        <img
                          src={complaint.imageUrl}
                          alt={complaint.title}
                          className="w-20 h-20 object-cover rounded-md"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                        />
                      ) : (
                        <img src={IMAGE_FALLBACK} alt="No image" className="w-20 h-20 object-cover rounded-md" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold text-base lg:text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">{complaint.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-mono">{complaint.complaintId} • {formatRelativeTime(complaint.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="capitalize">
                            {complaint.severity}
                          </Badge>
                        </span>
                        {complaint.assignedAuthority && (
                          <span className="flex items-center gap-1">
                            <span>Authority:</span>
                            <span className="font-medium text-[var(--accent-cyan)]">{complaint.assignedAuthority}</span>
                          </span>
                        )}
                        {(complaint.address || complaint.latitude) && (
                          <span className="flex items-center gap-1.5 min-w-0 px-2 py-0.5 rounded-md bg-[var(--accent-cyan-dim)] border border-[rgba(34,211,238,0.3)]">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent-cyan)]" />
                            <span className="truncate text-xs font-medium text-[var(--accent-cyan)]">{describeLocation(complaint.latitude, complaint.longitude, complaint.address)}</span>
                          </span>
                        )}
                        {complaint.contractorId && (
                          <span className="flex items-center gap-1">
                            <span>Assigned to</span>
                            <span className="font-medium text-[var(--accent-cyan)]">{complaint.contractorId.name}</span>
                          </span>
                        )}
                      </div>

                      {complaint.verificationResultId && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)]">Verification:</span>
                          <Badge variant={complaint.verificationResultId.decision === 'VERIFIED' ? 'success' : complaint.verificationResultId.decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'}>
                            {complaint.verificationResultId.decision} ({complaint.verificationResultId.totalScore}/100)
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                      <Badge variant={getBadgeVariant(complaint.status)}>
                        {getStatusLabel(complaint.status)}
                      </Badge>
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-cyan)] bg-[var(--accent-cyan-dim)] border border-[rgba(34,211,238,0.35)] px-3 py-1.5 rounded-md group-hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-shadow">
                        Open Details →
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