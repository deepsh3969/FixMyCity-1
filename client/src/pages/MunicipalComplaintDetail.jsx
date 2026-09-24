import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { complaintAPI } from '../utils/api'
import { formatDate, formatRelativeTime, getSeverityColor, getStatusColor, getStatusLabel, getDecisionColor, getConfidenceColor, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK } from '../utils/helpers'
import { MapPin, Calendar, AlertTriangle, Camera, CheckCircle, Check, AlertCircle, XCircle, Loader2, Map, ChevronLeft, User, Hammer, Building2, Save, Edit, Trash2, Eye } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, Badge, ProgressBar, Alert, Spinner, EmptyState, Modal, Select, Input, CoordsBadge } from '../components/UI'
import LocationMap, { LocationSummary } from '../components/LocationMap'
import { describeLocation } from '../utils/geocode'
import { getStatusMarkerColor } from '../utils/map'
import VerificationPanel from '../components/VerificationPanel'
import AuditTimeline from '../components/AuditTimeline'

const statusTimeline = [
  { key: 'REPORTED', label: 'Reported', icon: AlertTriangle },
  { key: 'ASSIGNED', label: 'Assigned', icon: MapPin },
  { key: 'UNDER_REPAIR', label: 'Under Repair', icon: Hammer },
  { key: 'VERIFICATION', label: 'Verification', icon: CheckCircle },
  { key: 'VERIFIED', label: 'Verified', icon: CheckCircle },
  { key: 'MANUAL_REVIEW', label: 'Manual Review', icon: AlertCircle },
  { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle }
]

const statusOptions = [
  'REPORTED', 'ASSIGNED', 'UNDER_REPAIR', 'VERIFICATION', 
  'VERIFIED', 'MANUAL_REVIEW', 'REJECTED', 'RESOLVED'
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

export default function MunicipalComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState('')
  const [updating, setUpdating] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [contractors, setContractors] = useState([])
  const [selectedContractor, setSelectedContractor] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true)
      try {
        const [complaintRes, contractorsRes] = await Promise.all([
          complaintAPI.getById(id),
          complaintAPI.getContractors()
        ])
        setComplaint(complaintRes.data.complaint)
        setContractors(contractorsRes.data.contractors || [])
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

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    try {
      await complaintAPI.updateStatus(id, newStatus)
      setComplaint(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedContractor) return
    setAssignLoading(true)
    try {
      await complaintAPI.assignContractor(id, selectedContractor)
      setComplaint(prev => ({ 
        ...prev, 
        contractorId: contractors.find(c => c._id === selectedContractor)?._id || selectedContractor,
        status: 'ASSIGNED',
        assignedAt: new Date().toISOString()
      }))
      setShowAssignModal(false)
      setSelectedContractor('')
    } catch (err) {
      alert('Failed to assign contractor')
    } finally {
      setAssignLoading(false)
    }
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
        action={<Button onClick={() => navigate('/municipal/dashboard')}>Back to Dashboard</Button>}
      />
    )
  }

  const currentStatusIndex = getCurrentStatusIndex()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/municipal/dashboard')}>
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
        
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="text-sm capitalize">
            {complaint.severity}
          </Badge>
          {complaint.verificationResultId && (
            <span className={`pill ${decisionPill(complaint.verificationResultId.decision)}`}>
              {complaint.verificationResultId.decision} ({complaint.verificationResultId.totalScore})
            </span>
          )}
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
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
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
                Location Map
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
                secondary={complaint.repairSubmissionId ? {
                  latitude: complaint.repairSubmissionId.latitude,
                  longitude: complaint.repairSubmissionId.longitude,
                  color: '#06b6d4',
                  label: 'R',
                  popup: 'Repair location'
                } : null}
                height={256}
                zoom={16}
                showMyLocation={false}
              />
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: getStatusMarkerColor(complaint.status) }} />
                  Reported
                </span>
                {complaint.repairSubmissionId && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)]" />
                    Repair
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions & Details */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="panel-title text-[12px] text-[var(--text-primary)]">Quick Actions</h3>
                <span className="tech-label text-[var(--accent-cyan)]">Command</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={complaint.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={statusOptions.map(s => ({ value: s, label: getStatusLabel(s) }))}
                disabled={updating}
              />
              
              {!complaint.contractorId && complaint.status === 'REPORTED' && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowAssignModal(true)}
                  disabled={updating}
                >
                  <User className="w-4 h-4" />
                  Assign Contractor
                </Button>
              )}

              {complaint.contractorId && complaint.status === 'ASSIGNED' && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleStatusChange('UNDER_REPAIR')}
                  disabled={updating}
                >
                  <Hammer className="w-4 h-4" />
                  Mark Under Repair
                </Button>
              )}

              {complaint.status === 'VERIFICATION' && complaint.verificationResultId && (
                <>
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange('VERIFIED')}
                    disabled={updating}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve & Verify
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleStatusChange('MANUAL_REVIEW')}
                    disabled={updating}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Request Manual Review
                  </Button>
                  <Button 
                    variant="danger" 
                    className="w-full" 
                    onClick={() => handleStatusChange('REJECTED')}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Repair
                  </Button>
                </>
              )}

              {complaint.status === 'VERIFIED' && (
                <Button 
                  className="w-full" 
                  onClick={() => handleStatusChange('RESOLVED')}
                  disabled={updating}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Resolved
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Details Panel */}
          <Card className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
            <CardHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
              <h3 className="panel-title text-[12px] text-[var(--text-primary)]">Complaint Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <p className="font-medium mono-num text-[var(--text-primary)]">{formatRelativeTime(complaint.reportedAt)}</p>
                </div>
              </div>

              {complaint.assignedAt && (
                <div>
                  <p className="tech-label mb-1">Assigned</p>
                  <p className="font-medium mono-num text-[var(--text-primary)]">{formatRelativeTime(complaint.assignedAt)}</p>
                </div>
              )}

              {complaint.citizenId && (
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                  <p className="tech-label mb-1">Citizen</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{complaint.citizenId.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{complaint.citizenId.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {complaint.contractorId && (
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                  <p className="tech-label mb-1">Contractor</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-red)] flex items-center justify-center">
                      <Hammer className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--accent-cyan)]">{complaint.contractorId.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{complaint.contractorId.email}</p>
                    </div>
                  </div>
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

          {/* Verification Summary */}
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
                  <span className="tech-label">Total Score</span>
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
                <div className="flex items-center justify-between">
                  <span className="tech-label">Processing</span>
                  <span className="mono-num font-medium text-[var(--text-primary)]">{complaint.verificationResultId.processingTimeMs}ms</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Contractor Modal */}
      <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setSelectedContractor('') }} title="Assign Contractor" className="max-w-md">
        <div className="space-y-4">
          <p className="text-[var(--text-muted)]">Select a contractor to assign to this complaint:</p>
          
          <Select
            value={selectedContractor}
            onChange={(e) => setSelectedContractor(e.target.value)}
            options={contractors.map(c => ({ value: c._id, label: `${c.name} (${c.email})` }))}
            placeholder="Select contractor"
          />
          
          {contractors.length === 0 && (
            <Alert variant="warning">
              No contractors available. Contractors must register first.
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowAssignModal(false); setSelectedContractor('') }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleAssign} loading={assignLoading} className="flex-1">
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} title="" className="max-w-4xl">
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <img src={modalImage} alt="Enlarged view" className="w-full h-full object-contain" />
        </div>
      </Modal>
    </div>
  )
}