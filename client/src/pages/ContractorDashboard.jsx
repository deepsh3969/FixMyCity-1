import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contractorAPI } from '../utils/api'
import { formatRelativeTime, getSeverityColor, getStatusColor, getStatusLabel, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK } from '../utils/helpers'
import { MapPin, AlertTriangle, Hammer, CheckCircle, Loader2, ChevronRight, Play, Camera, TrendingUp, Megaphone, ArrowUpRight } from 'lucide-react'
import { Button, Card, CardContent, Badge, EmptyState, SkeletonList } from '../components/UI'
import ImpactPanel from '../components/ImpactPanel'

const statusOptions = ['ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED']

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

  useEffect(() => {
    setActiveTab(viewTabs[view] || 'all')
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [view])

  const meta = viewTitles[view] || viewTitles.dashboard

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
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{meta.title}</h1>
          <p className="text-[var(--text-muted)]">{meta.subtitle}</p>
        </div>
        <Card className="border-[var(--border-subtle)]"><SkeletonList rows={5} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{meta.title}</h1>
          <p className="text-[var(--text-muted)]">{meta.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="border-[var(--border-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm">Total Assigned</p>
                <p className="text-3xl font-bold text-[var(--text-primary)]">{pagination.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue-dim)] flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[var(--accent-blue)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover className="border-[var(--border-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm">Assigned</p>
                <p className="text-3xl font-bold text-[var(--accent-purple)]">
                  {complaints.filter(c => c.status === 'ASSIGNED').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-purple-dim)] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[var(--accent-purple)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover className="border-[var(--border-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm">Under Repair</p>
                <p className="text-3xl font-bold text-[var(--accent-amber)]">
                  {complaints.filter(c => c.status === 'UNDER_REPAIR').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-amber-dim)] flex items-center justify-center">
                <Hammer className="w-6 h-6 text-[var(--accent-amber)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card hover className="border-[var(--border-subtle)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-muted)] text-sm">Completed</p>
                <p className="text-3xl font-bold text-[var(--accent-green)]">
                  {complaints.filter(c => ['VERIFIED', 'RESOLVED'].includes(c.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-green-dim)] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[var(--accent-green)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DEMO Impact metrics */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ImpactPanel stats={{
            total: pagination.total,
            resolved: complaints.filter(c => ['VERIFIED', 'RESOLVED'].includes(c.status)).length,
            active: complaints.filter(c => ['ASSIGNED', 'UNDER_REPAIR'].includes(c.status)).length,
            underRepair: complaints.filter(c => c.status === 'UNDER_REPAIR').length
          }} />
        </div>
        <div className="lg:col-span-2">
          <Card className="border-[var(--accent-cyan)]/30 h-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--accent-cyan)]/20 bg-gradient-to-r from-[var(--accent-purple-dim)] to-[var(--accent-cyan-dim)] flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">How FixMyCity works</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--text-primary)] text-white">Demo</span>
            </div>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {['REPORT', 'TRACK', 'REPAIR', 'AI VERIFY', 'PROVE'].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[var(--accent-cyan)] text-white">{s}</span>
                    {i < arr.length - 1 && <span className="text-[var(--text-muted)]">→</span>}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-3">
                We verify the location, not just the repair — GPS + viewpoint + landmarks + road geometry + pothole region (score /100).
              </p>
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
                ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] text-white shadow-md'
                : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
            }`}
          >
            {tab === 'all' ? 'All' : getStatusLabel(tab)}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <Card className="border-[var(--border-subtle)]">
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
              ? 'You don&apos;t have any repair assignments at the moment.'
              : `You don&apos;t have any ${getStatusLabel(activeTab).toLowerCase()} assignments at the moment.`}
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {complaints.map((complaint) => (
              <Link key={complaint._id} to={`/contractor/complaint/${complaint._id}`} className="block transition-all duration-200 hover:translate-x-1">
                <div className="p-4 hover:border-[var(--border-default)] border border-transparent transition-all duration-200 rounded-lg">
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
                          <h3 className="font-semibold text-base lg:text-lg text-[var(--text-primary)]">{complaint.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-mono">{complaint.complaintId} • {formatRelativeTime(complaint.createdAt)}</p>
                        </div>
                        <Badge variant={getBadgeVariant(complaint.status)}>
                          {getStatusLabel(complaint.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
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
                        {complaint.citizenId && (
                          <span className="flex items-center gap-1">
                            <span>Reported by</span>
                            <span className="font-medium">{complaint.citizenId.name}</span>
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

                    <ChevronRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
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