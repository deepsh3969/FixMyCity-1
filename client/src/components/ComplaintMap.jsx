import { useEffect, useRef, useState } from 'react'
import { useMap, createCustomIcon, getStatusMarkerColor } from '../utils/map'
import { getStatusLabel } from '../utils/helpers'
import { Layers, Flame, MapPin } from 'lucide-react'

const HOTSPOTS = [
  { name: 'Majiwada', lat: 19.2400, lng: 72.9700, intensity: 0.95, color: '#ef4444', complaints: 18 },
  { name: 'Naupada', lat: 19.1930, lng: 72.9760, intensity: 0.7, color: '#f59e0b', complaints: 11 },
  { name: 'Pokhran', lat: 19.2100, lng: 72.9900, intensity: 0.85, color: '#f97316', complaints: 14 },
  { name: 'Kolshet', lat: 19.2450, lng: 72.9600, intensity: 0.75, color: '#f59e0b', complaints: 12 }
]

export default function ComplaintMap({ complaints = [], height = 480, onSelect, showFilters = false, heatmap = false, heatmapLabels = [] }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)
  const heatRef = useRef(null)
  const { mapLib, loading, error } = useMap()
  const [gpsLoading, setGpsLoading] = useState(false)
  const [usingDefaultCenter, setUsingDefaultCenter] = useState(true)
  const [showHeat, setShowHeat] = useState(heatmap)

  useEffect(() => {
    if (!mapLib || !containerRef.current || mapRef.current) return

    const map = mapLib.map(containerRef.current).setView([19.2183, 72.9781], 13)
    mapLib.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
    }).addTo(map)
    markersRef.current = mapLib.layerGroup().addTo(map)
    heatRef.current = mapLib.layerGroup().addTo(map)
    mapRef.current = map

    if (navigator.geolocation) {
      setGpsLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map.setView([latitude, longitude], 14)
          setUsingDefaultCenter(false)
          setGpsLoading(false)
        },
        () => setGpsLoading(false),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = null
      heatRef.current = null
    }
  }, [mapLib])

  useEffect(() => {
    if (!mapLib || !markersRef.current) return
    markersRef.current.clearLayers()

    const points = (complaints || []).filter((c) => typeof c.latitude === 'number' && typeof c.longitude === 'number')
    const bounds = []
    points.forEach((complaint) => {
      const color = getStatusMarkerColor(complaint.status)
      const icon = createCustomIcon(mapLib, color, (complaint.severity || 'm').charAt(0).toUpperCase())
      const marker = mapLib.marker([complaint.latitude, complaint.longitude], { icon }).addTo(markersRef.current)
      marker.bindPopup(
        `<strong>${complaint.complaintId || ''}</strong><br/>${complaint.title || ''}<br/>${getStatusLabel(complaint.status || 'REPORTED')}`
      )
      if (onSelect) marker.on('click', () => onSelect(complaint))
      bounds.push([complaint.latitude, complaint.longitude])
    })

    if (bounds.length > 0 && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
    }
  }, [complaints, mapLib, onSelect])

  useEffect(() => {
    if (!mapLib || !heatRef.current) return
    heatRef.current.clearLayers()
    if (!showHeat) return
    HOTSPOTS.forEach((h) => {
      const radius = 400 + h.intensity * 1400
      mapLib.circle([h.lat, h.lng], {
        radius,
        color: h.color,
        weight: 1.5,
        fillColor: h.color,
        fillOpacity: 0.35
      }).addTo(heatRef.current)
      mapLib.circle([h.lat, h.lng], {
        radius: radius * 0.45,
        color: h.color,
        weight: 0,
        fillColor: h.color,
        fillOpacity: 0.5
      }).addTo(heatRef.current)
    })
  }, [showHeat, mapLib])

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-[#06111F] border border-[var(--border-default)] rounded-xl" style={{ height }}>
        <p className="text-[var(--text-muted)]">Loading map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-[#06111F] border border-[var(--border-default)] rounded-xl" style={{ height }}>
        <p className="text-[var(--accent-red)]">Failed to load map library</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-default)] bg-[#06111F]">
      <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Complaint map" />
      {usingDefaultCenter && (
        <div className="hidden sm:block absolute top-3 left-14 z-[1000] bg-[#06111F]/90 border border-cyan-400/30 text-xs text-slate-300 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          Defaulting to local city center (Thane)
        </div>
      )}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation || !mapRef.current) return
            setGpsLoading(true)
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords
                mapRef.current.setView([latitude, longitude], 14)
                setUsingDefaultCenter(false)
                setGpsLoading(false)
              },
              () => setGpsLoading(false),
              { enableHighAccuracy: true, timeout: 8000 }
            )
          }}
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
      {complaints.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <p className="text-slate-400 text-sm bg-[#06111F]/90 border border-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> No mappable complaints
          </p>
        </div>
      )}
    </div>
  )
}
