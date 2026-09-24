import { useEffect, useRef, useState } from 'react'
import { useMap } from '../utils/map'
import { Flame } from 'lucide-react'

/**
 * Clearly-labeled DEMO heatmap for Thane hotspots (Majiwada, Naupada, Pokhran Road, Kolshet).
 * Uses Leaflet circle overlays â€” no extra dependency.
 */
const HOTSPOTS = [
  { name: 'Majiwada', lat: 19.2400, lng: 72.9700, intensity: 0.95, color: '#ef4444', complaints: 18 },
  { name: 'Naupada', lat: 19.1930, lng: 72.9760, intensity: 0.7, color: '#f59e0b', complaints: 11 },
  { name: 'Pokhran Road', lat: 19.2100, lng: 72.9900, intensity: 0.85, color: '#f97316', complaints: 14 },
  { name: 'Kolshet', lat: 19.2450, lng: 72.9600, intensity: 0.75, color: '#f59e0b', complaints: 12 }
]

export default function DemoHeatmap({ height = 360 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const { mapLib, loading, error } = useMap()
  const [hover, setHover] = useState(null)

  useEffect(() => {
    if (!mapLib || !containerRef.current || mapRef.current) return

    const map = mapLib.map(containerRef.current).setView([19.2183, 72.9781], 12)
    mapLib.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
    }).addTo(map)

    const layer = mapLib.layerGroup().addTo(map)
    HOTSPOTS.forEach((h) => {
      const radius = 400 + h.intensity * 1400
      const circle = mapLib.circle([h.lat, h.lng], {
        radius,
        color: h.color,
        weight: 1.5,
        fillColor: h.color,
        fillOpacity: 0.35
      }).addTo(layer)
      circle.bindPopup(
        `<strong>${h.name}</strong><br/>~${h.complaints} hotspots (demo)<br/>Relative density: ${Math.round(h.intensity * 100)}%`
      )
      mapLib.circle([h.lat, h.lng], {
        radius: radius * 0.45,
        color: h.color,
        weight: 0,
        fillColor: h.color,
        fillOpacity: 0.5
      }).addTo(layer)
    })

    map.fitBounds(
      HOTSPOTS.map((h) => [h.lat, h.lng]),
      { padding: [40, 40] }
    )

    mapRef.current = map
    layerRef.current = layer
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLib])

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl" style={{ height }}>
        <p className="text-slate-500">Loading heatmapâ€¦</p>
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
      <div ref={containerRef} style={{ height, width: '100%' }} aria-label="Demo heatmap" />
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-white/95 border border-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
        <Flame className="w-4 h-4 text-amber-600" />
        DEMO HEATMAP â€” illustrative density only
      </div>
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 border border-slate-200 rounded-lg px-3 py-2 text-[11px] space-y-1 shadow-sm">
        {HOTSPOTS.map((h) => (
          <div
            key={h.name}
            className="flex items-center gap-2 cursor-default"
            onMouseEnter={() => setHover(h.name)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: h.color }} />
            <span className={hover === h.name ? 'font-bold text-slate-900' : 'text-slate-600'}>
              {h.name}
            </span>
            <span className="text-slate-400">~{h.complaints}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
