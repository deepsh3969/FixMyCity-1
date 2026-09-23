import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SHOTS = path.join(ROOT, 'test-artifacts')
const BASE = 'http://127.0.0.1:5173'

fs.mkdirSync(SHOTS, { recursive: true })

const results = []
const consoleErrors = []
const pageErrors = []
const badResponses = []

function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const shot = async (page, name) => {
  const file = path.join(SHOTS, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const url = msg.location()?.url || ''
    if (url.includes('logo.png') || url.includes('favicon')) return
    consoleErrors.push(`${msg.text()} ${url}`)
  }
})
page.on('pageerror', (err) => pageErrors.push(String(err)))
page.on('response', (res) => {
  const url = res.url()
  if (res.status() >= 400 && (url.includes('/api/') || url.includes('5000'))) {
    badResponses.push(`${res.status()} ${url}`)
  }
})

const login = async (email) => {
  await context.clearCookies()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('#email', email)
  await page.fill('#password', 'password123')
  await page.click('button[type=submit]')
  await page.waitForURL(/\/(citizen|municipal|contractor)\//, { timeout: 20000 })
}

try {
  // ---------- 1. LOGO FIT (login) ----------
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)
  await shot(page, '10-login-logo-fit')

  const logoInfo = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => (i.src || '').includes('logo'))
    const el = imgs.find(i => i.getBoundingClientRect().height > 40)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const parent = el.parentElement
    const pcs = parent ? getComputedStyle(parent) : null
    return {
      w: r.width, h: r.height,
      naturalW: el.naturalWidth, naturalH: el.naturalHeight,
      objectFit: cs.objectFit,
      parentOverflow: pcs ? pcs.overflow : null,
      parentPadding: pcs ? pcs.padding : null
    }
  })
  check('Login logo renders large', Boolean(logoInfo && logoInfo.w >= 80),
    logoInfo ? `${Math.round(logoInfo.w)}x${Math.round(logoInfo.h)} fit=${logoInfo.objectFit} overflow=${logoInfo.parentOverflow} pad=${logoInfo.parentPadding}` : 'not found')
  check('Logo not clipped by padding frame', Boolean(logoInfo && (logoInfo.parentPadding === '0px' || !logoInfo.parentPadding || logoInfo.parentPadding === '0')),
    logoInfo ? `parentPadding=${logoInfo.parentPadding}` : '')

  const wordmark = await page.getByText('FixMyCity', { exact: true }).first().isVisible()
  check('FixMyCity wordmark visible', wordmark)

  // ---------- 2. CITIZEN HEADER LOGO ----------
  await login('citizen@fixmycity.com')
  await shot(page, '11-citizen-header-logo')

  // ---------- 3. VARIED SEED PHOTOS (history list) ----------
  await page.goto(`${BASE}/citizen/history`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await shot(page, '12-history-varied-photos', true)

  const photoHashes = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')]
      .filter(i => (i.src || '').includes('/uploads/'))
    const hashes = []
    for (const img of imgs) {
      try {
        const buf = await fetch(img.src).then(r => r.arrayBuffer())
        const view = new Uint8Array(buf)
        let h = 0
        for (let i = 0; i < view.length; i += 97) h = (h * 31 + view[i]) | 0
        hashes.push(`${img.src.split('/').pop()}:${h}:${buf.byteLength}`)
      } catch { /* ignore */ }
    }
    return hashes
  })
  const uniqueSizes = new Set(photoHashes.map(h => h.split(':')[2]))
  const uniqueHashes = new Set(photoHashes.map(h => h.split(':')[1]))
  check('History shows multiple report photos', photoHashes.length >= 3, `${photoHashes.length} images`)
  check('Seed photos are VARIED (distinct content)', uniqueHashes.size >= 3 && uniqueSizes.size >= 3,
    `${uniqueHashes.size} unique hashes / ${uniqueSizes.size} unique sizes of ${photoHashes.length}`)
  console.log('  photos:', photoHashes.join(' | '))

  // ---------- 4. TIMELINE (citizen complaint detail) ----------
  const firstComplaintLink = page.locator('a[href*="/citizen/complaint/"], a[href*="/complaint/"]').first()
  const hasLink = await firstComplaintLink.count()
  if (hasLink) {
    await firstComplaintLink.click()
  } else {
    await page.evaluate(() => {
      const a = document.querySelector('a')
      const links = [...document.querySelectorAll('a')].filter(x => x.href.includes('complaint'))
      if (links[0]) links[0].click()
    })
  }
  await page.waitForTimeout(2000)
  const detailUrl = page.url()
  await shot(page, '13-timeline-complaint-detail', true)

  const timeline = await page.evaluate(() => {
    const circles = [...document.querySelectorAll('.rounded-full')].filter(c => c.className.includes('w-12') && c.className.includes('h-12'))
    return circles.map(c => {
      const svg = c.querySelector('svg')
      return {
        hasCheckIcon: Boolean(svg && (svg.classList.contains('lucide-check') || svg.getAttribute('class')?.includes('lucide-check'))),
        hasCheckCircleIcon: Boolean(svg && svg.getAttribute('class')?.includes('lucide-check-circle')),
        gradient: c.className.includes('bg-gradient-to-br')
      }
    })
  })
  check('Progress timeline present', timeline.length >= 3, `${timeline.length} markers`)
  const completed = timeline.filter(t => t.gradient)
  check('Completed markers use clean Check (not double-ring CheckCircle)',
    completed.length > 0 && completed.every(t => t.hasCheckIcon && !t.hasCheckCircleIcon),
    `${completed.length} completed: ${completed.map(c => c.hasCheckIcon ? 'check' : (c.hasCheckCircleIcon ? 'check-circle' : 'none')).join(',')}`)

  // ---------- 5. VERIFICATION PANEL (municipal, seeded VERIFIED complaint) ----------
  await login('municipal@fixmycity.com')
  const complaintsJson = await page.evaluate(async () => {
    const headers = {}
    const t = localStorage.getItem('token')
    if (t) headers.Authorization = `Bearer ${t}`
    const res = await fetch('http://127.0.0.1:5000/api/complaints', { headers, credentials: 'include' })
    if (!res.ok) return { error: res.status }
    return res.json()
  })
  const allComplaints = complaintsJson.complaints || complaintsJson.data || []
  const withVerif = allComplaints.find(c => c.verificationResultId) || allComplaints[0]
  if (!withVerif) throw new Error(`No municipal complaints available: ${JSON.stringify(complaintsJson).slice(0, 200)}`)
  await page.goto(`${BASE}/municipal/complaint/${withVerif._id}`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  await shot(page, '14-municipal-detail-panel', true)

  const panel = await page.evaluate(() => {
    const body = document.body.innerText
    return {
      hasPanel: body.includes('AI Proof-of-Repair Verification'),
      hasAnalysisDetails: body.includes('Analysis Details'),
      hasTotalScore: body.includes('Total Score'),
      hasGeminiRow: /REPAIR PHOTO (ACCEPTED|REJECTED|UNCERTAIN|SKIPPED)/.test(body),
      url: location.pathname
    }
  })
  check('Verification panel renders on municipal detail', panel.hasPanel, panel.url)
  check('Analysis Details section present (explanation field fix)', panel.hasAnalysisDetails, panel.hasAnalysisDetails ? 'shown' : 'missing')
  check('Total Score shown', panel.hasTotalScore)

  // ---------- 6. CONTRACTOR DETAIL (prop fix) ----------
  await login('contractor@fixmycity.com')
  const contractorPage = await page.evaluate(async () => {
    const headers = {}
    const t = localStorage.getItem('token')
    if (t) headers.Authorization = `Bearer ${t}`
    const res = await fetch('http://127.0.0.1:5000/api/contractor', { headers, credentials: 'include' })
    if (!res.ok) return { error: res.status }
    return res.json()
  })
  const cList = contractorPage.complaints || []
  const cWithVerif = cList.find(c => c.verificationResultId) || cList[0]
  if (cWithVerif) {
    await page.goto(`${BASE}/contractor/complaint/${cWithVerif._id}`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)
  }
  await shot(page, '15-contractor-detail', true)
  const cPanel = await page.evaluate(() => {
    const body = document.body.innerText
    return { hasPanel: body.includes('AI Proof-of-Repair Verification'), hasAnalysis: body.includes('Analysis Details') }
  })
  check('Contractor verification panel renders (result prop fix)',
    cWithVerif ? cPanel.hasPanel && cPanel.hasAnalysis : true,
    cWithVerif ? `panel=${cPanel.hasPanel} analysis=${cPanel.hasAnalysis}` : 'no verification on assignments')
  const cErr = pageErrors.filter(e => /VerificationPanel|explanations|is not a function|Cannot read/i.test(e))
  check('Contractor detail: no VerificationPanel crash', cErr.length === 0, cErr[0] || 'clean')

  // ---------- 7. NETWORK / CONSOLE ----------
  const ignorable = (t) => /favicon|logo\.png/i.test(t) || /net::ERR_ABORTED/i.test(t)
  const realConsole = consoleErrors.filter(t => !ignorable(t))
  const realBad = badResponses.filter(u => !u.includes('logo.png'))
  check('No unexpected console errors', realConsole.length === 0, realConsole.slice(0, 3).join(' | ') || 'clean')
  check('No uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || 'clean')
  check('No unexpected API failures', realBad.length === 0, realBad.slice(0, 3).join(' | ') || 'clean')
} catch (err) {
  check(`FLOW CRASH: ${err.message}`, false)
  await shot(page, '99-ui-check-crash').catch(() => {})
} finally {
  await browser.close()
}

const failed = results.filter(r => !r.ok)
console.log('\n================ UI CHECK SUMMARY ================')
console.log(`TOTAL: ${results.length}  PASS: ${results.length - failed.length}  FAIL: ${failed.length}`)
if (failed.length) {
  failed.forEach(f => console.log(`  ✗ ${f.name} ${f.detail}`))
  process.exit(1)
}
console.log('ALL UI CHECKS VERIFIED')
