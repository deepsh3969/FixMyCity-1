import { useState, useEffect } from 'react'

export function useMap() {
  const [mapLib, setMapLib] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = await import('leaflet')

        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
        })

        if (!document.querySelector('link[data-leaflet-css]')) {
          const cssLink = document.createElement('link')
          cssLink.rel = 'stylesheet'
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          cssLink.crossOrigin = 'anonymous'
          cssLink.setAttribute('data-leaflet-css', '')
          document.head.appendChild(cssLink)
        }

        setMapLib(L)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  return { mapLib, loading, error }
}

export function getStatusMarkerColor(status) {
  const colors = {
    REPORTED: '#3b82f6',
    ASSIGNED: '#a855f7',
    UNDER_REPAIR: '#f59e0b',
    VERIFICATION: '#06b6d4',
    VERIFIED: '#10b981',
    MANUAL_REVIEW: '#f59e0b',
    REJECTED: '#ef4444',
    RESOLVED: '#6b7280'
  }
  return colors[status] || '#3b82f6'
}

export function createCustomIcon(L, color, label) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        border: 3px solid #ffffff;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ">
        <div style="transform: rotate(45deg); font-size: 12px; font-weight: bold; color: white;">${label}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}