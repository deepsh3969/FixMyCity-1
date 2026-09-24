import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { complaintAPI } from '../utils/api'
import { formatDate, formatRelativeTime, getSeverityColor, getStatusColor, getStatusLabel, getDecisionColor, getConfidenceColor, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK } from '../utils/helpers'
import { MapPin, Calendar, AlertTriangle, Camera, CheckCircle, Check, AlertCircle, XCircle, Loader2, Map, ChevronLeft, Zap } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, Badge, ProgressBar, Alert, Spinner, EmptyState, Modal, CoordsBadge } from '../components/UI'
import LocationMap, { LocationSummary } from '../components/LocationMap'
import { describeLocation } from '../utils/geocode'
import { getStatusMarkerColor } from '../utils/map'
import VerificationPanel from '../components/VerificationPanel'
import AuditTimeline from '../components/AuditTimeline'

const statusTimeline = [
  { key: 'REPORTED', label: 'Reported', icon: AlertTriangle },
  { key: 'ASSIGNED', label: 'Assigned', icon: MapPin },
  { key: 'UNDER_REPAIR', label: 'Under Repair', icon: Camera },
  { key: 'VERIFICATION', label: 'Verification', icon: CheckCircle },
  { key: 'VERIFIED', label: 'Verified', icon: CheckCircle },
  { key: 'MANUAL_REVIEW', label: 'Manual Review', icon: AlertCircle },
  { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle }
]

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

const statusPill = (status) => STATUS_PILL[status] || 'pill-reported'

const decisionPill = (decision) =>
  decision === 'VERIFIED' ? 'pill-verified' : decision === 'MANUAL_REVIEW' ? 'pill-review' : 'pill-rejected'

