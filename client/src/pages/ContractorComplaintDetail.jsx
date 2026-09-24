import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contractorAPI } from '../utils/api'
import { formatDate, formatRelativeTime, getSeverityColor, getStatusColor, getStatusLabel, getDecisionColor, getConfidenceColor, validateImageFile, createObjectURL, revokeObjectURL, getSeverityBadgeVariant, getBadgeVariant, IMAGE_FALLBACK } from '../utils/helpers'
import { compressImage } from '../utils/image'
import { MapPin, Calendar, AlertTriangle, Camera, CheckCircle, AlertCircle, XCircle, Loader2, Map, ChevronLeft, Play, Upload, Image, X, Check, Zap, Activity } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, Badge, ProgressBar, Alert, Spinner, EmptyState, Modal, Input, CoordsBadge } from '../components/UI'
import LocationMap, { LocationSummary } from '../components/LocationMap'
import { describeLocation, reverseGeocode } from '../utils/geocode'
import { getStatusMarkerColor } from '../utils/map'
import VerificationPanel from '../components/VerificationPanel'
import AuditTimeline from '../components/AuditTimeline'

const statusTimeline = [
  { key: 'ASSIGNED', label: 'Assigned', icon: AlertTriangle },
  { key: 'UNDER_REPAIR', label: 'Under Repair', icon: Play },
  { key: 'VERIFICATION', label: 'Verification', icon: CheckCircle },
  { key: 'VERIFIED', label: 'Verified', icon: CheckCircle },
  { key: 'MANUAL_REVIEW', label: 'Manual Review', icon: AlertCircle },
  { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  { key: 'RESOLVED', label: 'Resolved', icon: CheckCircle }
]

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

const decisionPillClass = {
  VERIFIED: 'pill-verified',
  MANUAL_REVIEW: 'pill-review',
  REJECTED: 'pill-rejected'
}

export default function ContractorComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  // Repair submission form
  const [repairImage, setRepairImage] = useState(null)
  const [repairPreview, setRepairPreview] = useState(null)
  const [repairImageError, setRepairImageError] = useState('')
  const [repairLatitude, setRepairLatitude] = useState('')
  const [repairLongitude, setRepairLongitude] = useState('')
  const [repairAddress, setRepairAddress] = useState('')
  const [repairNotes, setRepairNotes] = useState('')
  const geocodeTimerRef = useRef(null)

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true)
      try {
        const response = await contractorAPI.getAssignmentById(id)
        setComplaint(response.data.complaint)
        // Initialize repair GPS with original location
        if (response.data.complaint.latitude && response.data.complaint.longitude) {
          setRepairLatitude(response.data.complaint.latitude.toString())
          setRepairLongitude(response.data.complaint.longitude.toString())
        }
        setRepairAddress(response.data.complaint.address || '')
      } catch (err) {
        setError('Failed to load assignment details')
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

  const handleRepairImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const error = validateImageFile(file)
    if (error) {
      setRepairImageError(error)
      setRepairImage(null)
      setRepairPreview(null)
      return
    }
    
    const compressed = await compressImage(file)
    setRepairImageError('')
    setRepairImage(compressed)
    setRepairPreview(createObjectURL(compressed))
  }

  const removeRepairImage = () => {
    if (repairPreview) revokeObjectURL(repairPreview)
    setRepairImage(null)
    setRepairPreview(null)
    setRepairImageError('')
  }

  const handleSubmitRepair = async (e) => {
    e.preventDefault()
    setSubmitError('')
    
    if (!repairImage) {
      setSubmitError('After-repair photo is required')
      return
    }
    if (!repairLatitude || !repairLongitude) {
      setSubmitError('GPS location is required')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('image', repairImage)
      formData.append('latitude', repairLatitude)
      formData.append('longitude', repairLongitude)
      if (repairNotes) formData.append('notes', repairNotes)
      
      await contractorAPI.submitRepair(id, formData)
      navigate(`/contractor/complaint/${id}`, { replace: true })
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit repair evidence')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartRepair = async () => {
    try {
      await contractorAPI.startRepair(id)
      setComplaint(prev => ({ ...prev, status: 'UNDER_REPAIR' }))
    } catch (err) {
      alert('Failed to start repair')
    }
  }

  const handleMapClick = (lat, lng) => {
    setRepairLatitude(lat.toString())
    setRepairLongitude(lng.toString())
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng)
      setRepairAddress(addr)
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner size="lg" />
        <p className="mt-4 text-[var(--text-muted)]">Loading assignment...</p>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-8 h-8" />}
        title="Assignment Not Found"
            description={error || "The assignment you're looking for doesn't exist."}
        action={<Button onClick={() => navigate('/contractor/dashboard')}>Back to Dashboard</Button>}
      />
    )
  }

  const currentStatusIndex = getCurrentStatusIndex()
  const canSubmitRepair = ['ASSIGNED', 'UNDER_REPAIR', 'REJECTED'].includes(complaint.status)
  const showRepairForm = canSubmitRepair && !complaint.repairSubmissionId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractor/dashboard')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="w-1 h-12 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_14px_rgba(34,211,238,0.65)] flex-shrink-0" />
          <div>
            <p className="tech-label mb-1">Assignment Brief</p>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] text-glow-cyan">{complaint.title}</h1>
              <span className={`pill ${statusPillClass[complaint.status] || 'pill-reported'}`}>
                {getStatusLabel(complaint.status)}
              </span>
              <Badge variant="primary">{complaint.assignedAuthority || 'TMC'}</Badge>
            </div>
            <p className="text-[var(--text-muted)] font-mono mono-num text-sm">{complaint.complaintId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="text-sm capitalize">
            {complaint.severity}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <Card className="border-[var(--border-subtle)] overflow-hidden">
        <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent">
          <h3 className="panel-title text-[var(--accent-cyan)] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Evidence Audit Trail
          </h3>
          <p className="tech-label mt-1.5">Every action on this complaint, recorded with actor and timestamp</p>
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
          <Card className="border-[var(--border-subtle)] overflow-hidden">
            <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent">
              <h3 className="panel-title text-[var(--accent-cyan)] flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Original Citizen Report
              </h3>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {complaint.imageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] cursor-pointer" onClick={() => { setModalImage(complaint.imageUrl); setShowImageModal(true) }}>
                  <img
                    src={complaint.imageUrl}
                    alt="Original pothole photo"
                    className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                  />
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white border border-[var(--border-subtle)]">
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
                <div>
                  <p className="tech-label mb-1">Location</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    📍 {describeLocation(complaint.latitude, complaint.longitude, complaint.address)}
                  </p>
                  <CoordsBadge latitude={complaint.latitude} longitude={complaint.longitude} showDetailsLabel className="mt-2" />
                </div>
                {complaint.citizenId && (
                  <div>
                    <p className="tech-label mb-1">Reported by</p>
                    <p className="font-medium text-[var(--text-primary)]">{complaint.citizenId.name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Repair Evidence / Submission Form */}
          {showRepairForm ? (
            <Card className="border-[rgba(34,211,238,0.35)] bg-gradient-to-br from-[var(--accent-cyan-dim)] via-transparent to-[var(--accent-purple-dim)] overflow-hidden glow-cyan">
              <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent">
                <h3 className="panel-title text-[var(--accent-cyan)] flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Submit Repair Evidence
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <form onSubmit={handleSubmitRepair} className="space-y-6">
                  {submitError && (
                    <Alert variant="error">
                      {submitError}
                    </Alert>
                  )}

                  {/* After Photo */}
                  <div>
                    <label className="tech-label block mb-2">After-Repair Photo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleRepairImageChange}
                        className="hidden"
                        id="repair-image-upload"
                        disabled={submitting}
                      />
                      <label 
                        htmlFor="repair-image-upload"
                        className={`cursor-pointer block p-6 border-2 border-dashed rounded-xl transition-all ${
                          repairPreview ? 'border-[rgba(34,211,238,0.6)] bg-[var(--accent-cyan-dim)]' : 'border-[var(--border-subtle)] bg-[var(--bg-card-solid)] hover:border-[rgba(34,211,238,0.5)] hover:bg-[var(--bg-card-hover)]'
                        }`}
                      >
                        {repairPreview ? (
                          <div className="relative">
                            <img src={repairPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg border border-[var(--border-subtle)]" />
                            <button
                              type="button"
                              onClick={removeRepairImage}
                              className="absolute top-2 right-2 p-1.5 bg-[rgba(239,68,68,0.85)] text-white rounded-full hover:bg-[var(--accent-red)] transition-colors border border-[rgba(239,68,68,0.5)]"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-center">
                            <Image className="w-10 h-10 text-[var(--accent-cyan)]" />
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">Click or drag to upload after-repair photo</p>
                              <p className="tech-label mt-1">JPEG, PNG, WebP up to 10MB</p>
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                    {repairImageError && <p className="mt-2 text-sm text-[var(--accent-red)]">{repairImageError}</p>}
                  </div>

                  {/* GPS Location */}
                  <div>
                    <label className="tech-label block mb-2">Repair GPS Location</label>
                    <div className="mb-3">
                      <LocationMap
                        latitude={repairLatitude || complaint.latitude}
                        longitude={repairLongitude || complaint.longitude}
                        height={220}
                        zoom={16}
                        color="#06b6d4"
                        label="R"
                        draggable
                        onChange={handleMapClick}
                        showMyLocation={false}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <LocationSummary
                        address={repairAddress || describeLocation(complaint.latitude, complaint.longitude, complaint.address)}
                        latitude={repairLatitude}
                        longitude={repairLongitude}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setRepairLatitude(complaint.latitude.toString())
                          setRepairLongitude(complaint.longitude.toString())
                          setRepairAddress(complaint.address || '')
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                        Use Original GPS
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (!navigator.geolocation) return
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const { latitude, longitude } = position.coords
                              handleMapClick(latitude, longitude)
                            },
                            () => setSubmitError('Unable to get your location')
                          )
                        }}
                      >
                        <Map className="w-4 h-4" />
                        My Location
                      </Button>
                    </div>
                  </div>

                  {/* Notes */}
                  <Input
                    label="Notes (Optional)"
                    value={repairNotes}
                    onChange={(e) => setRepairNotes(e.target.value)}
                    placeholder="Any additional notes about the repair..."
                  />

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-[var(--border-subtle)] flex gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/contractor/dashboard')} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" loading={submitting} className="flex-1" size="lg">
                      <Upload className="w-5 h-5" />
                      Submit Repair Evidence
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : complaint.repairSubmissionId ? (
            <Card className="border-[var(--border-subtle)] overflow-hidden">
              <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-blue-dim)] via-transparent to-transparent">
                <h3 className="panel-title text-[var(--accent-blue)] flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Your Repair Submission
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {complaint.repairSubmissionId.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card-hover)] cursor-pointer" onClick={() => { setModalImage(complaint.repairSubmissionId.imageUrl); setShowImageModal(true) }}>
                    <img
                      src={complaint.repairSubmissionId.imageUrl}
                      alt="Repair photo"
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = IMAGE_FALLBACK }}
                    />
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-sm text-white border border-[var(--border-subtle)]">
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
                  <p className="tech-label mb-1">Status</p>
                  <Badge variant={getBadgeVariant(complaint.repairSubmissionId.status)}>
                    {getStatusLabel(complaint.repairSubmissionId.status)}
                  </Badge>
                </div>
                  <div>
                    <p className="tech-label mb-1">Repair Location</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      📍 {describeLocation(complaint.repairSubmissionId.latitude, complaint.repairSubmissionId.longitude, complaint.address)}
                    </p>
                    <CoordsBadge latitude={complaint.repairSubmissionId.latitude} longitude={complaint.repairSubmissionId.longitude} showDetailsLabel className="mt-2" />
                  </div>
                  <div>
                    <p className="tech-label mb-1">Distance from Original</p>
                    {complaint.verificationResultId && (
                      <p className="mono-num font-semibold text-[var(--accent-cyan)] text-xs">{complaint.verificationResultId.distanceMeters.toFixed(1)}m</p>
                    )}
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
          ) : complaint.status === 'ASSIGNED' ? (
            <Card className="border-[rgba(16,185,129,0.35)] overflow-hidden">
              <CardHeader className="border-b border-[rgba(16,185,129,0.2)] bg-gradient-to-r from-[var(--accent-green-dim)] via-transparent to-transparent">
                <h3 className="panel-title text-[var(--accent-green)] flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Repair
                </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 text-center py-8">
                <p className="text-sm text-[var(--text-secondary)] mb-6">You've been assigned to this repair. When you begin work, mark it as started.</p>
                <Button onClick={handleStartRepair} size="lg" className="w-full sm:w-auto btn-glow">
                  <Play className="w-5 h-5" />
                  Start Repair
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* AI Verification Result — premium panel */}
          {complaint.verificationResultId && (
            <VerificationPanel result={complaint.verificationResultId} complaintId={complaint.complaintId} />
          )}

          {/* Location Map */}
          <Card className="border-[var(--border-subtle)] overflow-hidden">
            <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent">
              <h3 className="panel-title text-[var(--accent-cyan)] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
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
                  <span className="w-2.5 h-2.5 rounded-full marker-pulse" style={{ background: getStatusMarkerColor(complaint.status) }} />
                  <span className="tech-label">Reported</span>
                </span>
                {complaint.repairSubmissionId && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-cyan)]" />
                    <span className="tech-label">Repair</span>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-[var(--border-subtle)] overflow-hidden">
            <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent">
              <h3 className="panel-title text-[var(--accent-cyan)]">Assignment Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="tech-label mb-1">Complaint ID</p>
                <p className="font-mono mono-num text-lg text-[var(--text-primary)]">{complaint.complaintId}</p>
              </div>
              <div>
                <p className="tech-label mb-1">Status</p>
                <span className={`pill ${statusPillClass[complaint.status] || 'pill-reported'}`}>
                  {getStatusLabel(complaint.status)}
                </span>
              </div>
              <div>
                <p className="tech-label mb-1">Severity</p>
                <Badge variant={getSeverityBadgeVariant(complaint.severity)} className="capitalize">
                  {complaint.severity}
                </Badge>
              </div>
              <div>
                <p className="tech-label mb-1">Assigned</p>
                <p className="font-medium mono-num text-[var(--text-primary)]">{formatRelativeTime(complaint.assignedAt || complaint.createdAt)}</p>
              </div>
              <div>
                <p className="tech-label mb-1">Location</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  📍 {describeLocation(complaint.latitude, complaint.longitude, complaint.address)}
                </p>
                <CoordsBadge latitude={complaint.latitude} longitude={complaint.longitude} showDetailsLabel className="mt-2" />
              </div>
              <div>
                <p className="tech-label mb-1">Authority</p>
                <p className="text-sm font-medium text-[var(--text-primary)]">{complaint.assignedAuthority || 'Thane Municipal Corporation (TMC)'}</p>
              </div>
              {complaint.citizenId && (
                <div className="p-3 rounded-lg bg-[var(--accent-cyan-dim)] border border-[var(--border-subtle)]">
                  <p className="tech-label mb-1">Reported by</p>
                  <p className="font-medium text-[var(--text-primary)]">{complaint.citizenId.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {complaint.verificationResultId && (
            <Card className="border-[rgba(34,211,238,0.3)] overflow-hidden">
              <CardHeader className="border-b border-[rgba(34,211,238,0.2)] bg-gradient-to-r from-[var(--accent-cyan-dim)] via-transparent to-transparent">
                <h3 className="panel-title text-[var(--accent-cyan)]">Verification Summary</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="tech-label">Decision</span>
                  <span className={`pill ${decisionPillClass[complaint.verificationResultId.decision] || 'pill-verification'}`}>
                    {complaint.verificationResultId.decision}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="tech-label">Score</span>
                  <span className="text-xl font-bold mono-num text-[var(--accent-cyan)] text-glow-cyan">{complaint.verificationResultId.totalScore}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="tech-label">Confidence</span>
                  <Badge variant={complaint.verificationResultId.confidence === 'HIGH' ? 'success' : complaint.verificationResultId.confidence === 'MEDIUM' ? 'warning' : 'danger'}>
                    {complaint.verificationResultId.confidence}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="tech-label">GPS Distance</span>
                  <span className="font-medium mono-num text-[var(--text-primary)]">{complaint.verificationResultId.distanceMeters.toFixed(1)}m</span>
                </div>
              </CardContent>
            </Card>
          )}

          {complaint.repairSubmissionId && complaint.repairSubmissionId.status === 'REJECTED' && (
            <Alert variant="warning">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-medium">Repair Rejected</p>
                <p className="text-sm mt-1">Your repair submission was rejected. Please review the verification details and submit new evidence.</p>
              </div>
            </Alert>
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