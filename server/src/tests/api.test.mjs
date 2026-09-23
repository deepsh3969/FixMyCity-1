import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-only';

const { app } = await import('../index.js');
const { default: request } = await import('supertest');
const mongoose = (await import('mongoose')).default;
const { MongoMemoryServer } = await import('mongodb-memory-server');
const { User, Complaint, Notification } = await import('../models/index.js');
const { buildAnalysisResult } = await import('../routes/ai.js');
const { isGeminiConfigured } = await import('../services/gemini.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POTH_IMAGE = path.join(__dirname, '../../../POTH1.jpg');
const NOPOTH_IMAGE = path.join(__dirname, '../../../NOPOTH4.png');
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let mongod;
let token;
let citizenId;
let contractorId;
let municipalId;
let complaintId;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const password = 'password123';
  const citizen = await User.create({ name: 'Aarav Sharma', email: 'citizen@test.com', password, role: 'citizen' });
  const contractor = await User.create({ name: 'Ramesh Gupta', email: 'contractor@test.com', password, role: 'contractor' });
  const municipal = await User.create({ name: 'TMC Ward Officer', email: 'municipal@test.com', password, role: 'municipal' });
  citizenId = citizen._id.toString();
  contractorId = contractor._id.toString();
  municipalId = municipal._id.toString();
});

test.after(async () => {
  try {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  } finally {
    if (mongod) {
      await mongod.stop();
    }
  }
});

test('health endpoint', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('ai status endpoint', async () => {
  const res = await request(app).get('/api/ai/status');
  assert.equal(res.status, 200);
  assert.equal(res.body.service, 'fixmycity-ai-brain');
  assert.equal(typeof res.body.geminiConfigured, 'boolean');
});

test('login as citizen', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@test.com', password: 'password123' });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.role, 'citizen');
  assert.ok(res.body.token);
  token = res.body.token;
});

test('reject invalid credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@test.com', password: 'wrong' });
  assert.equal(res.status, 401);
});

test('me returns user', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'citizen@test.com');
});

