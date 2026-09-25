import { useEffect, useState } from 'react'

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export const hasGoogleMapsKey = Boolean(KEY)

let scriptPromise = null

function ensureAuthFailureHook() {
  if (window.__gmAuthHooked) return
  window.__gmAuthHooked = true
  window.gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gm-auth-failure'))
  }
}

export function loadGoogleMaps() {
  if (!KEY) return Promise.reject(new Error('MISSING_KEY'))
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps)
  ensureAuthFailureHook()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}`
    script.async = true
    script.onload = () => {
      if (window.google && window.google.maps) resolve(window.google.maps)
      else reject(new Error('LOAD_ERROR'))
    }
    script.onerror = () => reject(new Error('SCRIPT_ERROR'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function useGoogleMaps() {
  const [state, setState] = useState(() =>
    KEY
      ? { maps: null, loading: true, error: null }
      : { maps: null, loading: false, error: 'MISSING_KEY' }
  )

  useEffect(() => {
    if (!KEY) return undefined
    let alive = true
    const onAuthFail = () => {
      if (alive) setState({ maps: null, loading: false, error: 'AUTH_ERROR' })
    }
    window.addEventListener('gm-auth-failure', onAuthFail)
    loadGoogleMaps()
      .then((maps) => {
        if (alive) setState({ maps, loading: false, error: null })
      })
      .catch(() => {
        if (alive) setState({ maps: null, loading: false, error: 'LOAD_ERROR' })
      })
    return () => {
      alive = false
      window.removeEventListener('gm-auth-failure', onAuthFail)
    }
  }, [])

  return state
}
