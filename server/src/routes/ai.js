import { Router } from 'express';
import multer from 'multer';
import { isGeminiConfigured, askGeminiVision } from '../services/gemini.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: process.env.VERCEL ? 4 * 1024 * 1024 : 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
});

export const ANALYSIS_PROMPT = `You are a municipal computer-vision auditor for a smart-city pothole reporting system.
Analyze the uploaded image carefully and respond with ONLY a JSON object (no markdown, no prose) using exactly these fields:
{
  "isPothole": true or false,
  "confidence": integer 0-100,
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" or null,
  "defectType": string (e.g. "Pothole", "Rutting", "Cracking", "None"),
  "description": string (professional description of the visible defect, or why no defect is present),
  "environment": string (visible surroundings: road type, structures, vehicles, vegetation, etc.),
  "evidenceQuality": "GOOD" | "FAIR" | "POOR" | "INSUFFICIENT"
}

Rules:
- isPothole=true ONLY if a genuine road surface defect (pothole, hole, severe breaking) is clearly visible.
- Persons, buildings, vehicles, trees, screenshots, normal/intact roads, or unrelated images: isPothole=false.
- Blurry, dark, cropped-to-nothing, or unusable images: isPothole=false and evidenceQuality="INSUFFICIENT".
- confidence = your certainty that this classification (pothole vs not-pothole) is correct, 0-100.
- severity = estimated road-safety severity of the defect when isPothole=true, otherwise null.
- description and environment must be derived ONLY from what is actually visible in this image.
- Never invent details that are not visible.`;

function extractJson(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const EVIDENCE_QUALITIES = ['GOOD', 'FAIR', 'POOR', 'INSUFFICIENT'];

export function buildAnalysisResult(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const confidence = clampInt(parsed.confidence, 0, 100);
  if (confidence === null) return null;

  const isPothole = Boolean(parsed.isPothole);
  const severity = SEVERITIES.includes(String(parsed.severity || '').toUpperCase())
    ? String(parsed.severity).toUpperCase()
    : null;
  const defectType = typeof parsed.defectType === 'string' && parsed.defectType.trim()
    ? parsed.defectType.trim().slice(0, 120)
    : (isPothole ? 'Pothole' : 'None');
  const description = typeof parsed.description === 'string' && parsed.description.trim()
    ? parsed.description.trim().slice(0, 1000)
    : null;
  const environment = typeof parsed.environment === 'string' && parsed.environment.trim()
    ? parsed.environment.trim().slice(0, 1000)
    : null;
  const evidenceQuality = EVIDENCE_QUALITIES.includes(String(parsed.evidenceQuality || '').toUpperCase())
    ? String(parsed.evidenceQuality).toUpperCase()
    : null;

  if (description === null || environment === null || evidenceQuality === null) return null;

  let status;
  let evidenceStatus;
  let message;

  if (isPothole && confidence >= 70) {
    status = 'POTHOLE_DETECTED';
    evidenceStatus = 'ACCEPTED';
    message = `Pothole detected with ${confidence}% confidence. Evidence accepted.`;
  } else if (!isPothole && confidence >= 70) {
    status = 'NO_POTHOLE';
    evidenceStatus = 'INVALID_EVIDENCE';
    message = `No pothole visible (${confidence}% confidence that this is not a road defect). Evidence rejected as INVALID.`;
  } else if (isPothole) {
    status = 'POTHOLE_DETECTED';
    evidenceStatus = 'MANUAL_REVIEW';
    message = `Possible pothole but only ${confidence}% confidence — sent for manual review.`;
  } else {
    status = 'NO_POTHOLE';
    evidenceStatus = 'MANUAL_REVIEW';
    message = `AI could not confirm a pothole (${confidence}% confidence) — sent for manual review.`;
  }

  if (evidenceQuality === 'INSUFFICIENT' && evidenceStatus === 'ACCEPTED') {
    evidenceStatus = 'MANUAL_REVIEW';
    message = `Pothole features seen but image evidence is insufficient — sent for manual review.`;
  }

  return {
    valid: evidenceStatus !== 'INVALID_EVIDENCE',
    status,
    evidenceStatus,
    isPothole,
    confidence,
    severity: isPothole ? (severity || 'MEDIUM') : null,
    defectType,
    description,
    environment,
    evidenceQuality,
    message
  };
}

function errorResponse(res, httpStatus, errorCode, message, extra = {}) {
  return res.status(httpStatus).json({ status: 'ERROR', errorCode, message, ...extra });
}

function uploadSingle(field) {
  return (req, res, next) => {
    memoryUpload.single(field)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
          ? 'Image too large. Maximum size is 10MB.'
          : `Upload error: ${err.message}`;
        return errorResponse(res, 400, 'UPLOAD_ERROR', msg);
      }
      if (err.message?.includes('Invalid file type')) {
        return errorResponse(res, 400, 'INVALID_TYPE', err.message);
      }
      return next(err);
    });
  };
}

const parseThreshold = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : fallback;
};

router.get('/status', (req, res) => {
  res.json({
    service: 'fixmycity-ai-brain',
    geminiConfigured: isGeminiConfigured(),
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    visionService: process.env.AI_SERVICE_URL || 'http://localhost:5001',
    thresholds: {
      verified: parseThreshold(process.env.VERIFICATION_VERIFIED_THRESHOLD, 80),
      manualReview: parseThreshold(process.env.VERIFICATION_MANUAL_THRESHOLD, 60)
    }
  });
});

