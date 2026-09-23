import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SHOTS = path.join(ROOT, 'test-artifacts')
const BASE = 'http://127.0.0.1:5173'
const API = 'http://127.0.0.1:5000'

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

try {
  // ---------- 1. LOGIN PAGE + LOGO ----------
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(800)
  await shot(page, '01-login-logo')

  const logoBox = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => (i.src || '').includes('logo'))
    const shields = [...document.querySelectorAll('svg.lucide-shield')]
    const el = imgs.find(i => i.getBoundingClientRect().height > 40) ||
      shields.map(s => s.closest('div')).find(d => d && d.getBoundingClientRect().height > 40)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { w: r.width, h: r.height }
  })
  check('Login logo substantially enlarged (>=80px)', Boolean(logoBox && logoBox.w >= 80 && logoBox.h >= 80),
    logoBox ? `${Math.round(logoBox.w)}x${Math.round(logoBox.h)}px` : 'logo not found')

  const wordmark = await page.getByText('FixMyCity', { exact: true }).first().isVisible()
  check('FixMyCity wordmark visible', wordmark)

  // ---------- 2. LOGIN AS CITIZEN ----------
  await page.fill('#email', 'citizen@fixmycity.com')
  await page.fill('#password', 'password123')
  await page.click('button[type=submit]')
  await page.waitForURL(/\/citizen\//, { timeout: 20000 })
  check('Citizen login + redirect', page.url().includes('/citizen/dashboard'), page.url())
  await shot(page, '02-citizen-dashboard')

  // ---------- 3. REPORT FLOW: NON-POTHOLE ----------
  await page.goto(`${BASE}/citizen/report`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.getByPlaceholder(/Large pothole on Eastern Express/).fill('Deep pothole near Majiwada')
  await page.getByPlaceholder(/Deep pothole near Majiwada/).fill('Large waterlogged pothole causing traffic issues after rain.')

  await page.setInputFiles('#image-upload', path.join(ROOT, 'NOPOTH4.png'))
  console.log('  … waiting for AI analysis of NOPOTH (up to 180s)')
  await page.waitForSelector('[data-testid^="ai-analysis-"]', { timeout: 30000 })
    .catch(async () => { throw new Error('AI panel never appeared after NOPOTH upload') })
  await page.waitForSelector('[data-testid="ai-analysis-invalid"]', { timeout: 180000 })
    .catch(async (e) => {
      const state = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid^="ai-analysis-"]')].map(n => `${n.dataset.testid}: ${n.textContent.slice(0, 200)}`)
      )
      throw new Error(`NOPOTH reached wrong state — ${state.join(' || ') || 'no panel'}`)
    })
  await shot(page, '03-nopoth-invalid')

  const body03 = await page.textContent('body')
  check('Non-pothole → INVALID EVIDENCE panel', true)
  check('No hardcoded "50% verified"', !/50\s*%\s*verified/i.test(body03))
  check('No "50% confidence" fallback on non-pothole', !/50\s*%?\s*confidence/i.test(body03))

  const continueDisabled = await page.locator('button', { hasText: 'Continue' }).isDisabled()
  check('Continue BLOCKED for invalid evidence', continueDisabled)

  const invalidText = await page.locator('[data-testid="ai-analysis-invalid"]').textContent()
  check('Invalid panel explains rejection', /No pothole/i.test(invalidText) || /INVALID/i.test(invalidText))

  const nopothDesc = (await page.locator('[data-testid="ai-analysis-invalid"] p.italic').first().textContent()) || ''

  console.log('  … respecting Gemini rate limit (60s pause)')
  await page.waitForTimeout(60000)

  // ---------- 4. REPORT FLOW: GENUINE POTHOLE ----------
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.closest('div')?.querySelector('img[alt="Preview"]'))
    if (btn) btn.click()
  })
  await page.waitForTimeout(500)
  await page.setInputFiles('#image-upload', path.join(ROOT, 'POTH1.jpg'))
  console.log('  … waiting for AI analysis of POTH (up to 180s)')
  await page.waitForSelector('[data-testid^="ai-analysis-"]', { timeout: 30000 })
    .catch(async () => { throw new Error('AI panel never appeared after POTH upload') })
  await page.waitForSelector('[data-testid="ai-analysis-accepted"]', { timeout: 180000 })
    .catch(async (e) => {
      const state = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid^="ai-analysis-"]')].map(n => `${n.dataset.testid}: ${n.textContent.slice(0, 200)}`)
      )
      throw new Error(`POTH reached wrong state — ${state.join(' || ') || 'no panel'}`)
    })
  await shot(page, '04-poth-accepted')

  const accepted = await page.locator('[data-testid="ai-analysis-accepted"]').textContent()
  check('Pothole → ACCEPTED / detected panel', /Accepted|detected/i.test(accepted))

  const confMatch = accepted.match(/(\d{2,3})%/)
  check('Real confidence % displayed', Boolean(confMatch && Number(confMatch[1]) !== 50),
    confMatch ? `${confMatch[1]}%` : 'none')
  check('Severity shown', /LOW|MEDIUM|HIGH|CRITICAL/.test(accepted))
  check('Evidence quality shown', /GOOD|FAIR|POOR|INSUFFICIENT/.test(accepted))

  const pothDesc = (await page.locator('[data-testid="ai-analysis-accepted"] p.italic').first().textContent()) || ''
  check('Description DYNAMIC (differs per image)',
    pothDesc.trim().length > 10 && nopothDesc.trim().length > 10 && pothDesc.trim() !== nopothDesc.trim(),
    `poth=${pothDesc.trim().slice(0, 60)}…`)

  // ---------- 5. COMPLETE SUBMISSION + LOCATION ----------
  const continueBtn = page.locator('button', { hasText: 'Continue' })
  check('Continue ENABLED for valid evidence', !(await continueBtn.isDisabled()))
  await continueBtn.click()
  await page.waitForTimeout(1500)
  const reviewBtn = page.locator('button', { hasText: /Review & Submit/ })
  await reviewBtn.click().catch(() => {})
  await page.waitForTimeout(1000)
  await shot(page, '05-review-step')
  await page.locator('button', { hasText: 'Submit Report' }).click()
  await page.waitForSelector('text=Report Submitted', { timeout: 30000 })
  await shot(page, '06-submitted')

  const successText = await page.textContent('body')
  check('Success shows 📍 location name', successText.includes('📍'))
  check('Success shows Location Details (coords secondary)', /Location Details/i.test(successText))
  check('Raw coordinates NOT primary (only in details badge)', /Location Details[\s\S]{0,80}\d{2}\.\d{4,}/.test(successText))

  // ---------- 6. MUNICIPAL ANALYTICS BAR CHART ----------
  await context.clearCookies()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('#email', 'municipal@fixmycity.com')
  await page.fill('#password', 'password123')
  await page.click('button[type=submit]')
  await page.waitForURL(/\/municipal\//, { timeout: 20000 })
  await page.goto(`${BASE}/municipal/analytics`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('[data-testid="analytics-bar-chart"] svg.recharts-surface', { timeout: 15000 })
  await page.waitForTimeout(1200)
  await shot(page, '07-analytics-bar-chart')

  const barCount = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="analytics-bar-chart"] svg.recharts-surface')
    if (!svg) return 0
    return svg.querySelectorAll('.recharts-bar-rectangle, .recharts-rectangle, .recharts-bar').length
  })
  check('Analytics renders interactive bar chart (recharts SVG)', barCount > 0, `${barCount} bar elements`)

  const analyticsText = await page.textContent('body')
  const flatAnalytics = analyticsText.replace(/\s+/g, '')
  const hasCategories = ['Reported', 'Assigned', 'UnderRepair', 'Verification', 'Verified', 'ManualReview', 'Rejected', 'Resolved']
    .every(l => flatAnalytics.includes(l.replace(/\s+/g, '')))
  check('All 8 status categories present', hasCategories)

  // ---------- 7. CITIZEN LIST SHOWS 📍 ----------
  await context.clearCookies()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('#email', 'citizen@fixmycity.com')
  await page.fill('#password', 'password123')
  await page.click('button[type=submit]')
  await page.waitForURL(/\/citizen\//, { timeout: 20000 })
  await page.goto(`${BASE}/citizen/history`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(1500)
  await shot(page, '08-citizen-history-location')
  const histText = await page.textContent('body')
  check('Citizen list shows 📍 place name', histText.includes('📍'))

  // ---------- 8. CONSOLE / NETWORK ----------
  const ignorable = (t) =>
    /favicon|logo\.png/i.test(t) ||
    /net::ERR_ABORTED/i.test(t)
  const realConsole = consoleErrors.filter(t => !ignorable(t))
  const realBad = badResponses.filter(u => !u.includes('logo.png'))
  check('No unexpected console errors', realConsole.length === 0, realConsole.slice(0, 3).join(' | ') || 'clean')
  check('No uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | ') || 'clean')
  check('No unexpected API failures', realBad.length === 0, realBad.slice(0, 3).join(' | ') || 'clean')

} catch (err) {
  check(`FLOW CRASH: ${err.message}`, false)
  await shot(page, '99-crash').catch(() => {})
} finally {
  await browser.close()
}

const failed = results.filter(r => !r.ok)
console.log('\n================ SMOKE SUMMARY ================')
console.log(`TOTAL: ${results.length}  PASS: ${results.length - failed.length}  FAIL: ${failed.length}`)
if (failed.length) {
  failed.forEach(f => console.log(`  ✗ ${f.name} ${f.detail}`))
  process.exit(1)
}
console.log('ALL UI FLOWS VERIFIED ✅')
