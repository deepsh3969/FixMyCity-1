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
import JudgeDemoPanel from '../components/JudgeDemoPanel'

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
        description={error || 'The complaint you&apos;re looking for doesn&apos;t exist.'}
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
              <Badge variant={getBadgeVariant(complaint.status)}>
                {getStatusLabel(complaint.status)}
              </Badge>
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

          {/* Judge Demo Panel */}
          <JudgeDemoPanel />

          {/* Location Map */}
          <Card className="border-[var(--border-subtle)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <MapPin className="w-5 h-5" />
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
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
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
              {complaint.assignedAt && (
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Assigned</p>
                  <p className="font-medium text-[var(--text-primary)]">{formatRelativeTime(complaint.assignedAt)}</p>
                </div>
              )}
              {complaint.contractorId && (
                <div>
                  <p className="text-[var(--text-muted)] text-sm">Contractor</p>
                  <p className="font-medium text-[var(--accent-cyan)]">{complaint.contractorId.name}</p>
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
                  <span className="text-[var(--text-muted)]">Score</span>
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