router.post('/validate-image', uploadSingle('image'), async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'NO_IMAGE', 'Image file is required.');
    }

    if (!isGeminiConfigured()) {
      return errorResponse(
        res,
        503,
        'GEMINI_NOT_CONFIGURED',
        'AI analysis is not configured. Add a Gemini API key to server/.env (GEMINI_API_KEY) or server/.gemini-key, then restart the server.'
      );
    }

    const base64 = req.file.buffer.toString('base64');
    let text;
    try {
      text = await askGeminiVision(ANALYSIS_PROMPT, {
        imageBase64: base64,
        mimeType: req.file.mimetype,
        timeoutMs: 45000
      });
    } catch (err) {
      const code = err.code || 'GEMINI_API_ERROR';
      const httpByCode = {
        GEMINI_NOT_CONFIGURED: 503,
        GEMINI_TIMEOUT: 504,
        GEMINI_RATE_LIMIT: 429,
        GEMINI_NETWORK: 502,
        GEMINI_INVALID_RESPONSE: 502
      };
      const http = httpByCode[code] || 502;
      const clientMessage =
        code === 'GEMINI_TIMEOUT' ? 'AI analysis timed out. Please try again.'
        : code === 'GEMINI_RATE_LIMIT' ? 'AI rate limit exceeded. Please try again shortly.'
        : code === 'GEMINI_NETWORK' ? 'AI analysis is temporarily unavailable due to a network issue. Please try again.'
        : code === 'GEMINI_NOT_CONFIGURED' ? err.message
        : 'AI analysis is temporarily unavailable. Please try again.';
      return errorResponse(res, http, code, clientMessage);
    }

    const parsed = extractJson(text);
    const result = buildAnalysisResult(parsed);
    if (!result) {
      return errorResponse(res, 502, 'GEMINI_INVALID_RESPONSE', 'AI analysis returned an unreadable response. Please try again.');
    }

    return res.json(result);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      const msg = error.code === 'LIMIT_FILE_SIZE'
        ? 'Image too large. Maximum size is 10MB.'
        : `Upload error: ${error.message}`;
      return errorResponse(res, 400, 'UPLOAD_ERROR', msg);
    }
    if (error.message?.includes('Invalid file type')) {
      return errorResponse(res, 400, 'INVALID_TYPE', error.message);
    }
    console.error('validate-image unexpected error:', error);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'AI analysis failed unexpectedly. Please try again.');
  }
});

// ── Dashcam demo (proxy to the modular dashcam/ package in ai-service) ────────
const DASHCAM_AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const DASHCAM_UNAVAILABLE = {
  code: 'DASHCAM_SERVICE_UNAVAILABLE',
  error: 'The dashcam demo service is not running. Start the local AI service (python ai-service/app.py) and retry.'
};

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: process.env.VERCEL ? 4 * 1024 * 1024 : 80 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
      'video/webm', 'video/m4v', 'video/avi'].includes(file.mimetype)
      || /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.originalname || '');
    if (ok) cb(null, true);
    else cb(new Error('Invalid video type. Allowed: MP4, MOV, AVI, MKV, WEBM.'), false);
  }
});

router.get('/dashcam/status', authenticate, async (req, res) => {
  try {
    const response = await fetch(`${DASHCAM_AI_URL}/dashcam/status`);
    const data = await response.json().catch(() => null);
    return res.status(response.status).json(data ?? { ...DASHCAM_UNAVAILABLE });
  } catch {
    return res.status(503).json(DASHCAM_UNAVAILABLE);
  }
});

router.get('/dashcam/annotated/:token', async (req, res) => {
  try {
    const response = await fetch(`${DASHCAM_AI_URL}/dashcam/annotated/${encodeURIComponent(req.params.token)}`);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return res.status(response.status).json(
        data ?? { code: 'NOT_FOUND', error: 'Annotated video not found or expired.' }
      );
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="dashcam-annotated.mp4"');
    return res.send(buffer);
  } catch {
    return res.status(503).json(DASHCAM_UNAVAILABLE);
  }
});

router.post('/dashcam/analyze', authenticate, (req, res) => {
  videoUpload.single('video')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? 'Video too large for this environment.'
        : `Upload error: ${err.message}`;
      return errorResponse(res, 400, 'VIDEO_TOO_LARGE_OR_INVALID', msg);
    }
    if (err) {
      return errorResponse(res, 400, 'UNSUPPORTED_TYPE', err.message);
    }
    if (!req.file) {
      return errorResponse(res, 400, 'NO_VIDEO', 'Video file is required (form field "video").');
    }
    try {
      const form = new FormData();
      form.append(
        'video',
        new Blob([req.file.buffer], { type: req.file.mimetype }),
        req.file.originalname || 'dashcam-upload.mp4'
      );
      for (const [key, value] of Object.entries(req.body || {})) {
        if (typeof value === 'string') form.append(key, value);
      }
      const response = await fetch(`${DASHCAM_AI_URL}/dashcam/analyze`, {
        method: 'POST',
        body: form
      });
      const data = await response.json().catch(() => null);
      return res.status(response.status).json(
        data ?? { code: 'BAD_AI_RESPONSE', error: 'The AI service returned an unreadable response.' }
      );
    } catch {
      return res.status(503).json(DASHCAM_UNAVAILABLE);
    }
  });
});

export default router;
