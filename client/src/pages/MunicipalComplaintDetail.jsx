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
import JudgeDemoPanel from '../components/JudgeDemoPanel'

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
        description={error || 'The complaint you&apos;re looking for doesn&apos;t exist.'}
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
              <Badge variant={getBadgeVariant(complaint.status)}>
                {getStatusLabel(complaint.status)}
              </Badge>
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
            <Badge variant={complaint.verificationResultId.decision === 'VERIFIED' ? 'success' : complaint.verificationResultId.decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'} className="text-sm">
              {complaint.verificationResultId.decision} ({complaint.verificationResultId.totalScore})
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card className="border-[var(--border-subtle)]">
        <CardHeader className="border-b border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Progress Timeline</h3>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border-subtle)]" />
            <div className="space-y-6">
              {statusTimeline.map((step, index) => {
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const isRejected = complaint.status === 'REJECTED' && step.key === 'REJECTED'
                const isManualReview = complaint.status === 'MANUAL_REVIEW' && step.key === 'MANUAL_REVIEW'
                
                return (
                  <div key={step.key} className="relative flex gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? 'bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] border-white/20 shadow-md' : 'bg-[var(--bg-card-hover)] border-[var(--border-default)]'
                    } ${isCurrent && !isRejected && !isManualReview ? 'ring-4 ring-[var(--accent-cyan)]/30 animate-pulse' : ''}`}>
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" strokeWidth={3} />
                      ) : (
                        <step.icon className={`w-5 h-5 ${isCurrent ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-muted)]'}`} />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{step.label}</span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--accent-cyan-dim)] text-[var(--accent-cyan)] rounded-full">Current</span>
                        )}
                      </div>
                      {complaint[step.key.toLowerCase() === 'under_repair' ? 'assignedAt' : step.key.toLowerCase() + 'At'] && (
                        <p className="text-sm text-[var(--text-muted)]">
                          {formatDate(complaint[step.key.toLowerCase() === 'under_repair' ? 'assignedAt' : step.key.toLowerCase() + 'At'])}
                        </p>
                      )}
                      {step.key === 'VERIFIED' && complaint.verificationResultId && (
                        <p className="text-sm text-[var(--accent-green)] mt-1">Score: {complaint.verificationResultId.totalScore}/100</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Evidence */}
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Original Citizen Evidence
              </h3>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {complaint.imageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--bg-card-hover)] cursor-pointer" onClick={() => { setModalImage(complaint.imageUrl); setShowImageModal(true) }}>
                  <img
                    src={complaint.imageUrl}
                    alt="Original pothole photo"
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                  />
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white">
                    Click to enlarge
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-muted)]">Description</p>
                  <p className="font-medium text-[var(--text-primary)]">{complaint.description}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Reported</p>
                  <p className="font-medium text-[var(--text-primary)]">{formatDate(complaint.reportedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repair Evidence */}
          {complaint.repairSubmissionId && (
            <Card className="border-[var(--border-subtle)]">
              <CardHeader className="border-b border-[var(--border-subtle)]">
                <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Contractor Repair Evidence
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {complaint.repairSubmissionId.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--bg-card-hover)] cursor-pointer" onClick={() => { setModalImage(complaint.repairSubmissionId.imageUrl); setShowImageModal(true) }}>
                    <img
                      src={complaint.repairSubmissionId.imageUrl}
                      alt="Repair photo"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                    />
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white">
                      Click to enlarge
                    </div>
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-muted)]">Submitted</p>
                    <p className="font-medium text-[var(--text-primary)]">{formatDate(complaint.repairSubmissionId.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)]">Repair Location</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      📍 {describeLocation(complaint.repairSubmissionId.latitude, complaint.repairSubmissionId.longitude, complaint.address)}
                    </p>
                    <CoordsBadge latitude={complaint.repairSubmissionId.latitude} longitude={complaint.repairSubmissionId.longitude} showDetailsLabel className="mt-2" />
                  </div>
                  {complaint.repairSubmissionId.notes && (
                    <div className="col-span-2">
                      <p className="text-[var(--text-muted)]">Notes</p>
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

          {/* Judge Demo — centerpiece */}
          <JudgeDemoPanel />

          {/* Location Map */}
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <MapPin className="w-5 h-5" />
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
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Quick Actions</h3>
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
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Complaint Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Complaint ID</p>
                  <p className="font-mono text-lg text-[var(--text-primary)]">{complaint.complaintId}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Status</p>
                  <Badge variant={getBadgeVariant(complaint.status)} className="w-full justify-center py-2">
                    {getStatusLabel(complaint.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Severity</p>
                  <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="w-full justify-center py-2 capitalize">
                    {complaint.severity}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-[var(--text-muted)] text-sm">Assigned Authority</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{complaint.assignedAuthority || 'Thane Municipal Corporation (TMC)'}</p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Reported</p>
                  <p className="font-medium text-[var(--text-primary)]">{formatRelativeTime(complaint.reportedAt)}</p>
                </div>
              </div>

              {complaint.assignedAt && (
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Assigned</p>
                  <p className="font-medium text-[var(--text-primary)]">{formatRelativeTime(complaint.assignedAt)}</p>
                </div>
              )}

              {complaint.citizenId && (
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                  <p className="text-[var(--text-muted)] text-sm">Citizen</p>
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
                  <p className="text-[var(--text-muted)] text-sm">Contractor</p>
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
                <p className="text-[var(--text-muted)] text-sm">Location</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                    📍 {describeLocation(complaint.latitude, complaint.longitude, complaint.address)}
                  </p>
                  <CoordsBadge latitude={complaint.latitude} longitude={complaint.longitude} showDetailsLabel className="mt-2" />
              </div>
            </CardContent>
          </Card>

          {/* Verification Summary */}
          {complaint.verificationResultId && (
            <Card className="border-[var(--border-subtle)]">
              <CardHeader className="border-b border-[var(--border-subtle)]">
                <h3 className="font-semibold text-[var(--text-primary)]">Verification Summary</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Decision</span>
                  <Badge variant={complaint.verificationResultId.decision === 'VERIFIED' ? 'success' : complaint.verificationResultId.decision === 'MANUAL_REVIEW' ? 'warning' : 'danger'}>
                    {complaint.verificationResultId.decision}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Total Score</span>
                  <span className="font-bold text-[var(--accent-cyan)]">{complaint.verificationResultId.totalScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Confidence</span>
                  <Badge variant={complaint.verificationResultId.confidence === 'HIGH' ? 'success' : complaint.verificationResultId.confidence === 'MEDIUM' ? 'warning' : 'danger'}>
                    {complaint.verificationResultId.confidence}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">GPS Distance</span>
                  <span className="font-medium text-[var(--text-primary)]">{complaint.verificationResultId.distanceMeters.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Processing</span>
                  <span className="font-medium text-[var(--text-primary)]">{complaint.verificationResultId.processingTimeMs}ms</span>
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