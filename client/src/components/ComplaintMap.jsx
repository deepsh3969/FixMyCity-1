import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleMaps, hasGoogleMapsKey } from '../utils/gmaps'
import { useAuth } from '../context/AuthContext'
import { getStatusMarkerColor, pinIconDataUri, youIconDataUri } from '../utils/map'
import { getStatusLabel } from '../utils/helpers'
import { Layers, Flame, MapPin } from 'lucide-react'

const HOTSPOTS = [
  { name: 'Majiwada', lat: 19.2400, lng: 72.9700, intensity: 0.95, color: '#ef4444', complaints: 18 },
  { name: 'Naupada', lat: 19.1930, lng: 72.9760, intensity: 0.7, color: '#f59e0b', complaints: 11 },
  { name: 'Pokhran', lat: 19.2100, lng: 72.9900, intensity: 0.85, color: '#f97316', complaints: 14 },
  { name: 'Kolshet', lat: 19.2450, lng: 72.9600, intensity: 0.75, color: '#f59e0b', complaints: 12 }
]

const LEGEND = [
  { label: 'YOU', color: '#22d3ee', you: true },
  { label: 'Reported', color: '#a855f7' },
  { label: 'Assigned', color: '#6366f1' },
  { label: 'Under Repair', color: '#3b82f6' },
  { label: 'Verification', color: '#14b8a6' },
  { label: 'Verified', color: '#10b981' },
  { label: 'Manual Review', color: '#f59e0b' },
  { label: 'Rejected', color: '#ef4444' },
  { label: 'Resolved', color: '#64748b' }
]

const THANE = { lat: 19.2183, lng: 72.9781 }

const isCoord = (c) => typeof c.latitude === 'number' && typeof c.longitude === 'number'

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

