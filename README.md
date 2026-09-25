# 🕳️ FixMyCity

> **Smart City · Pothole Intelligence** — AI-powered pothole reporting, assignment, and fraud-proof repair verification.

**🟢 Live app: [https://fixmycity-three.vercel.app](https://fixmycity-three.vercel.app)** · **📦 GitHub: [deepsh3969/FixMyCity-1](https://github.com/deepsh3969/FixMyCity-1)**

![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)
![GitHub Repo](https://img.shields.io/github/repo/deepsh3969/FixMyCity-1?logo=github&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-SIFT%20matching-0C7C59?logo=opencv&logoColor=white)
![Hackathon](https://img.shields.io/badge/Hackathon-Project-ff6b6b?logo=devdotto&logoColor=white)

---

## 🎯 The Problem

Citizens hit potholes. Municipalities hear about it late — or never. Contractors claim repairs that never happened. Paperwork, photos in WhatsApp groups, and zero accountability.

**Three broken loops:**

| Who | Pain |
|-----|------|
| 🏛️ **Municipality** | No live picture of road damage; funds spent without proof |
| 👷 **Contractor** | Manual job sheets, no clear assignment flow |
| 🧑‍💼 **Citizen** | Reports vanish into a black hole — “who fixed what?” |

---

## 💡 The Solution

**FixMyCity** closes the loop with three AI-powered gates:

```
Citizen snaps a photo
        │
        ▼
┌───────────────────────┐
│  ① REPORT GATE (Gemini) │  Is it actually a pothole?
│  Accept / Reject / Review│  → blocks fake & junk reports
└───────────┬───────────┘
            ▼
   Municipality assigns contractor
            │
            ▼
┌───────────────────────┐
│  ② PROGRESS TRACKING      │  Start → Repair → Submit proof
└───────────┬───────────┘
            ▼
┌───────────────────────┐
│  ③ PROOF GATE (Gemini +   │  Did they really fix it?
│     SIFT before/after)    │  → blocks fraudulent repairs
└───────────────────────┘
            ▼
   VERIFIED · MANUAL REVIEW · REJECTED
```

**No more “trust me, it’s fixed.”** Every repair carries a scored, explainable verification result.

---

## ✨ Features

### 👨‍💼 Citizen
- 📸 Report a pothole with photo + live GPS location
- 🤖 Instant AI evidence check (real confidence % — no fake 50% fallbacks)
- 📍 Location names on reports (not raw coordinates in your face)
- 📊 Live progress timeline: Reported → Assigned → Repair → Verified
- 🔔 Real-time notifications at every status change

### 🏛️ Municipality
- 🗺️ Command center: all complaints, maps, filters
- 📈 Analytics with status breakdown charts
- 👷 Contractor management & one-click assignment
- 🔍 Verification center with scored AI results + manual override
- ⚖️ Judge Demo — simulate Perfect / Fraudulent / Ambiguous cases

### 👷 Contractor
- 📋 Assignment queue with priorities
- ▶️ Start repair → submit after-photo + GPS as proof
- 🛡️ AI checks the proof photo is a real repaired road (not a random pic)
- 📉 Rejected? Clear reasons + resubmit flow

### 🧠 AI Layer
| Gate | Model / Method | What it does |
|------|----------------|--------------|
| Report validation | **Gemini vision** | Pothole? severity, defect type, evidence quality |
| Repair proof | **Gemini vision** | `REPAIR_VISIBLE` / `NOT_A_REPAIR` / `UNCERTAIN` |
| Before vs after | **OpenCV SIFT** (Flask) | GPS + viewpoint + landmark + scene + pothole match → 0–100 |
| Scoring | Explainable breakdown | Every point traceable to a reason |

**Fraud defenses:**
- Junk repair photos → auto **REJECTED** (Gemini ≥70% confident it’s not a repair)
- Uncertain / fallback scoring → capped to **MANUAL REVIEW** (never fake-auto-verify)
- GPS drift, wrong viewpoint, missing landmarks → measurable score penalties

---

## 🏗️ Architecture

```
┌──────────────┐     REST + JWT      ┌──────────────────┐
│  React SPA   │ ◄─────────────────► │  Express API     │
│  (Vite)      │                     │  auth · CRUD     │
│  :5173       │                     │  :5000           │
└──────────────┘                     └────────┬─────────┘
                                              │
                     ┌────────────────────────┼───────────────────────┐
                     ▼                        ▼                       ▼
            ┌────────────────┐      ┌─────────────────┐     ┌─────────────────┐
            │ MongoDB        │      │ Google Gemini   │     │ Flask AI svc    │
            │ (Memory fallback)│     │ vision API      │     │ SIFT verify     │
            └────────────────┘      └─────────────────┘     │ :5001           │
                                                            └─────────────────┘
```

**Monorepo layout:**

```
FixMyCity/
├── client/          # React 18 + Vite + Tailwind SPA
├── server/          # Express + Mongoose REST API
│   ├── sample-assets/   # seed photos (POTH / repair sets)
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── services/gemini.js
├── ai-service/      # Flask + OpenCV before/after verifier
├── POTH1-4.jpg      # test fixtures (positive)
└── NOPOTH1-4.png    # test fixtures (negative / repaired)
```

---

## 🛠️ Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Leaflet, Lucide |
| Backend | Node.js, Express, Mongoose, JWT auth, Multer |
| Database | MongoDB (local or in-memory auto-fallback) |
| AI | Google Gemini 3.5 Flash (vision), Flask + OpenCV SIFT |
| Testing | Node test runner (20 API tests), Playwright (UI smoke + retry) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+ (for the Flask verifier)
- A **Google AI Studio** API key (free tier works)

### 1️⃣ Backend

```bash
cd server
npm install
# Windows:  copy .env.example .env
# macOS:    cp .env.example .env
# edit .env → set GEMINI_API_KEY (required for AI gates), JWT_SECRET
npm run dev          # http://localhost:5000
```

> MongoDB is optional — if local Mongo isn’t running, the server auto-starts an **in-memory DB** (data resets on restart → re-run seed).

### 2️⃣ Frontend

```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

### 3️⃣ AI verification service (optional but recommended)

```bash
cd ai-service
pip install -r requirements.txt
python app.py         # http://localhost:5001
```

> Without the Flask service, repairs fall back to GPS-only scoring + **manual review** — never silent auto-verify.

### 4️⃣ Seed demo data

```bash
curl -X POST http://localhost:5000/api/seed
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 🧑‍💼 Citizen | `citizen@fixmycity.com` | `password123` |
| 👷 Contractor | `contractor@fixmycity.com` | `password123` |
| 🏛️ Municipal | `municipal@fixmycity.com` | `password123` |

**Try this flow:**
1. Log in as **Municipal** → assign / review complaints
2. Log in as **Contractor** → start a repair, upload `NOPOTH*.png` as proof → watch the AI verdict
3. Upload `POTH*.jpg` as “repair proof” → watch it get **REJECTED** by the proof gate
4. Log in as **Citizen** → see timeline + notifications

---

## ✅ Quality Gates

| Suite | Result |
|-------|--------|
| Server API tests | **20/20** pass (incl. live Gemini POTH / NOPOTH) |
| UI smoke checks | **15/15** pass |
| Retry / error recovery | **8/8** pass |
| Repair proof gate | Positive + negative live-verified |
| Seed photos | 5/5 unique (no duplicate thumbnails) |

---

## 🚀 Live Deployment

| | |
|---|---|
| **App** | [https://fixmycity-three.vercel.app](https://fixmycity-three.vercel.app) |
| **Hosting** | Vercel (frontend + serverless API) |
| **CI/CD** | Every push to `master` auto-deploys |
| **AI vision** | Local `ai-service` (Flask · OpenCV SIFT); dashcam demo shows an honest "service unavailable" state when it isn't running |

---

## 🗺️ API Highlights

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | JWT + cookie auth |
| POST | `/api/complaints` | Report pothole (photo + GPS) |
| POST | `/api/ai/validate-image` | Gemini report gate |
| POST | `/api/complaints/:id/assign` | Assign contractor |
| POST | `/api/contractor/:id/repair-submission` | Proof gate (Gemini + SIFT) |
| GET | `/api/complaints/stats` | Dashboard stats |
| POST | `/api/seed` | Reset demo data |

---

## 🔮 Future Scope

- 🛰️ Satellite / dashcam bulk ingestion for proactive repair planning
- 📱 PWA + offline reporting for low-connectivity areas
- 💰 Repair cost estimation & budget dashboards
- 🗣️ Multilingual citizen reporting (Marathi / Hindi)
- 🔗 On-chain audit trail for municipal spending

---

## 👤 Built By

**Pratik Londhe** — hackathon build, end-to-end: product, full-stack, AI integration, verification design.

*AI proposes. Evidence decides.* 🧠⚡

---

<details>
<summary><b>📁 Repository hygiene</b></summary>

- `.env` / `.gemini-key` are **gitignored** — never commit secrets
- `server/uploads/` is runtime data — regenerate with `POST /api/seed`
- Seed images live in `server/sample-assets/`

</details>