test('contractors endpoint requires municipal', async () => {
  const asCitizen = await request(app)
    .get('/api/complaints/contractors')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(asCitizen.status, 403);

  const municipalLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'municipal@test.com', password: 'password123' });
  const mToken = municipalLogin.body.token;

  const res = await request(app)
    .get('/api/complaints/contractors')
    .set('Authorization', `Bearer ${mToken}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.contractors));
  assert.ok(res.body.contractors.some(c => c.email === 'contractor@test.com'));
});

test('notifications list works with auth', async () => {
  const res = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.notifications));
  assert.equal(typeof res.body.unreadCount, 'number');
});

test('unauthenticated complaints my rejected', async () => {
  const res = await request(app).get('/api/complaints/my');
  assert.equal(res.status, 401);
});

test('municipal stats endpoint', async () => {
  const municipalLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'municipal@test.com', password: 'password123' });
  const res = await request(app)
    .get('/api/complaints/stats')
    .set('Authorization', `Bearer ${municipalLogin.body.token}`);
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.totalComplaints, 'number');
});

test('validate-image: missing file returns 400', async () => {
  const res = await request(app).post('/api/ai/validate-image');
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'NO_IMAGE');
});

test('validate-image: invalid file type returns 400', async () => {
  const res = await request(app)
    .post('/api/ai/validate-image')
    .attach('image', Buffer.from('%PDF-1.4 fake'), { filename: 'doc.pdf', contentType: 'application/pdf' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'INVALID_TYPE');
});

test('validate-image: oversized file returns 400', async () => {
  const big = Buffer.alloc(11 * 1024 * 1024, 0);
  const res = await request(app)
    .post('/api/ai/validate-image')
    .attach('image', big, { filename: 'big.png', contentType: 'image/png' });
  assert.equal(res.status, 400);
  assert.equal(res.body.errorCode, 'UPLOAD_ERROR');
});

test('validate-image: unconfigured key returns 503 config error, never fake scores', async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  const prevKeyFile = process.env.GEMINI_KEY_FILE;
  process.env.GEMINI_API_KEY = '';
  process.env.GEMINI_KEY_FILE = path.join(__dirname, 'definitely-missing-key-file');
  try {
    const res = await request(app)
      .post('/api/ai/validate-image')
      .attach('image', TINY_PNG, { filename: 't.png', contentType: 'image/png' });
    assert.equal(res.status, 503);
    assert.equal(res.body.errorCode, 'GEMINI_NOT_CONFIGURED');
    assert.equal(res.body.confidence, undefined);
    assert.equal(res.body.valid, undefined);
  } finally {
    if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevKey;
    if (prevKeyFile === undefined) delete process.env.GEMINI_KEY_FILE;
    else process.env.GEMINI_KEY_FILE = prevKeyFile;
  }
});

test('buildAnalysisResult: confident pothole → ACCEPTED', () => {
  const r = buildAnalysisResult({
    isPothole: true,
    confidence: 87,
    severity: 'HIGH',
    defectType: 'Pothole',
    description: 'Large water-filled pothole in cracked asphalt.',
    environment: 'Urban road surface close-up.',
    evidenceQuality: 'GOOD'
  });
  assert.ok(r);
  assert.equal(r.valid, true);
  assert.equal(r.status, 'POTHOLE_DETECTED');
  assert.equal(r.evidenceStatus, 'ACCEPTED');
  assert.equal(r.confidence, 87);
  assert.equal(r.severity, 'HIGH');
});

test('buildAnalysisResult: confident non-pothole → INVALID_EVIDENCE', () => {
  const r = buildAnalysisResult({
    isPothole: false,
    confidence: 92,
    severity: null,
    defectType: 'None',
    description: 'Normal intact road surface, no defect visible.',
    environment: 'Rural road with utility covers.',
    evidenceQuality: 'GOOD'
  });
  assert.ok(r);
  assert.equal(r.valid, false);
  assert.equal(r.status, 'NO_POTHOLE');
  assert.equal(r.evidenceStatus, 'INVALID_EVIDENCE');
  assert.equal(r.severity, null);
});

test('buildAnalysisResult: low-confidence pothole → MANUAL_REVIEW', () => {
  const r = buildAnalysisResult({
    isPothole: true,
    confidence: 55,
    severity: 'MEDIUM',
    defectType: 'Pothole',
    description: 'Possible shallow defect.',
    environment: 'Road surface.',
    evidenceQuality: 'FAIR'
  });
  assert.ok(r);
  assert.equal(r.valid, true);
  assert.equal(r.evidenceStatus, 'MANUAL_REVIEW');
});

test('buildAnalysisResult: missing/malformed fields → null (never fabricated)', () => {
  assert.equal(buildAnalysisResult(null), null);
  assert.equal(buildAnalysisResult({ isPothole: true }), null);
  assert.equal(buildAnalysisResult({ isPothole: true, confidence: 'high', description: 'x', environment: 'y', evidenceQuality: 'GOOD' }), null);
});

test('buildAnalysisResult: INSUFFICIENT evidence downgrades ACCEPTED → MANUAL_REVIEW', () => {
  const r = buildAnalysisResult({
    isPothole: true,
    confidence: 80,
    severity: 'HIGH',
    defectType: 'Pothole',
    description: 'Blurry possible defect.',
    environment: 'Unknown.',
    evidenceQuality: 'INSUFFICIENT'
  });
  assert.ok(r);
  assert.equal(r.evidenceStatus, 'MANUAL_REVIEW');
});

test('validate-image LIVE: POTH1 detected as pothole', { skip: !isGeminiConfigured() }, async () => {
  const res = await request(app)
    .post('/api/ai/validate-image')
    .attach('image', POTH_IMAGE, { filename: 'POTH1.jpg', contentType: 'image/jpeg' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.isPothole, true);
  assert.equal(res.body.status, 'POTHOLE_DETECTED');
  assert.ok(res.body.confidence >= 0 && res.body.confidence <= 100);
  assert.ok(res.body.description && res.body.description.length > 10);
});

test('validate-image LIVE: NOPOTH4 rejected as non-pothole', { skip: !isGeminiConfigured() }, async () => {
  await new Promise((r) => setTimeout(r, 60000));
  const res = await request(app)
    .post('/api/ai/validate-image')
    .attach('image', NOPOTH_IMAGE, { filename: 'NOPOTH4.png', contentType: 'image/png' });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.body.isPothole, false);
  assert.equal(res.body.status, 'NO_POTHOLE');
  assert.equal(res.body.valid, false);
  assert.equal(res.body.evidenceStatus, 'INVALID_EVIDENCE');
});
