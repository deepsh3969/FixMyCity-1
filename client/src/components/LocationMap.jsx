import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useGoogleMaps, hasGoogleMapsKey } from '../utils/gmaps'
import { pinIconDataUri } from '../utils/map'
import { CoordsBadge } from './UI'

const toNum = (v) => (typeof v === 'string' ? parseFloat(v) : Number(v))

const isValid = (lat, lng) => Number.isFinite(toNum(lat)) && Number.isFinite(toNum(lng))

const THANE = { lat: 19.2183, lng: 72.9781 }

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
  const observerRef = useRef(null)
  const { maps, loading, error } = useGoogleMaps()
  const [gpsLoading, setGpsLoading] = useState(false)

  const startLat = () => {
    const lat = toNum(latitude)
    return Number.isFinite(lat) ? lat : THANE.lat
  }
  const startLng = () => {
    const lng = toNum(longitude)
    return Number.isFinite(lng) ? lng : THANE.lng
  }

  useEffect(() => {
    if (!maps || !containerRef.current || mapRef.current) return undefined

    const map = new maps.Map(containerRef.current, {
      center: { lat: startLat(), lng: startLng() },
      zoom,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      rotateControl: false
    })
    mapRef.current = map

    const marker = new maps.Marker({
      position: { lat: startLat(), lng: startLng() },
      map,
      draggable,
      title: 'Complaint location',
      icon: {
        url: pinIconDataUri(color, label),
        scaledSize: new maps.Size(32, 42),
        anchor: new maps.Point(16, 41)
      }
    })
    markerRef.current = marker

    if (draggable) {
      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        onChange?.(pos.lat(), pos.lng())
      })
      map.addListener('click', (e) => {
        marker.setPosition(e.latLng)
        onChange?.(e.latLng.lat(), e.latLng.lng())
      })
    }

    observerRef.current = new ResizeObserver(() => {
      if (mapRef.current) maps.event.trigger(mapRef.current, 'resize')
    })
    observerRef.current.observe(containerRef.current)

    setTimeout(() => {
      if (mapRef.current) maps.event.trigger(mapRef.current, 'resize')
    }, 120)

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
      if (markerRef.current) markerRef.current.setMap(null)
      if (secondaryMarkerRef.current) secondaryMarkerRef.current.setMap(null)
      mapRef.current = null
      markerRef.current = null
      secondaryMarkerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps])

  // Sync primary marker when props change externally (geolocation, "use original", etc.)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const lat = toNum(latitude)
    const lng = toNum(longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const pos = markerRef.current.getPosition()
    if (Math.abs(pos.lat() - lat) > 1e-7 || Math.abs(pos.lng() - lng) > 1e-7) {
      markerRef.current.setPosition({ lat, lng })
      mapRef.current.panTo({ lat, lng })
      if (mapRef.current.getZoom() < zoom) mapRef.current.setZoom(zoom)
    }
  }, [latitude, longitude, zoom])

  // Secondary marker (e.g., repair location)
  const secondaryKey =
    secondary && isValid(secondary.latitude, secondary.longitude)
      ? `${secondary.latitude}|${secondary.longitude}|${secondary.color || ''}|${secondary.label || ''}|${secondary.popup || ''}`
      : ''
  useEffect(() => {
    if (!maps || !mapRef.current) return
    const map = mapRef.current

    if (secondaryMarkerRef.current) {
      secondaryMarkerRef.current.setMap(null)
      secondaryMarkerRef.current = null
    }

    if (secondary && isValid(secondary.latitude, secondary.longitude)) {
      const m = new maps.Marker({
        position: { lat: toNum(secondary.latitude), lng: toNum(secondary.longitude) },
        map,
        title: secondary.popup ? 'Repair location' : 'Location',
        icon: {
          url: pinIconDataUri(secondary.color || '#0891b2', secondary.label || 'R'),
          scaledSize: new maps.Size(32, 42),
          anchor: new maps.Point(16, 41)
        }
      })
      if (secondary.popup) {
        const info = new maps.InfoWindow({ content: secondary.popup })
        m.addListener('click', () => info.open({ map, anchor: m }))
      }
      secondaryMarkerRef.current = m

      const primaryLat = toNum(latitude)
      const primaryLng = toNum(longitude)
      if (Number.isFinite(primaryLat) && Number.isFinite(primaryLng)) {
        const bounds = new maps.LatLngBounds()
        bounds.extend({ lat: primaryLat, lng: primaryLng })
        bounds.extend({ lat: toNum(secondary.latitude), lng: toNum(secondary.longitude) })
        map.fitBounds(bounds, { padding: 40 })
        if (map.getZoom() > 17) map.setZoom(17)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryKey, maps, latitude, longitude])

  if (!hasGoogleMapsKey || error === 'MISSING_KEY') {
    return (
      <MapMessage
        height={height}
        title="Google Maps is not configured"
        body="Set the VITE_GOOGLE_MAPS_API_KEY environment variable to enable the location map."
      />
    )
  }

  if (error) {
    return (
      <MapMessage
        height={height}
        tone="error"
        title="Google Maps failed to load"
        body="Check the API key, Maps JavaScript API, and billing in Google Cloud Console."
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-[#07121F] border border-[rgba(34,211,238,0.14)] rounded-[14px]" style={{ height }}>
        <p className="text-[var(--text-muted)]">Loading Google Maps...</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[14px] border border-[rgba(34,211,238,0.14)] bg-[#07121F] shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Location map" />
      <div className="absolute bottom-2 left-2 z-[1000] bg-[#06111F]/92 border border-cyan-400/25 text-xs text-slate-300 px-2.5 py-1 rounded-lg backdrop-blur-sm pointer-events-none flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
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
                const glat = position.coords.latitude
                const glng = position.coords.longitude
                mapRef.current.setCenter({ lat: glat, lng: glng })
                if (draggable && markerRef.current) {
                  markerRef.current.setPosition({ lat: glat, lng: glng })
                  onChange?.(glat, glng)
                }
                setGpsLoading(false)
              },
              () => setGpsLoading(false),
              { enableHighAccuracy: true, timeout: 8000 }
            )
          }}
          className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-[#06111F]/92 border border-cyan-400/30 text-xs text-slate-300 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:border-cyan-400 hover:text-cyan-200 transition-colors"
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
      <span className="text-sm font-medium text-[var(--text-primary)]">{address || 'Thane, Maharashtra'}</span>
      <CoordsBadge latitude={latitude} longitude={longitude} />
    </div>
  )
}
