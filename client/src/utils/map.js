export function getStatusMarkerColor(status) {
  const colors = {
    REPORTED: '#a855f7',
    ASSIGNED: '#6366f1',
    UNDER_REPAIR: '#3b82f6',
    VERIFICATION: '#f59e0b',
    VERIFIED: '#10b981',
    MANUAL_REVIEW: '#f59e0b',
    REJECTED: '#ef4444',
    RESOLVED: '#10b981'
  }
  return colors[status] || '#a855f7'
}

const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function pinIconDataUri(color, letter = '') {
  const text = letter
    ? `<text x="16" y="17.8" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="10.5" font-weight="bold" fill="#ffffff">${escapeXml(letter)}</text>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 1.5C8.5 1.5 2.5 7.5 2.5 14.6c0 9.6 13.5 26 13.5 26s13.5-16.4 13.5-26C29.5 7.5 23.5 1.5 16 1.5z" fill="${color}" stroke="#ffffff" stroke-width="2.2"/><circle cx="16" cy="14.4" r="8" fill="rgba(3,7,18,0.62)"/>${text}</svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

export function youIconDataUri() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="58" viewBox="0 0 72 58"><defs><filter id="g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="13" y="2" width="46" height="21" rx="6.5" fill="rgba(3,7,18,0.9)" stroke="rgba(34,211,238,0.85)" stroke-width="1.5" filter="url(#g)"/><text x="36" y="16.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="bold" letter-spacing="2.5" fill="#67E8F9">YOU</text><circle cx="36" cy="41" r="11.5" fill="rgba(34,211,238,0.28)"/><circle cx="36" cy="41" r="7.5" fill="#22D3EE" stroke="#ffffff" stroke-width="2.6" filter="url(#g)"/></svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}
