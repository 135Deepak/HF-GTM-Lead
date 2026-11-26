# HealthFoundry · Healthcare GTM Intelligence Platform

> **Production-grade Go-To-Market (GTM) lead generation, clinical social diagnostic benchmarking, and enterprise consultation intake platform for healthcare leaders.**

[![Astro](https://img.shields.io/badge/Astro-v5.4+-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-v19+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages%20%26%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/pages/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-slate?style=flat-square)](#license)

---

## 📑 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Monorepo Architecture](#monorepo-architecture)
3. [Applications & Packages](#applications--packages)
4. [Key Capabilities & Tools](#key-capabilities--tools)
   - [1. Healthcare Social Media Index](#1-healthcare-social-media-index)
   - [2. Healthcare GTM Consultation Intake](#2-healthcare-gtm-consultation-intake)
   - [3. Executive Design System & Accessibility](#3-executive-design-system--accessibility)
5. [API Routes & Serverless Backends](#api-routes--serverless-backends)
6. [Google Sheets Webhook Setup (Complete Code)](#google-sheets-webhook-setup)
7. [Environment Variables](#environment-variables)
8. [Local Development & Setup](#local-development--setup)
9. [Build & Production Deployment](#build--production-deployment)
10. [Repository Structure](#repository-structure)

---

## 🏥 Platform Overview

HealthFoundry provides clinical intelligence, marketing maturity benchmarks, and strategic growth tooling designed specifically for healthcare systems, hospital networks, physician groups, and digital health innovators.

The platform combines high-converting executive lead funnels with instant diagnostic benchmarking:
- **Zero-Latency In-Browser Diagnostics**: Leaders evaluate their marketing maturity across 6 clinical pillars without server delays.
- **Automated Lead Qualification**: Inbound inquiries are qualified server-side using proprietary healthcare fit scoring algorithms (`leadFit`).
- **Cloudflare Serverless Integration**: Zero-cold-start edge endpoints backed by Cloudflare Workers and Google Sheets automated warehousing.
- **Enterprise Design Standards**: Strict healthcare UI tokens, high-contrast accessible layouts, keyboard accessibility, mobile dropdown navigation, and boardroom-ready reporting.

---

## 🏗️ Monorepo Architecture

The repository supports two operating models:
1. **Independent Micro-Frontend Mode (`apps/*`)**: Each application is decoupled with its own port, dependencies, and Cloudflare Pages deployment target.
2. **Unified Monolithic Mode (`src/`)**: All tools run synchronously on a single unified Astro server (`localhost:4321`) for rapid local development and single-domain hosting.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 HealthFoundry Monorepo                  │
                  └────────────────────────────┬────────────────────────────┘
                                               │
            ┌──────────────────────────────────┼──────────────────────────────────┐
            ▼                                  ▼                                  ▼
   ┌─────────────────┐                ┌─────────────────┐                ┌─────────────────┐
   │  @hf/landing    │                │ @hf/social-score│                │    @hf/lead     │
   │  Port: 4321     │                │ Port: 4322      │                │ Port: 4323      │
   │  Landing Hub    │                │ Diagnostic Tool │                │ Lead Funnel     │
   └────────┬────────┘                └────────┬────────┘                └────────┬────────┘
            │                                  │                                  │
            └──────────────────────────────────┼──────────────────────────────────┘
                                               ▼
                              ┌──────────────────────────────────┐
                              │            @hf/shared            │
                              │  Tokens, Layouts, Components,    │
                              │  Icons, Styles, and Scoring Lib  │
                              └──────────────────────────────────┘
```

---

## 📦 Applications & Packages

| Package | Directory | Default Port | Description |
| :--- | :--- | :--- | :--- |
| **`@hf/landing`** | `apps/landing` | `4321` | Executive gateway, tools directory, capability overviews, and brand foundation. |
| **`@hf/social-score`** | `apps/social-score` | `4322` | Self-assessment benchmark with real-time scoring, radar charts, and audit exports. |
| **`@hf/lead`** | `apps/lead` | `4323` | Targeted consultation intake funnel with dynamic qualification questions. |
| **`@hf/shared`** | `packages/shared` | N/A | Shared design tokens, CSS, Astro layouts, React components, and validation helpers. |
| **Unified Root** | `src/` | `4321` | Standalone unified deployment serving `/`, `/social-score`, and `/lead`. |

---

## 🔬 Key Capabilities & Tools

### 1. Healthcare Social Media Index
- **Route**: `/social-score` (or port `4322`)
- **6 Clinical Evaluation Pillars**:
  1. **Presence**: Verified provider directory listings, multi-location consistency, and claimed clinic maps.
  2. **Cadence**: Weekly posting cadence, clinical education frequency, and physician-led videos.
  3. **Content Quality**: Clinical accuracy, HIPAA compliant storytelling, health literacy compliance.
  4. **Community Engagement**: Response times to patient inquiries, reputation management, review handling.
  5. **Conversion Architecture**: Appointment booking flows, patient portal links, trackable conversions.
  6. **Governance & Compliance**: HIPAA consent documentation, legal disclaimers, crisis escalation policies.
- **Scoring Engine (`scoring.ts`)**:
  - Dynamically weights responses to output an overall maturity score ($0 - 100$).
  - Categorizes organizations into 4 calibrated maturity tiers:
    - `0 - 39`: **Emerging** (Foundational setup required)
    - `40 - 59`: **Operational** (Standard workflows established)
    - `60 - 79`: **Advanced** (High-performing, strategic patient conversion)
    - `80 - 100`: **Leading** (National benchmark, clinical leadership)
- **Reporting & Sharing**:
  - Single-click clipboard summary copy for quick executive sharing.
  - Dedicated **Print / PDF Export** format configured with boardroom-ready executive headers, date stamping, and formal diagnostic ID.

### 2. Healthcare GTM Consultation Intake
- **Route**: `/lead` (or port `4323`)
- **Dynamic Qualification Funnel**:
  - Step 1: Organization classification (*Health System*, *Regional Hospital*, *Specialty Surgery Practice*, *Digital Health / MedTech*, *Diagnostic Network*).
  - Step 2: Scale of operations (*Single Facility*, *2–5 Facilities*, *6–15 Facilities*, *16+ Regional Network*).
  - Step 3: Executive role (*CMO / Physician Executive*, *VP / Director of Marketing*, *C-Suite / Executive Leadership*, *Practice Administrator*).
  - Step 4: Strategic priorities (*Patient Acquisition*, *Provider Authority*, *Reputation Recovery*, *HIPAA Governance*, *Service Line Marketing*).
  - Step 5: Implementation timeline (*Immediate < 30 days*, *Next Quarter*, *Long-term Planning*).
- **Automated Lead Fit Scoring (`leadFit`)**:
  - Server-side algorithm computes lead priority (`High Fit`, `Standard Fit`, `Advisory Review`) based on timeline urgency, facility scale, and executive authority.
- **Strategy Session Reservation**:
  - Lead submission screen provides instant calendar booking slots to lock in 1-on-1 strategy sessions without email delay.

### 3. Executive Design System & Accessibility
- **Clinical Palette**: Authoritative navy slate (`#0f172a`), clinical sky blue (`#0284c7`), crisp white paper surfaces, and hospital-grade border delineation (`1.5px`).
- **Mobile Dropdown Header**: Fully accessible mobile menu toggle with keyboard dismissal (`Escape`), outside click listeners, and fluid backdrop blur.
- **Touch-Friendly Controls**: Touch targets calibrated $\ge 48\text{px}$ and mobile input sizes $\ge 16\text{px}$ to prevent iOS auto-zoom.
- **Theme Support**: First-class light and dark mode toggles with persistent `localStorage` preference.

---

## ⚡ API Routes & Serverless Backends

Both tools connect to dedicated server-side API endpoints running on edge runtimes:

### 1. `POST /api/assessment`
Records completed diagnostic benchmarks.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Dr. Sarah Jenkins",
    "email": "sjenkins@metropolitanhealth.org",
    "company": "Metropolitan Health System",
    "title": "Chief Medical Officer",
    "answers": [3, 2, 3]
  }
  ```
- **Validation**: Enforces organizational email domain validation (`validateOrgEmail`), checks answer integrity against `QUESTIONS`, and computes category scores.
- **Response (200 OK)**:
  ```json
  {
    "ok": true,
    "row": {
      "timestamp": "2026-11-26T10:30:00.000Z",
      "kind": "assessment",
      "name": "Dr. Sarah Jenkins",
      "email": "sjenkins@metropolitanhealth.org",
      "company": "Metropolitan Health System",
      "title": "Chief Medical Officer",
      "score": 78,
      "band": "Advanced",
      "sheet": "Assessments",
      "rowNumber": 142
    },
    "recordedToSheet": true
  }
  ```

### 2. `POST /api/lead`
Records consultation intake inquiries and computes qualification fit.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Marcus Vance",
    "email": "m.vance@valleysurgery.com",
    "company": "Valley Surgical Associates",
    "title": "Managing Director",
    "orgType": "specialty-practice",
    "facilities": "2-5",
    "role": "c-suite",
    "priorities": ["patient-acquisition", "service-line"],
    "timeline": "immediate",
    "challenge": "Patient volume acquisition for new orthopedic wing",
    "socialScore": "64"
  }
  ```
- **Validation**: Validates business email, checks answers against `LEAD_STEPS`, and runs server-side `leadFit()`.
- **Response (200 OK)**:
  ```json
  {
    "ok": true,
    "row": {
      "timestamp": "2026-11-26T10:32:00.000Z",
      "kind": "lead",
      "name": "Marcus Vance",
      "email": "m.vance@valleysurgery.com",
      "company": "Valley Surgical Associates",
      "fit": "High Fit",
      "sheet": "Leads",
      "rowNumber": 89
    },
    "recordedToSheet": true
  }
  ```

---

## 📊 Google Sheets Webhook Setup

The API endpoints forward validated payloads to a serverless Google Apps Script webhook that appends rows to a centralized Google Spreadsheet.

### Complete Google Apps Script (`Code.gs`)
Open your Google Sheet, navigate to **Extensions > Apps Script**, paste the code below, and deploy:

```javascript
/**
 * HealthFoundry GTM Lead & Assessment Ingestion Webhook
 * Automatically routes and records incoming payloads to "Assessments" and "Leads" tabs.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 30-second lock to prevent concurrent write collisions
    lock.waitLock(30000);
    
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ result: "error", error: "Empty POST body" }, 400);
    }
    
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var kind = data.kind || "lead";
    
    if (kind === "assessment") {
      return recordAssessment(ss, data);
    } else {
      return recordLead(ss, data);
    }
  } catch (err) {
    return jsonResponse({ result: "error", error: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

function recordAssessment(ss, data) {
  var sheet = ss.getSheetByName("Assessments");
  if (!sheet) {
    sheet = ss.insertSheet("Assessments");
    sheet.appendRow([
      "Timestamp", "Name", "Email", "Organization", "Title",
      "Score", "Maturity Band", "Answers", "Raw JSON"
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold");
  }
  
  var row = [
    data.timestamp || new Date().toISOString(),
    data.name || "",
    data.email || "",
    data.company || "",
    data.title || "",
    data.score || "",
    data.band || "",
    data.answers || "",
    JSON.stringify(data)
  ];
  
  sheet.appendRow(row);
  var rowNumber = sheet.getLastRow();
  
  return jsonResponse({
    result: "success",
    sheet: "Assessments",
    rowNumber: rowNumber
  });
}

function recordLead(ss, data) {
  var sheet = ss.getSheetByName("Leads");
  if (!sheet) {
    sheet = ss.insertSheet("Leads");
    sheet.appendRow([
      "Timestamp", "Name", "Email", "Organization", "Title",
      "Org Type", "Facilities", "Role", "Priorities",
      "Timeline", "Fit Score", "Social Score", "Challenge", "Raw JSON"
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 14).setFontWeight("bold");
  }
  
  var row = [
    data.timestamp || new Date().toISOString(),
    data.name || "",
    data.email || "",
    data.company || "",
    data.title || "",
    data.orgType || "",
    data.facilities || "",
    data.role || "",
    data.priorities || "",
    data.timeline || "",
    data.fit || "",
    data.socialScore || "",
    data.challenge || "",
    JSON.stringify(data)
  ];
  
  sheet.appendRow(row);
  var rowNumber = sheet.getLastRow();
  
  return jsonResponse({
    result: "success",
    sheet: "Leads",
    rowNumber: rowNumber
  });
}

function jsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
```

### Deployment Steps:
1. In Apps Script, click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Set **Execute as**: `Me (your email)`.
4. Set **Who has access**: `Anyone` *(essential so Cloudflare Workers can POST without OAuth friction)*.
5. Click **Deploy** and copy the **Web app URL**.
6. Paste the URL into your `.env` as `GOOGLE_SHEETS_WEBHOOK_URL`.

---

## 🔐 Environment Variables

Create `.env` files in root and workspace directories following `.env.example`:

### Root `.env` (Unified Mode)
```ini
# Google Apps Script Webhook URL (Required for lead & assessment ingestion)
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

### `apps/landing/.env`
```ini
PUBLIC_SOCIAL_SCORE_URL="http://localhost:4322"
PUBLIC_LEAD_URL="http://localhost:4323"
```

### `apps/social-score/.env`
```ini
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
PUBLIC_LANDING_URL="http://localhost:4321"
PUBLIC_LEAD_URL="http://localhost:4323"
```

### `apps/lead/.env`
```ini
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
PUBLIC_LANDING_URL="http://localhost:4321"
PUBLIC_SOCIAL_SCORE_URL="http://localhost:4322"
```

> **Note on Cloudflare Production**: Server secrets like `GOOGLE_SHEETS_WEBHOOK_URL` must be set in the Cloudflare Dashboard under **Pages/Workers > Settings > Environment variables**.

---

## 💻 Local Development & Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (monorepo specifies `engines: { node: ">=22.23.4" }`)
- **npm**: `v10.x+` (with npm workspaces support)

### Installation
```bash
git clone https://github.com/135Deepak/HF-GTM-Lead.git
cd HF-GTM-Lead
npm install
```

### 1. Running in Unified Monolith Mode
Runs all routes (`/`, `/social-score`, `/lead`) on port `4321`:
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### 2. Running Micro-Frontend Apps Separately
To develop individual apps on their respective standalone ports:

```bash
# Terminal 1: Landing Hub (Port 4321)
npm run dev:landing

# Terminal 2: Social Media Diagnostic (Port 4322)
npm run dev:score

# Terminal 3: Lead Intake Funnel (Port 4323)
npm run dev:lead
```

---

## 🚀 Build & Production Deployment

### Production Compilation
```bash
# Build unified root application
npm run build

# Build individual micro-frontend workspaces
npm run build:landing
npm run build:score
npm run build:lead
```

### Cloudflare Deployment
Each workspace output (`dist/`) is pre-configured with `@astrojs/cloudflare` adapter for zero-configuration Cloudflare Pages deployment:

1. **Via Cloudflare Git Integration (Recommended)**:
   - Connect repository in Cloudflare Dashboard.
   - For unified deployment:
     - Framework preset: `Astro`
     - Build command: `npm run build`
     - Build output directory: `dist`
2. **Via Wrangler CLI**:
   ```bash
   npx wrangler pages deploy dist --project-name=hf-gtm-platform
   ```

---

## 📂 Repository Structure

```text
HF-GTM-Lead/
├── apps/
│   ├── landing/                    # @hf/landing application
│   │   ├── src/
│   │   │   └── pages/index.astro   # Main landing portal
│   │   ├── package.json
│   │   └── astro.config.mjs
│   ├── social-score/               # @hf/social-score application
│   │   ├── src/
│   │   │   ├── components/         # SocialScoreAssessment React UI
│   │   │   └── pages/
│   │   │       ├── api/assessment.ts # Serverless assessment ingestion
│   │   │       └── index.astro
│   │   ├── package.json
│   │   └── astro.config.mjs
│   └── lead/                       # @hf/lead application
│       ├── src/
│       │   ├── components/         # LeadForm React multi-step intake
│       │   └── pages/
│       │       ├── api/lead.ts     # Serverless lead intake & scoring
│       │       └── index.astro
│       ├── package.json
│       └── astro.config.mjs
├── packages/
│   └── shared/                     # @hf/shared package
│       ├── src/
│       │   ├── components/         # Header, Footer, IconSprite
│       │   ├── layouts/            # MainLayout.astro
│       │   ├── lib/                # scoring.ts, leadQuestions.ts, validateEmail.ts
│       │   ├── styles/             # global.css, responsive.css
│       │   └── assets/             # Brand logos & icons
│       └── package.json
├── src/                            # Unified fallback monolith architecture
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   └── styles/
├── public/                         # Static assets, logos, and fonts
├── .env.example                    # Global environment template
├── astro.config.mjs                # Root Astro Cloudflare configuration
├── package.json                    # Monorepo workspaces manifest
├── tsconfig.json                   # Shared TypeScript compiler config
└── README.md                       # Comprehensive platform documentation
```

---

## 📄 License

Proprietary and confidential. Developed for **HealthFoundry Applied Intelligence Platforms**. All rights reserved.
