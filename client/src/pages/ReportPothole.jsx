import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { complaintAPI } from '../utils/api'
import { validateImageFile, createObjectURL, revokeObjectURL } from '../utils/helpers'
import { compressImage } from '../utils/image'
import { MapPin, Camera, AlertTriangle, Loader2, Check, X, Map } from 'lucide-react'
import { Button, Input, Textarea, Select, Card, CardContent, Badge, Alert, ProgressBar, Spinner, CoordsBadge } from '../components/UI'
import AIImageAnalysis from '../components/AIImageAnalysis'
import LocationMap from '../components/LocationMap'
import { describeLocation, reverseGeocode } from '../utils/geocode'

const severityOptions = [
  { value: 'low', label: 'Low - Minor surface issue' },
  { value: 'medium', label: 'Medium - Noticeable damage' },
  { value: 'high', label: 'High - Significant hazard' },
  { value: 'critical', label: 'Critical - Immediate danger' }
]

export default function ReportPothole() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [complaintId, setComplaintId] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    latitude: '19.2183',
    longitude: '72.9781',
    address: 'Thane, Maharashtra'
  })
  
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageError, setImageError] = useState('')
  const [geolocating, setGeolocating] = useState(false)
  const [analysisState, setAnalysisState] = useState('idle')
  const [analysis, setAnalysis] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)

  const geocodeTimerRef = useRef(null)

  const scheduleAddressUpdate = (lat, lng) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    geocodeTimerRef.current = setTimeout(async () => {
      const addr = await reverseGeocode(lat, lng)
      setFormData(prev => ({ ...prev, address: addr }))
    }, 500)
  }

  // Try to get user's location on mount; default to Thane center
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      latitude: prev.latitude || '19.2183',
      longitude: prev.longitude || '72.9781',
      address: prev.address || 'Thane, Maharashtra'
    }))
    if (navigator.geolocation) {
      setGeolocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }))
          scheduleAddressUpdate(latitude, longitude)
          setGeolocating(false)
        },
        () => {
          setGeolocating(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateImageWithAI = async (file) => {
    if (!file) return
    setAnalysisState('analyzing')
    setAnalysis(null)
    setAnalysisError(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/ai/validate-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setAnalysis(res.data)
      setAnalysisState('done')
    } catch (err) {
      const data = err.response?.data
      if (data?.errorCode || data?.message) {
        setAnalysisError({ code: data.errorCode || 'UNKNOWN', message: data.message })
      } else {
        setAnalysisError({ code: 'NETWORK', message: 'AI analysis is temporarily unavailable. Please try again.' })
      }
      setAnalysisState('error')
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const error = validateImageFile(file)
    if (error) {
      setImageError(error)
      setImageFile(null)
      setImagePreview(null)
      setAnalysisState('idle')
      setAnalysis(null)
      setAnalysisError(null)
      return
    }

    const compressed = await compressImage(file)
    setImageError('')
    setImageFile(compressed)
    setImagePreview(createObjectURL(compressed))
    validateImageWithAI(compressed)
  }

  const removeImage = () => {
    if (imagePreview) revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    setImageError('')
    setAnalysisState('idle')
    setAnalysis(null)
    setAnalysisError(null)
  }

  const handlePinChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
    scheduleAddressUpdate(lat, lng)
  }

  const validateStep = () => {
    const newErrors = {}
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required'
      if (!formData.description.trim()) newErrors.description = 'Description is required'
      if (!imageFile) newErrors.image = 'Photo is required'
      else if (analysisState === 'error') newErrors.image = 'AI analysis failed. Retry the analysis before continuing.'
      else if (analysisState === 'analyzing') newErrors.image = 'AI analysis is still running. Please wait.'
      else if (analysis && analysis.valid === false) newErrors.image = 'AI rejected this image as INVALID EVIDENCE. Upload a genuine pothole photo.'
    } else if (step === 2) {
      if (!formData.latitude || !formData.longitude || !formData.address.trim()) newErrors.location = 'Location is required'
    }
    setError(newErrors.location || newErrors.title || newErrors.description || newErrors.image || '')
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep()) return
    
    setLoading(true)
    setError('')
    
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('severity', formData.severity)
      formDataToSend.append('latitude', formData.latitude)
      formDataToSend.append('longitude', formData.longitude)
      if (formData.address) formDataToSend.append('address', formData.address)
      formDataToSend.append('image', imageFile)
      
      const response = await complaintAPI.create(formDataToSend)
      setComplaintId(response.data.complaint.complaintId)
      setSubmitResult(response.data.complaint)
      setSuccess(true)
      setStep(4)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canAdvanceFromStep1 = Boolean(
    formData.title.trim() &&
    formData.description.trim() &&
    imageFile &&
    analysisState === 'done' &&
    analysis?.valid === true
  )

  const handleNext = () => {
    if (step === 1 && !canAdvanceFromStep1) {
      if (analysisState === 'error') setError('AI analysis failed. Click Retry Analysis to continue.')
      else if (analysis?.valid === false) setError('This image was rejected as INVALID EVIDENCE. Please upload a genuine pothole photo.')
      else if (analysisState === 'analyzing') setError('AI analysis is still running. Please wait.')
      else setError('Upload a valid pothole photo and fill required fields to continue.')
      return
    }
    if (validateStep()) {
      setStep(prev => prev + 1)
      setError('')
    }
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
    setError('')
  }

  if (success && submitResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-green-dim)] flex items-center justify-center mx-auto mb-6 animate-pulse-ring">
            <Check className="w-10 h-10 text-[var(--accent-green)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Report Submitted!</h1>
          <p className="text-[var(--text-muted)] mb-8">Your pothole report has been successfully submitted.</p>

          <Card className="border-[var(--border-subtle)]">
            <CardContent className="p-4 text-left space-y-4">
              <div className="text-center">
                <p className="text-[var(--text-muted)] mb-2">Your Complaint ID</p>
                <p className="text-3xl font-bold font-mono text-[var(--accent-cyan)] tracking-wider">{submitResult.complaintId}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Assigned Authority</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{submitResult.assignedAuthority || 'Thane Municipal Corporation (TMC)'}</p>
                </div>
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Severity</p>
                  <p className="text-sm font-medium capitalize">{submitResult.severity}</p>
                </div>
                <div className="p-3 bg-[var(--bg-card-hover)] rounded-lg sm:col-span-2">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Location</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    📍 {describeLocation(submitResult.latitude, submitResult.longitude, submitResult.address)}
                  </p>
                  <CoordsBadge latitude={submitResult.latitude} longitude={submitResult.longitude} showDetailsLabel className="mt-2" />
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] text-center">Save this ID to track your complaint status</p>
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/citizen/history')}>
              Track Complaint in History
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/citizen/report')}>
              Report Another Pothole
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <Alert variant="error" className="mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Report intake panel */}
      <div className="glass p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-6 pb-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_12px_2px_rgba(34,211,238,0.75)] animate-pulse" />
            <p className="panel-title">REPORT POTHOLE</p>
          </div>
          <span className="tech-label">SMART CITY INTAKE</span>
        </div>

        {/* Section 1: Upload */}
        <section className="pb-6">
          <p className="panel-title mb-3">UPLOAD ROAD IMAGE</p>
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
              disabled={loading}
            />
            <label 
              htmlFor="image-upload"
              className={`cursor-pointer block p-6 border-2 border-dashed rounded-xl transition-all ${
                imagePreview ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan-dim)]' : 'border-[var(--border-default)] hover:border-[var(--accent-cyan)] hover:bg-[var(--accent-cyan-weak)]'
              }`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-[var(--accent-red)] text-white rounded-full hover:brightness-125 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <Camera className="w-10 h-10 text-[var(--text-muted)]" />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Click or drag to upload photo</p>
                    <p className="text-sm text-[var(--text-muted)]">JPEG, PNG, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </label>
          </div>
          {imageError && <p className="mt-2 text-sm text-[var(--accent-red)]">{imageError}</p>}
          {error === 'Photo is required' && <p className="mt-2 text-sm text-[var(--accent-red)]">{error}</p>}
        </section>

        {/* Section 2: AI analysis */}
        <section className="py-6 border-t border-[var(--border-subtle)]">
          <p className="panel-title mb-3">AI ANALYSIS</p>
          {analysisState === 'idle' ? (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card-hover)]">
              <Camera className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <p className="text-sm text-[var(--text-muted)]">Upload a road image to start AI validation.</p>
            </div>
          ) : (
            <AIImageAnalysis
              state={analysisState}
              result={analysis}
              error={analysisError}
              previewUrl={imagePreview}
              onRetry={() => imageFile && validateImageWithAI(imageFile)}
            />
          )}
        </section>

        {/* Section 3: Location */}
        <section className="py-6 border-t border-[var(--border-subtle)]">
          <p className="panel-title mb-3">LOCATION</p>
          <div className="space-y-4">
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g., Ghodbunder Road, Near Majiwada Junction, Thane"
              autoComplete="street-address"
            />

            <LocationMap
              latitude={formData.latitude}
              longitude={formData.longitude}
              height={320}
              zoom={16}
              label="P"
              draggable
              onChange={handlePinChange}
              showMyLocation={false}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded-lg">
              <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[var(--accent-cyan)] flex-shrink-0" />
                Tap the map or drag the pin to set the exact location
              </p>
              <CoordsBadge latitude={formData.latitude} longitude={formData.longitude} />
            </div>

            <Button variant="outline" className="w-full" disabled={geolocating} onClick={() => {
              if (navigator.geolocation) {
                setGeolocating(true)
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords
                    setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }))
                    scheduleAddressUpdate(latitude, longitude)
                    setGeolocating(false)
                  },
                  () => {
                    setGeolocating(false)
                    setError('Unable to get your location')
                  }
                )
              }
            }}>
              {geolocating ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Map className="w-4 h-4" />
              )}
              {geolocating ? 'Getting your location...' : 'Use My Current Location'}
            </Button>

            {error === 'Location is required' && <p className="text-sm text-[var(--accent-red)]">{error}</p>}
          </div>
        </section>

        {/* Section 4: Description */}
        <section className="py-6 border-t border-[var(--border-subtle)]">
          <p className="panel-title mb-3">DESCRIPTION</p>
          <div className="space-y-4">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Large pothole on Eastern Express Highway"
              error={error === 'Title is required' ? error : undefined}
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Deep pothole near Majiwada Junction, Ghodbunder Road. Getting worse after rain."
              rows={4}
              error={error === 'Description is required' ? error : undefined}
            />
          </div>
        </section>

        {/* Section 5: Severity */}
        <section className="py-6 border-t border-[var(--border-subtle)]">
          <p className="panel-title mb-3">SEVERITY</p>
          <Select
            label="Severity"
            value={formData.severity}
            onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
            options={severityOptions}
          />
        </section>

        {/* Section 6: Submit */}
        <section className="pt-6 border-t border-[var(--border-subtle)]">
          <p className="panel-title mb-3">SUBMIT REPORT</p>
          <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full btn-glow">
            SUBMIT REPORT
          </Button>
        </section>
      </div>
    </div>
  )
}