function MapMessage({ height, title, body, tone = 'muted' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center px-6 bg-[#07121F] border border-[rgba(34,211,238,0.14)] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      style={{ height }}
    >
      <MapPin className={`w-6 h-6 ${tone === 'error' ? 'text-[var(--accent-red)]' : 'text-[var(--accent-cyan)]'}`} />
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-xs text-[var(--text-muted)] max-w-sm">{body}</p>
    </div>
  )
}

export default function ComplaintMap({
  complaints = [],
  height = 480,
  onSelect,
  showFilters = false,
  heatmap = false,
  heatmapLabels = [],
  showHeading = false
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const circlesRef = useRef([])
  const youMarkerRef = useRef(null)
  const youPosRef = useRef(null)
  const infoRef = useRef(null)
  const observerRef = useRef(null)

  const navigate = useNavigate()
  const { user } = useAuth()
  const { maps, loading, error } = useGoogleMaps()

  const [gpsState, setGpsState] = useState('locating')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [showHeat, setShowHeat] = useState(heatmap)

  const role = user?.role || 'citizen'

  const fitAll = () => {
    const map = mapRef.current
    if (!map || !maps) return
    const pts = complaints.filter(isCoord).map((c) => ({ lat: c.latitude, lng: c.longitude }))
    if (youPosRef.current) pts.push(youPosRef.current)
    if (pts.length === 0) return
    const bounds = new maps.LatLngBounds()
    pts.forEach((p) => bounds.extend(p))
    map.fitBounds(bounds, { padding: 36 })
  }

  const placeYou = (pos) => {
    const map = mapRef.current
    if (!map || !maps) return
    youPosRef.current = pos
    if (youMarkerRef.current) {
      youMarkerRef.current.setPosition(pos)
    } else {
      youMarkerRef.current = new maps.Marker({
        position: pos,
        map,
        title: 'YOU',
        zIndex: 9999,
        icon: {
          url: youIconDataUri(),
          scaledSize: new maps.Size(72, 58),
          anchor: new maps.Point(36, 41)
        }
      })
    }
  }

  const onGpsSuccess = (position) => {
    const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
    setGpsState('ok')
    setGpsLoading(false)
    placeYou(pos)
    const map = mapRef.current
    if (map) {
      const hasPoints = complaints.some(isCoord)
      if (hasPoints) {
        fitAll()
      } else {
        map.setCenter(pos)
        map.setZoom(14)
      }
    }
  }

  const onGpsError = () => {
    setGpsState('unavailable')
    setGpsLoading(false)
  }

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGpsState('unavailable')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      timeout: 8000
    })
  }

  const openInfo = (complaint, marker) => {
    const info = infoRef.current
    if (!info) return
    const status = getStatusLabel(complaint.status || 'REPORTED')
    const severity = complaint.severity || 'MEDIUM'
    const ai = complaint.verificationResultId
      ? 'AI analysis on file'
      : complaint.aiVerified
        ? 'AI verified'
        : 'AI pending'
    const el = document.createElement('div')
    el.className = 'gm-iw'
    el.innerHTML = `
      <div class="gm-iw-head">
        <span class="gm-iw-id">${escapeHtml(complaint.complaintId || 'Complaint')}</span>
        <span class="gm-iw-status">${escapeHtml(status)}</span>
      </div>
      <div class="gm-iw-row"><b>Location:</b> ${Number(complaint.latitude).toFixed(5)}, ${Number(complaint.longitude).toFixed(5)}</div>
      <div class="gm-iw-row"><b>Severity:</b> ${escapeHtml(severity)}</div>
      <div class="gm-iw-row"><b>Status:</b> ${escapeHtml(status)}</div>
      <div class="gm-iw-row"><b>AI verification:</b> ${escapeHtml(ai)}</div>
      <button type="button" class="gm-iw-btn">View Details</button>
    `
    el.querySelector('button').addEventListener('click', () => {
      info.close()
      if (onSelect) onSelect(complaint)
      else if (complaint._id) navigate(`/${role}/complaint/${complaint._id}`)
    })
    info.setContent(el)
    info.open({ map: mapRef.current, anchor: marker })
  }

  // Initialize Google Map (default Google Maps styling — no dark theme)
  useEffect(() => {
    if (!maps || !containerRef.current || mapRef.current) return undefined

    const map = new maps.Map(containerRef.current, {
      center: THANE,
      zoom: 13,
      fullscreenControl: false
    })
    mapRef.current = map
    infoRef.current = new maps.InfoWindow()

    if (import.meta.env.DEV) {
      window.__fmcDebug = {
        map: () => mapRef.current,
        youPos: () => youPosRef.current,
        markerCount: () => markersRef.current.length,
        markers: () => markersRef.current
      }
    }

    observerRef.current = new ResizeObserver(() => {
      if (mapRef.current) maps.event.trigger(mapRef.current, 'resize')
    })
    observerRef.current.observe(containerRef.current)

    if (navigator.geolocation) {
      setGpsLoading(true)
      navigator.geolocation.getCurrentPosition(onGpsSuccess, onGpsError, {
        enableHighAccuracy: true,
        timeout: 8000
      })
    } else {
      setGpsState('unavailable')
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
      circlesRef.current.forEach((c) => c.setMap(null))
      circlesRef.current = []
      if (youMarkerRef.current) youMarkerRef.current.setMap(null)
      if (infoRef.current) infoRef.current.close()
      mapRef.current = null
      infoRef.current = null
      youMarkerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps])

  // Complaint markers on the real Google Map
  useEffect(() => {
    if (!maps || !mapRef.current) return
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    complaints.filter(isCoord).forEach((complaint) => {
      const color = getStatusMarkerColor(complaint.status)
      const letter = (complaint.severity || 'm').charAt(0).toUpperCase()
      const marker = new maps.Marker({
        position: { lat: complaint.latitude, lng: complaint.longitude },
        map: mapRef.current,
        title: `${complaint.complaintId || ''} ${complaint.title || ''}`.trim(),
        icon: {
          url: pinIconDataUri(color, letter),
          scaledSize: new maps.Size(32, 42),
          anchor: new maps.Point(16, 41)
        }
      })
      marker.addListener('click', () => openInfo(complaint, marker))
      markersRef.current.push(marker)
    })

    fitAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, maps])

  // Demo hotspot circles (clearly labeled as demo)
  useEffect(() => {
    if (!maps || !mapRef.current) return
    circlesRef.current.forEach((c) => c.setMap(null))
    circlesRef.current = []
    if (!showHeat) return
    HOTSPOTS.forEach((h) => {
      const radius = 400 + h.intensity * 1400
      const outer = new maps.Circle({
        map: mapRef.current,
        center: { lat: h.lat, lng: h.lng },
        radius,
        strokeColor: h.color,
        strokeWeight: 1.5,
        fillColor: h.color,
        fillOpacity: 0.35
      })
      const inner = new maps.Circle({
        map: mapRef.current,
        center: { lat: h.lat, lng: h.lng },
        radius: radius * 0.45,
        strokeWeight: 0,
        fillColor: h.color,
        fillOpacity: 0.5
      })
      circlesRef.current.push(outer, inner)
    })
  }, [showHeat, maps])

  if (!hasGoogleMapsKey || error === 'MISSING_KEY') {
    return (
      <MapMessage
        height={height}
        title="Google Maps is not configured"
        body="Set the VITE_GOOGLE_MAPS_API_KEY environment variable to enable the live city map."
      />
    )
  }

  if (error === 'AUTH_ERROR') {
    return (
      <MapMessage
        height={height}
        tone="error"
        title="Google Maps failed to load"
        body="The API key was rejected. Check key restrictions, the Maps JavaScript API, and billing in Google Cloud Console."
      />
    )
  }

  if (error) {
    return (
      <MapMessage
        height={height}
        tone="error"
        title="Google Maps failed to load"
        body="A network or configuration error occurred while loading Google Maps. Please try again."
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-[#07121F] border border-[rgba(34,211,238,0.14)] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.25)]" style={{ height }}>
        <p className="text-[var(--text-muted)]">Loading Google Maps...</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-[rgba(34,211,238,0.14)] bg-[#07121F] shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      {showHeading && (
        <div className="px-4 py-3 border-b border-[rgba(34,211,238,0.14)] bg-gradient-to-r from-[rgba(34,211,238,0.07)] to-transparent flex items-center justify-between gap-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            Live City Map
          </h3>
          <span className="tech-label text-[var(--accent-cyan)]">LIVE</span>
        </div>
      )}
      <div className="relative">
        <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Live city map" />
        {gpsState !== 'ok' && (
          <div className="absolute top-3 left-3 z-[1000] max-w-[min(300px,70%)] bg-[#06111F]/92 border border-cyan-400/30 text-xs text-slate-300 px-3 py-2 rounded-lg backdrop-blur-sm space-y-1.5">
            {gpsState === 'unavailable' ? (
              <>
                <p>Location access is required to show your position.</p>
                <button
                  type="button"
                  onClick={locateMe}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#031120] font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors"
                >
                  Enable Location
                </button>
              </>
            ) : (
              <p>Defaulting to local city center (Thane)</p>
            )}
          </div>
        )}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
          <button
            type="button"
            onClick={locateMe}
            className="flex items-center gap-2 bg-[#06111F]/90 border border-cyan-400/30 text-xs text-slate-300 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:border-cyan-400 hover:text-cyan-200 transition-colors"
            aria-label="My location"
          >
            <span className="relative flex h-2.5 w-2.5">
              {!gpsLoading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            {gpsLoading ? 'Locating...' : 'My Location'}
          </button>
          <button
            type="button"
            onClick={() => setShowHeat((v) => !v)}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm border transition-colors ${
              showHeat ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-[#06111F]/90 border-cyan-400/30 text-slate-300 hover:border-amber-400/60'
            }`}
            aria-pressed={showHeat}
            title="Toggle demo heatmap"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeat ? 'text-amber-400' : 'text-slate-400'}`} />
            {showHeat ? 'Heatmap on' : 'Heatmap'}
          </button>
          {showHeat && (
            <span className="bg-amber-400 text-[#031120] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
              Demo heatmap
            </span>
          )}
        </div>
        {showHeat && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-[#06111F]/92 border border-cyan-400/25 rounded-lg px-3 py-2 text-[11px] space-y-1 shadow-sm backdrop-blur-sm">
            <p className="font-semibold text-slate-200 flex items-center gap-1"><Layers className="w-3 h-3 text-[var(--accent-cyan)]" /> Hotspots (demo)</p>
            {HOTSPOTS.map((h) => (
              <div key={h.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: h.color }} />
                <span className="text-slate-400">{h.name}</span>
                <span className="text-slate-500">~{h.complaints}</span>
              </div>
            ))}
            {heatmapLabels.length > 0 && !heatmapLabels.every((label, i) => HOTSPOTS[i] && HOTSPOTS[i].name === label) && (
              <div className="pt-1 border-t border-white/10">
                <p className="font-semibold text-slate-200 flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400" /> DEMO Areas</p>
                {heatmapLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: HOTSPOTS[i]?.color || '#ef4444' }} />
                    <span className="text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {complaints.filter(isCoord).length === 0 && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <p className="text-slate-400 text-sm bg-[#06111F]/90 border border-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> No mappable complaints
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-t border-[rgba(34,211,238,0.14)] bg-[rgba(7,18,31,0.95)]">
        {LEGEND.map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${
              item.you ? 'font-bold text-[var(--accent-cyan)]' : 'font-medium text-[var(--text-muted)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
