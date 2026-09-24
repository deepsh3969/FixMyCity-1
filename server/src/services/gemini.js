/**
 * Gemini AI brain integration.
 * Set GEMINI_API_KEY in server/.env (or environment).
 * Endpoint used by municipal AI insights once key is provided.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getKeyFilePath() {
  return process.env.GEMINI_KEY_FILE || path.join(__dirname, '../../.gemini-key');
}

export function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    const keyFile = getKeyFilePath();
    if (fs.existsSync(keyFile)) {
      const key = fs.readFileSync(keyFile, 'utf8')
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(line => line && !line.startsWith('#'));
      if (key) return key;
    }
  } catch {
    // ignore
  }
  return null;
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

export async function askGemini(prompt, { systemInstruction } = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error('Gemini API key not configured');
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: String(prompt) }] }]
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: String(systemInstruction) }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Gemini request failed: ${response.status}`);
    err.code = 'GEMINI_REQUEST_FAILED';
    err.detail = text;
    throw err;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';
  return { text, raw: data };
}

function geminiErrorFromStatus(status, detail) {
  const err = new Error(
    status === 429
      ? 'AI rate limit exceeded. Please try again shortly.'
      : `Gemini request failed with status ${status}.`
  );
  err.code = status === 429 ? 'GEMINI_RATE_LIMIT' : 'GEMINI_API_ERROR';
  err.detail = detail;
  err.status = status;
  return err;
}

/**
 * Send a text prompt + inline image to Gemini, expecting a JSON text reply.
 * Throws typed errors: GEMINI_NOT_CONFIGURED, GEMINI_TIMEOUT,
 * GEMINI_NETWORK, GEMINI_RATE_LIMIT, GEMINI_API_ERROR.
 */
export async function askGeminiVision(prompt, { imageBase64, mimeType = 'image/jpeg', timeoutMs = 30000, systemInstruction } = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error('Gemini API key not configured. Add GEMINI_API_KEY to server/.env or a key line in server/.gemini-key.');
    err.code = 'GEMINI_NOT_CONFIGURED';
    throw err;
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts = [{ text: String(prompt) }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: String(systemInstruction) }] };
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxAttempts = 3;
  let lastErr = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      if (fetchErr?.name === 'AbortError' || controller.signal.aborted) {
        lastErr = new Error('AI analysis timed out. Please try again.');
        lastErr.code = 'GEMINI_TIMEOUT';
      } else {
        lastErr = new Error('Network failure while contacting the AI service.');
        lastErr.code = 'GEMINI_NETWORK';
        lastErr.detail = fetchErr?.message;
      }
      if (attempt < maxAttempts) {
        await sleep(attempt * 1500);
        continue;
      }
      throw lastErr;
    }
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';
      if (!text) {
        const err = new Error('AI analysis returned an empty response. Please try again.');
        err.code = 'GEMINI_INVALID_RESPONSE';
        throw err;
      }
      return text;
    }

    const detail = await response.text().catch(() => '');
    const err = geminiErrorFromStatus(response.status, detail);
    const transient = [429, 500, 502, 503].includes(response.status);
    if (transient && attempt < maxAttempts) {
      lastErr = err;
      let delay = attempt * 1500;
      if (response.status === 429) {
        const retryMatch = /retry in ([\d.]+)s/i.exec(detail);
        delay = retryMatch
          ? Math.min(Math.ceil(Number(retryMatch[1])), 70) * 1000
          : attempt * 15000;
      } else if (response.status >= 500) {
        delay = attempt * 5000;
      }
      await sleep(delay);
      continue;
    }
    throw err;
  }

  throw lastErr || Object.assign(new Error('AI analysis is temporarily unavailable. Please try again.'), { code: 'GEMINI_API_ERROR' });
}

export const REPAIR_PROOF_PROMPT = `You are a strict municipal quality auditor checking a contractor's "after repair" submission photo for a road/pothole complaint.

Decide whether this photo genuinely shows COMPLETED repair work on a road surface:
- isRepairProof=true ONLY if the photo shows a repaired road: filled/smooth asphalt patch, fresh pavement, sealed surface, or an obviously fixed road section with NO open pothole, cavity, or active damage in the main subject.
- isRepairProof=false if the photo shows: an open/damaged pothole, water-filled cavity, crumbling damaged road, a random unrelated object/scene, a person, an indoor scene, a screenshot, or anything that is clearly NOT a completed road repair.
- Judge only the main subject of the photo.

Reply with ONLY raw JSON, no markdown:
{"isRepairProof": true|false, "confidence": 0-100, "notes": "one short sentence explaining what is visible"}`;

function parseRepairJson(text) {
  const match = String(text).replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

const UPLOADS_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const mimeFromPath = (p) => {
  const ext = path.extname(p).toLowerCase();
  return ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
};

async function fetchImageBuffer(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    const mimeType = ct.includes('png') ? 'image/png'
      : ct.includes('webp') ? 'image/webp'
      : ct.startsWith('image/') ? mimeFromPath(url)
      : mimeFromPath(url);
    return { base64: buf.toString('base64'), mimeType };
  } catch {
    return null;
  }
}

// Accepts an http(s) URL (Vercel Blob), a /uploads/... path, or an absolute disk path.
async function loadImageRef(ref) {
  if (!ref) return null;
  if (/^https?:\/\//i.test(ref)) return fetchImageBuffer(ref);
  if (ref.startsWith('/uploads/')) {
    const disk = path.join(UPLOADS_ROOT, path.basename(ref));
    if (fs.existsSync(disk)) {
      return { base64: fs.readFileSync(disk).toString('base64'), mimeType: mimeFromPath(disk) };
    }
    // Serverless: sample/seed images are served as static files from the site root.
    if (process.env.VERCEL_URL) {
      return fetchImageBuffer(`https://${process.env.VERCEL_URL}${ref}`);
    }
    return null;
  }
  if (fs.existsSync(ref)) {
    return { base64: fs.readFileSync(ref).toString('base64'), mimeType: mimeFromPath(ref) };
  }
  return null;
}

/**
 * Gemini check that a submitted repair-proof image actually shows completed repair work.
 * Never throws — returns { verdict, confidence, notes }.
 * verdict: REPAIR_VISIBLE | NOT_A_REPAIR | UNCERTAIN | SKIPPED
 */
export async function checkRepairProof(imageRef) {
  const skipped = (notes) => ({ verdict: 'SKIPPED', confidence: 0, notes });
  try {
    if (!isGeminiConfigured()) return skipped('Gemini not configured');

    const image = await loadImageRef(imageRef);
    if (!image) return skipped('Repair image not found');

    const text = await askGeminiVision(REPAIR_PROOF_PROMPT, { imageBase64: image.base64, mimeType: image.mimeType, timeoutMs: 30000 });
    const parsed = parseRepairJson(text);
    if (!parsed || typeof parsed.isRepairProof !== 'boolean') {
      return skipped('AI returned an unparseable response');
    }

    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0));
    const notes = String(parsed.notes || '').slice(0, 500);

    if (confidence < 70) {
      return { verdict: 'UNCERTAIN', confidence, notes };
    }
    return {
      verdict: parsed.isRepairProof ? 'REPAIR_VISIBLE' : 'NOT_A_REPAIR',
      confidence,
      notes
    };
  } catch (e) {
    return skipped(e.message || 'AI check failed');
  }
}
