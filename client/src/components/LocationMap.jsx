import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useMap, createCustomIcon } from '../utils/map'
import { CoordsBadge } from './UI'

const toNum = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v))

const isValid = (lat, lng) => Number.isFinite(toNum(lat)) && Number.isFinite(toNum(lng))

export default function LocationMap({
  latitude,
  longitude,
  secondary = null,
  height = 240,
  zoom = 16,
  color = '#0891b2',
  label = 'P',
  draggable = false,
  onChange,
  showMyLocation = true
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const secondaryMarkerRef = useRef(null)
  const { mapLib, loading, error } = useMap()
  const [gpsLoading, setGpsLoading] = useState(false)

  useEffect(() => {
    if (!mapLib || !containerRef.current || mapRef.current) return

    const lat = toNum(latitude)
    const lng = toNum(longitude)
    const startLat = Number.isFinite(lat) ? lat : 19.2183
    const startLng = Number.isFinite(lng) ? lng : 72.9781

    const map = mapLib.map(containerRef.current).setView([startLat, startLng], zoom)
    mapLib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    const icon = createCustomIcon(mapLib, color, label)
    const marker = mapLib.marker([startLat, startLng], { icon, draggable }).addTo(map)
    markerRef.current = marker

    if (draggable && onChange) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChange(pos.lat, pos.lng)
      })
      map.on('click', (e) => {
        marker.setLatLng(e.latlng)
        onChange(e.latlng.lat, e.latlng.lng)
      })
    }

    mapRef.current = map

    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      secondaryMarkerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLib])

  // Sync primary marker when props change externally (geolocation, "use original", etc.)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const lat = toNum(latitude)
    const lng = toNum(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const pos = markerRef.current.getLatLng()
    if (Math.abs(pos.lat - lat) > 1e-7 || Math.abs(pos.lng - lng) > 1e-7) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), zoom))
    }
  }, [latitude, longitude, zoom])

  // Secondary marker (e.g., repair location) — keyed on values so parent re-renders don't churn it
  const secondaryKey =
    secondary && isValid(secondary.latitude, secondary.longitude)
      ? `${secondary.latitude}|${secondary.longitude}|${secondary.color || ''}|${secondary.label || ''}|${secondary.popup || ''}`
      : ''
  useEffect(() => {
    if (!mapLib || !mapRef.current) return
    const map = mapRef.current

    if (secondaryMarkerRef.current) {
      map.removeLayer(secondaryMarkerRef.current)
      secondaryMarkerRef.current = null
    }

    if (secondary && isValid(secondary.latitude, secondary.longitude)) {
      const icon = createCustomIcon(mapLib, secondary.color || '#0891b2', secondary.label || 'R')
      const m = mapLib.marker([toNum(secondary.latitude), toNum(secondary.longitude)], { icon }).addTo(map)
      if (secondary.popup) m.bindPopup(secondary.popup)
      secondaryMarkerRef.current = m

      const primaryLat = toNum(latitude)
      const primaryLng = toNum(longitude)
      if (Number.isFinite(primaryLat) && Number.isFinite(primaryLng)) {
        map.fitBounds(
          [
            [primaryLat, primaryLng],
            [toNum(secondary.latitude), toNum(secondary.longitude)]
          ],
          { padding: [40, 40], maxZoom: 17 }
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryKey, mapLib, latitude, longitude])

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
      <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Location map" />
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 border border-slate-300 text-xs text-slate-600 px-2.5 py-1 rounded-lg backdrop-blur-sm pointer-events-none flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-cyan-600" />
        {draggable ? 'Drag the pin or tap the map to set the location' : 'Complaint location'}
      </div>
      {showMyLocation && (
        <button
          type="button"
          onClick={() => {
            if (!navigator.geolocation || !mapRef.current) return
            setGpsLoading(true)
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude: glat, longitude: glng } = position.coords
                mapRef.current.setView([glat, glng], 16)
                if (draggable && markerRef.current) {
                  markerRef.current.setLatLng([glat, glng])
                  onChange?.(glat, glng)
                }
                setGpsLoading(false)
              },
              () => setGpsLoading(false),
              { enableHighAccuracy: true, timeout: 8000 }
            )
          }}
          className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-white/90 border border-slate-300 text-xs text-slate-700 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:border-cyan-400 hover:text-slate-900 transition-colors"
          aria-label="My location"
        >
          <span className="relative flex h-2.5 w-2.5">
            {!gpsLoading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          {gpsLoading ? 'Locating...' : 'My Location'}
        </button>
      )}
    </div>
  )
}

export function LocationSummary({ address, latitude, longitude, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />
      <span className="text-sm font-medium text-slate-900">{address || 'Thane, Maharashtra'}</span>
      <CoordsBadge latitude={latitude} longitude={longitude} />
    </div>
  )
}
