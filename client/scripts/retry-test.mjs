import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SHOTS = path.join(ROOT, 'test-artifacts')
fs.mkdirSync(SHOTS, { recursive: true })

const results = []
const consoleErrors = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

page.on('console', (msg) => {
  if (msg.type() !== 'error') return
  const text = `${msg.text()} ${msg.location()?.url || ''}`
  if (/logo\.png|favicon/i.test(text)) return
  if (/ERR_FAILED|validate-image/i.test(text)) return // expected: our injected failure
  consoleErrors.push(text)
})
page.on('pageerror', (err) => consoleErrors.push(String(err)))

let apiHits = 0
await page.route('**/api/ai/validate-image', async (route) => {
  apiHits++
  if (apiHits === 1) {
    await route.abort('failed')
  } else {
    await route.continue()
  }
})

try {
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle' })
  await page.fill('#email', 'citizen@fixmycity.com')
  await page.fill('#password', 'password123')
  await page.click('button[type=submit]')
  await page.waitForURL(/\/citizen\//, { timeout: 20000 })

  await page.goto('http://127.0.0.1:5173/citizen/report', { waitUntil: 'networkidle' })
  await page.getByPlaceholder(/Large pothole on Eastern Express/).fill('Retry flow test report')
  await page.getByPlaceholder(/Deep pothole near Majiwada/).fill('Testing the AI error and retry path end to end.')

  // 1) Injected failure on first upload
  await page.setInputFiles('#image-upload', path.join(ROOT, 'POTH1.jpg'))
  await page.waitForSelector('[data-testid="ai-analysis-error"]', { timeout: 30000 })
  await page.screenshot({ path: path.join(SHOTS, '11-retry-error-state.png') })
  const errText = await page.locator('[data-testid="ai-analysis-error"]').textContent()
  check('Error panel appears on failed analysis', true)
  check('Error panel offers Retry Analysis', /Retry Analysis/i.test(errText))
  check('Exactly 1 failed request so far', apiHits === 1, `hits=${apiHits}`)
  check('Continue blocked while in error state',
    await page.locator('button', { hasText: 'Continue' }).isDisabled())

  // 2) Retry → real request (route now continues)
  await page.getByRole('button', { name: /Retry Analysis/i }).click()
  console.log('  … waiting for real Gemini analysis after retry (up to 180s)')
  await page.waitForSelector('[data-testid="ai-analysis-accepted"]', { timeout: 180000 })
  await page.screenshot({ path: path.join(SHOTS, '12-retry-recovered.png') })

  check('Retry re-fired the request', apiHits >= 2, `hits=${apiHits}`)
  const okText = await page.locator('[data-testid="ai-analysis-accepted"]').textContent()
  check('Recovered to ACCEPTED panel with real confidence', /\d{2,3}%/.test(okText))
  check('Continue enabled after recovery',
    !(await page.locator('button', { hasText: 'Continue' }).isDisabled()))
  check('No unexpected console errors', consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(' | ') || 'clean')
} catch (err) {
  check(`RETRY FLOW CRASH: ${err.message}`, false)
  await page.screenshot({ path: path.join(SHOTS, '13-retry-crash.png') }).catch(() => {})
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.ok)
console.log('\n========== RETRY TEST SUMMARY ==========')
console.log(`TOTAL: ${results.length}  PASS: ${results.length - failed.length}  FAIL: ${failed.length}`)
if (failed.length) {
  failed.forEach((f) => console.log(`  ✗ ${f.name} ${f.detail}`))
  process.exit(1)
}
console.log('ERROR → RETRY → RECOVERY VERIFIED ✅')
