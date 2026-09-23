const THANE_LANDMARKS = [
  { lat: 19.2200, lng: 72.9800, address: 'Eastern Express Highway, Thane West, Maharashtra 400601' },
  { lat: 19.2400, lng: 72.9700, address: 'Ghodbunder Road, Near Majiwada Junction, Thane West, Maharashtra 400601' },
  { lat: 19.2100, lng: 72.9900, address: 'Pokhran Road No. 1, Thane West, Maharashtra 400601' },
  { lat: 19.2077, lng: 72.9764, address: 'Pokhran Road No. 2, Thane West, Maharashtra 400601' },
  { lat: 19.1860, lng: 72.9700, address: 'Station Road, Near Jambli Naka, Thane West' },
  { lat: 19.1810, lng: 72.9490, address: 'Station Road, Near Kalyan Bus Depot, Kalyan' },
  { lat: 19.2450, lng: 72.9600, address: 'Kolshet Road, Thane West, Maharashtra 400607' },
  { lat: 19.1930, lng: 72.9760, address: 'Ram Maruti Road, Naupada, Thane West' },
  { lat: 19.2550, lng: 72.9800, address: 'Waghbil Naka, Ghodbunder Road, Thane West' },
  { lat: 19.1750, lng: 72.9400, address: 'Kalyan West, Maharashtra 421301' },
  { lat: 19.2183, lng: 72.9781, address: 'Thane City Centre, Thane West, Maharashtra' }
]

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function nearestLandmark(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null
  let best = null
  let bestDist = Infinity
  for (const spot of THANE_LANDMARKS) {
    const d = haversineMeters(la, ln, spot.lat, spot.lng)
    if (d < bestDist) {
      bestDist = d
      best = spot
    }
  }
  if (!best) return null
  return { ...best, distance: bestDist }
}

export function nearestLandmarkAddress(lat, lng) {
  const hit = nearestLandmark(lat, lng)
  if (!hit) return 'Thane, Maharashtra'
  return hit.distance > 400 ? `Near ${hit.address}` : hit.address
}

export function describeLocation(lat, lng, storedAddress) {
  if (storedAddress && String(storedAddress).trim()) return String(storedAddress).trim()
  return nearestLandmarkAddress(lat, lng)
}

const geocodeCache = new Map()

function shortenDisplayName(displayName) {
  if (!displayName) return null
  const parts = displayName.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 4) return parts.join(', ')
  return parts.slice(0, 4).join(', ')
}

export async function reverseGeocode(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    return nearestLandmarkAddress(lat, lng)
  }
  const key = `${la.toFixed(4)},${ln.toFixed(4)}`
  if (geocodeCache.has(key)) return geocodeCache.get(key)

  const fallback = nearestLandmarkAddress(la, ln)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${la}&lon=${ln}&zoom=18&addressdetails=0`,
      { signal: controller.signal, headers: { Accept: 'application/json' } }
    )
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      const short = shortenDisplayName(data.display_name)
      if (short) {
        geocodeCache.set(key, short)
        return short
      }
    }
  } catch {
    /* offline or rate-limited — fall back to nearest Thane landmark */
  }
  geocodeCache.set(key, fallback)
  return fallback
}