export default function ComplaintDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState('')

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true)
      try {
        const response = await complaintAPI.getById(id)
        setComplaint(response.data.complaint)
      } catch (err) {
        setError('Failed to load complaint details')
      } finally {
        setLoading(false)
      }
    }
    fetchComplaint()
  }, [id])

  const getCurrentStatusIndex = () => {
    if (!complaint) return 0
    return statusTimeline.findIndex(s => s.key === complaint.status)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner size="lg" />
        <p className="mt-4 text-[var(--text-muted)]">Loading complaint...</p>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-8 h-8" />}
        title="Complaint Not Found"
            description={error || "The complaint you're looking for doesn't exist."}
        action={<Button onClick={() => navigate('/citizen/dashboard')}>Back to Dashboard</Button>}
      />
    )
  }

  const currentStatusIndex = getCurrentStatusIndex()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/citizen/dashboard')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{complaint.title}</h1>
              <span className={`pill ${statusPill(complaint.status)}`}>
                {getStatusLabel(complaint.status)}
              </span>
              <Badge variant="primary">{complaint.assignedAuthority || 'TMC'}</Badge>
            </div>
            <p className="text-[var(--text-muted)] font-mono text-sm">{complaint.complaintId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="text-sm capitalize">
            {complaint.severity}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <Card className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
        <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="panel-title text-[12px] text-[var(--text-primary)]">Evidence Audit Trail</h3>
            <span className="tech-label text-[var(--accent-cyan)]">Live Ledger</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Every action on this complaint, recorded with actor and timestamp</p>
        </CardHeader>
        <CardContent>
          <AuditTimeline
            timeline={complaint.timeline || []}
            emptyMessage="No audit events recorded yet. Events appear as the complaint progresses."
          />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Evidence */}
          <Card className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="panel-title text-[12px] text-[var(--text-primary)] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--accent-cyan)]" />
                  Original Citizen Evidence
                </h3>
                <span className="tech-label text-[12px] tracking-[0.3em] text-[var(--accent-cyan)]">BEFORE</span>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {complaint.imageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--border-subtle)] border-glow bg-[var(--bg-card-hover)] cursor-pointer" onClick={() => { setModalImage(complaint.imageUrl); setShowImageModal(true) }}>
                  <img
                    src={complaint.imageUrl}
                    alt="Original pothole photo"
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-[rgba(34,211,238,0.4)] tech-label text-[13px] tracking-[0.3em] text-[var(--accent-cyan)]">
                    BEFORE
                  </span>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white">
                    Click to enlarge
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="tech-label mb-1">Description</p>
                  <p className="font-medium text-[var(--text-primary)]">{complaint.description}</p>
                </div>
                <div>
                  <p className="tech-label mb-1">Reported</p>
                  <p className="font-medium mono-num text-[var(--text-primary)]">{formatDate(complaint.reportedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repair Evidence */}
          {complaint.repairSubmissionId && (
            <Card className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="panel-title text-[12px] text-[var(--text-primary)] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[var(--accent-amber)]" />
                    Contractor Repair Evidence
                  </h3>
                  <span className="tech-label text-[12px] tracking-[0.3em] text-[var(--accent-amber)]">AFTER</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {complaint.repairSubmissionId.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--border-subtle)] border-glow bg-[var(--bg-card-hover)] cursor-pointer" onClick={() => { setModalImage(complaint.repairSubmissionId.imageUrl); setShowImageModal(true) }}>
                    <img 
                      src={complaint.repairSubmissionId.imageUrl} 
                      alt="Repair photo"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-[rgba(245,158,11,0.45)] tech-label text-[13px] tracking-[0.3em] text-[var(--accent-amber)]">
                      AFTER
                    </span>
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white">
                      Click to enlarge
                    </div>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="tech-label mb-1">Submitted</p>
                    <p className="font-medium mono-num text-[var(--text-primary)]">{formatDate(complaint.repairSubmissionId.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="tech-label mb-1">Repair Location</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      📍 {describeLocation(complaint.repairSubmissionId.latitude, complaint.repairSubmissionId.longitude, complaint.address)}
                    </p>
                    <CoordsBadge latitude={complaint.repairSubmissionId.latitude} longitude={complaint.repairSubmissionId.longitude} showDetailsLabel className="mt-2" />
                  </div>
                  {complaint.repairSubmissionId.notes && (
                    <div className="col-span-2">
                      <p className="tech-label mb-1">Notes</p>
                      <p className="font-medium text-[var(--text-primary)]">{complaint.repairSubmissionId.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Verification Result — premium panel */}
          {complaint.verificationResultId && (
            <VerificationPanel result={complaint.verificationResultId} complaintId={complaint.complaintId} />
          )}

          {/* Location Map */}
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
              <h3 className="panel-title text-[12px] text-[var(--text-primary)] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--accent-cyan)]" />
                Location
              </h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <LocationSummary
                address={describeLocation(complaint.latitude, complaint.longitude, complaint.address)}
                latitude={complaint.latitude}
                longitude={complaint.longitude}
              />
              <LocationMap
                latitude={complaint.latitude}
                longitude={complaint.longitude}
                color={getStatusMarkerColor(complaint.status)}
                label={(complaint.severity || 'p').charAt(0).toUpperCase()}
                height={256}
                zoom={16}
                showMyLocation={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
              <h3 className="panel-title text-[12px] text-[var(--text-primary)]">Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="tech-label mb-1">Complaint ID</p>
                <p className="mono-num text-lg text-[var(--text-primary)]">{complaint.complaintId}</p>
              </div>
              <div>
                <p className="tech-label mb-1">Status</p>
                <span className={`pill ${statusPill(complaint.status)} w-full justify-center py-2`}>
                  {getStatusLabel(complaint.status)}
                </span>
              </div>
              <div>
                <p className="tech-label mb-1">Severity</p>
                <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="w-full justify-center py-2 capitalize">
                  {complaint.severity}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="tech-label mb-1">Assigned Authority</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{complaint.assignedAuthority || 'Thane Municipal Corporation (TMC)'}</p>
              </div>
              <div>
                <p className="tech-label mb-1">Reported</p>
                <p className="font-medium text-[var(--text-primary)]">{formatRelativeTime(complaint.reportedAt)}</p>
              </div>
              {complaint.assignedAt && (
                <div>
                  <p className="tech-label mb-1">Assigned</p>
                  <p className="font-medium text-[var(--text-primary)]">{formatRelativeTime(complaint.assignedAt)}</p>
                </div>
              )}
              {complaint.contractorId && (
                <div>
                  <p className="tech-label mb-1">Contractor</p>
                  <p className="font-medium text-[var(--accent-cyan)]">{complaint.contractorId.name}</p>
                </div>
              )}
              <div>
                <p className="tech-label mb-1">Location</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                    📍 {describeLocation(complaint.latitude, complaint.longitude, complaint.address)}
                  </p>
                  <CoordsBadge latitude={complaint.latitude} longitude={complaint.longitude} showDetailsLabel className="mt-2" />
              </div>
            </CardContent>
          </Card>

          {complaint.verificationResultId && (
            <Card className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
              <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="panel-title text-[12px] text-[var(--text-primary)]">Verification Summary</h3>
                  <span className="tech-label text-[var(--accent-cyan)]">AI</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="tech-label">Decision</span>
                  <span className={`pill ${decisionPill(complaint.verificationResultId.decision)}`}>
                    {complaint.verificationResultId.decision}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="tech-label">Score</span>
                  <span className="mono-num font-bold text-xl gradient-text">{complaint.verificationResultId.totalScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="tech-label">Confidence</span>
                  <Badge variant={complaint.verificationResultId.confidence === 'HIGH' ? 'success' : complaint.verificationResultId.confidence === 'MEDIUM' ? 'warning' : 'danger'}>
                    {complaint.verificationResultId.confidence}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="tech-label">GPS Distance</span>
                  <span className="mono-num font-medium text-[var(--text-primary)]">{complaint.verificationResultId.distanceMeters.toFixed(1)}m</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} title="" className="max-w-4xl">
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <img src={modalImage} alt="Enlarged view" className="w-full h-full object-contain" />
        </div>
      </Modal>
    </div>
  )
}