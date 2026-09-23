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
    mapLib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
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
      <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl" style={{ height }}>
        <p className="text-slate-500">Loading map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl" style={{ height }}>
        <p className="text-red-600">Failed to load map library</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Complaint map" />
      {usingDefaultCenter && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 border border-slate-300 text-xs text-slate-700 px-3 py-1.5 rounded-lg backdrop-blur-sm">
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
          className="flex items-center gap-2 bg-white/90 border border-slate-300 text-xs text-slate-700 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:border-cyan-400 hover:text-slate-900 transition-colors"
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
            showHeat ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white/90 border-slate-300 text-slate-700'
          }`}
          aria-pressed={showHeat}
          title="Toggle demo heatmap"
        >
          <Flame className={`w-3.5 h-3.5 ${showHeat ? 'text-amber-600' : 'text-slate-500'}`} />
          {showHeat ? 'Heatmap on' : 'Heatmap'}
        </button>
        {showHeat && (
          <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
            Demo heatmap
          </span>
        )}
      </div>
      {showHeat && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 border border-slate-200 rounded-lg px-3 py-2 text-[11px] space-y-1 shadow-sm">
          <p className="font-semibold text-slate-700 flex items-center gap-1"><Layers className="w-3 h-3" /> Hotspots (demo)</p>
          {HOTSPOTS.map((h) => (
            <div key={h.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: h.color }} />
              <span className="text-slate-600">{h.name}</span>
              <span className="text-slate-400">~{h.complaints}</span>
            </div>
          ))}
          {heatmapLabels.length > 0 && (
            <div className="pt-1 border-t border-slate-200">
              <p className="font-semibold text-slate-700 flex items-center gap-1"><Flame className="w-3 h-3" /> DEMO Areas</p>
              {heatmapLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: HOTSPOTS[i]?.color || '#ef4444' }} />
                  <span className="text-slate-600">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {complaints.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <p className="text-slate-500 text-sm bg-white/80 px-3 py-2 rounded-lg flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> No mappable complaints
          </p>
        </div>
      )}
    </div>
  )
}
