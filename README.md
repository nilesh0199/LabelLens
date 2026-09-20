# LabelLens: Legal Metrology Regulatory Enforcement & Compliance Platform

<div align="center">

[![SIH 2026](https://img.shields.io/badge/SIH_2026-Problem_SIH26034-0052CC.svg?style=for-the-badge&logo=target&logoColor=white)](https://www.sih.gov.in/)
[![Ministry](https://img.shields.io/badge/Ministry-Department_of_Consumer_Affairs-FF9933.svg?style=for-the-badge)](https://consumeraffairs.nic.in/)
[![Framework](https://img.shields.io/badge/Framework-Next.js_14-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E.svg?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![OCR Engine](https://img.shields.io/badge/Vision_AI-Google_Cloud_Vision-4285F4.svg?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/vision)
[![LLM Engine](https://img.shields.io/badge/Reasoning-Gemini_2.0_Flash-8E75C2.svg?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Dossiers](https://img.shields.io/badge/Statutory_Audit-PDF_Lib-E02424.svg?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://pdf-lib.js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>An AI-powered regulatory inspection and statutory compliance verification system for Indian retail packaged commodities under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011.</strong>
</p>

[Quick Start](#-quick-start-guide) • [Architecture](#-system-architecture--data-flow) • [Rule 6 Compliance](#-rule-6-statutory-declarations-monitored) • [Demo Credentials](#-demo-credentials--test-roles) • [Documentation Index](#-documentation-index)

</div>

---

## 📌 Executive Summary & Problem Context

In Indian retail environments, millions of pre-packaged commodities are sold daily across diverse retail chains and local kirana stores. Verifying statutory declarations—such as Maximum Retail Price (MRP), Net Quantity, Unit Sale Price (USP), Best Before dates, and Manufacturer premises—has traditionally been a manual, slow, and error-prone process for field **Legal Metrology Officers (LMOs)**.

Developed for the **Smart India Hackathon 2026 (Problem Statement SIH26034)** for the **Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India**, **LabelLens** transforms manual enforcement into an automated, two-tier regulatory platform:
1. **On-Site Field Inspection**: Equips field inspectors with a guided mobile scanner that captures multi-angle label images, extracts statutory declarations in real time using computer vision and LLM reasoning, and scores compliance instantly.
2. **Judicial Adjudication & Ledger**: Provides Senior Reviewing Officers / Assistant Controllers with a command workbench for evidence audit, verdict compounding, Section 36 penalty calculation, and generation of tamper-evident statutory Form II violation notices.

---

## ⚡ Core Capabilities & Innovations

- **📱 Guided Multi-Angle Mobile Scanner**: Sequential photographic workflow (Front Principal Display Panel, Back Info Panel, and Side Panels) with real-time blur detection, targeting reticles, and fallback crop utilities.
- **👁️ Dual Vision-LLM Intelligence**: Pairs **Google Cloud Vision API** (`DOCUMENT_TEXT_DETECTION`) for micro-print and curved packaging typography with **Google Gemini 2.0 Flash (`gemini-2.0-flash`)** for semantic synthesis across package angles and fuzzy brand resolution.
- **⚖️ Deterministic Statutory Compliance Engine**: Programmatic verification of all 10 mandatory declarations under Rule 6 of the PC Rules, 2011, preventing LLM hallucinations with strict deterministic rules.
- **🏷️ Standardized Exemption Handling**: Plain text **`"Not Applicable"`** rendering for conditionally exempt declarations (Country of Origin for domestic goods, Unit Sale Price for single-unit items, and Dimensions for weight/volume goods) across Inspector, Officer, and PDF reports.
- **🏛️ Senior Officer Judicial Command Center**: Complete review queue management, multi-angle visual inspection, 4 statutory determination actions (*Approve As-Is*, *Override Verdict*, *Send Back for Recapture*, *Correct & Remark*), and Section 36 penalty compounding calculations.
- **📄 Tamper-Evident Statutory Audit Dossiers (`pdf-lib`)**: Serverless generation of Form II Violation Notices, Single-Item Inspection Certificates, and Multi-Item Aggregate Batch Dossiers complete with photographic evidence and digital audit logs.
- **🛡️ Secure Role-Based Access Control (RBAC)**: Enforced separation between Field Inspectors (`inspector`) and Senior Reviewing Officers (`officer`).

---

## 🛠️ Technology Stack

| Domain | Technology | Role & Implementation Details |
| :--- | :--- | :--- |
| **Framework & API** | **Next.js 14.2 (App Router, TypeScript)** | Serverless Next.js API route handlers (`app/api/`) executing batch lifecycles, adjudication, and statutory reports. |
| **Frontend Runtime** | **HTML5, Vanilla ES6+, CSS3** | High-performance PWA with zero framework overhead, mobile viewport locking (`375px–430px`), and archival paper styling (`#FCFBF7`). |
| **Database & Storage** | **Supabase (PostgreSQL 15+ & Storage)** | Relational schema for inspection sessions, specimens, and adjudications; S3-compatible cloud bucket (`specimen-photos`) for evidence photos. |
| **Computer Vision / OCR**| **Google Cloud Vision API** | `DOCUMENT_TEXT_DETECTION` optimized for micro-print statutory declarations down to 1.0mm font sizes. |
| **Generative AI / LLM** | **Google Gemini 3.7 Flash** | Synthesizes multi-angle OCR transcripts, resolves bilingual declarations (Hindi/English), and structures field boundaries. |
| **Rules Engine** | **TypeScript Engine (`src/lib/compliance.ts`)** | Programmatic implementation of Legal Metrology (Packaged Commodities) Rules, 2011 and Section 36 penalty schedules. |
| **Dossier Generation** | **`pdf-lib` (Pure TypeScript/JavaScript)** | Generates tamper-evident PDF inspection certificates and Form II notices on the fly without heavy browser dependencies. |
| **Hosting & CDN** | **Vercel** | Edge network with clean URLs and native Next.js serverless execution. |

---

## 📋 Rule 6 Statutory Declarations Monitored

Under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, pre-packaged commodities must display:

| # | Statutory Clause | Required Declaration | Verification Criteria & Exemption Rule |
| :-: | :--- | :--- | :--- |
| **1** | Rule 6(1)(a) | **Manufacturer / Packer / Importer** | Complete legal name and physical address including PIN code. Mandatory for all packages. |
| **2** | Rule 6(1)(aa) | **Country of Origin** | Mandatory for imported goods. Conditionally exempt for domestic products (displays as **`Not Applicable`**). |
| **3** | Rule 6(1)(b) | **Common / Generic Name** | Recognizable generic name of the commodity contained in the package. |
| **4** | Rule 6(1)(c) | **Net Quantity** | Net weight, volume, or count in standard metric units (g, kg, ml, l, units). |
| **5** | Rule 6(1)(d) | **Month & Year of Manufacture** | Month and year of manufacture, packing, or import (e.g., `03/2026`). |
| **6** | Rule 6(1)(da) | **Best Before / Expiry Date** | Expiry date for perishable commodities, cosmetics, and packaged food items. |
| **7** | Rule 6(1)(e) | **Maximum Retail Price (MRP)** | Retail price inclusive of all taxes in format `₹ XX.XX (Incl. of all taxes)`. |
| **8** | Rule 6(1)(h) | **Unit Sale Price (USP)** | Price per g, kg, ml, l, or piece. Conditionally exempt for Net Qty = 1 unit (displays as **`Not Applicable`**). |
| **9** | Rule 6(1)(n) | **Dimensions of Commodity** | Linear dimensions (L x W x H). Conditionally exempt for commodities sold by weight/volume (displays as **`Not Applicable`**). |
| **10** | Rule 6(1)(f) | **Consumer Care Details** | Name, address, telephone number, and email address for consumer grievance redressal. |

---

## 🔄 Two-Tier Inspection & Adjudication Lifecycle

```
               FIELD INSPECTION (MOBILE LMO)
                             │
                             ├─ 1. Establish On-Site Retail Batch (Store Name, Location/GPS)
                             ├─ 2. Multi-Angle Package Capture (Front PDP, Back Panel, Side Panels)
                             ├─ 3. AI Pipeline: Cloud Vision OCR + Gemini 2.0 Flash Extraction
                             ├─ 4. Inspect & Edit Declarations in Manifest Editor
                             └─ 5. Submit Batch Dossier ──────────────────────────────┐
                                                                                     │
                                                                                     ▼
                                                                     JUDICIAL ADJUDICATION (SENIOR OFFICER)
                                                                                     │
                                                                                     ├─ 1. Receive Batch at Top of Review Queue
                                                                                     ├─ 2. Side-by-Side Visual & Rule 6 Audit
                                                                                     ├─ 3. Judicial Determination:
                                                                                     │     ├─ Approve As-Is (Endorse findings)
                                                                                     │     ├─ Override Verdict (with judicial reason)
                                                                                     │     ├─ Send Back for Recapture (alert inspector)
                                                                                     │     └─ Correct & Remark (edit misreads)
                                                                                     ├─ 4. Compute Section 36 Compounding Penalties
                                                                                     └─ 5. Issue Tamper-Evident Statutory PDF Dossiers
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.18.0 or later (v20+ LTS recommended)
- **npm**: v9.0.0 or later (bundled with Node.js)
- Camera-enabled device or modern browser (Chrome, Edge, Safari) with camera permissions

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/labellens.git
cd labellens
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the environment template:
```bash
cp .env.example .env.local
```

Populate `.env.local` with your service keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Vision & Reasoning Keys
GEMINI_API_KEY=your-google-gemini-api-key
GOOGLE_VISION_API_KEY=your-google-cloud-vision-api-key

# Feature Flags
USE_VISION_API=true
```

### 4. Run the Local Development Server
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** to access the landing screen and authentication portal.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 👥 Demo Credentials & Test Roles

The platform provides pre-configured jurisdictional roles to evaluate the complete two-tier enforcement workflow:

| Role | Portal / Route | Username | Password | Assigned Profile & Jurisdiction |
| :--- | :--- | :--- | :--- | :--- |
| **Field Inspector** | `/inspector.html` | `inspector` | `password123` | LMO Rajesh Kumar (`LMO-DL-04`), North Delhi Zone |
| **Reviewing Officer** | `/officer.html` | `officer` | `password123` | Dr. S. K. Sharma (`AD-CTRL-DL-02`), Assistant Controller, Delhi HQ |
| **System Admin** | `/login.html` | `admin` | `admin123` | Central Administration & Audit Controller |

---

## 📂 Project Structure

```text
.
├── app/                        # Next.js 14 App Router & Serverless API Routes
│   ├── api/                    # API Route Handlers
│   │   ├── analyze-item/       # Direct image OCR & AI declaration extraction
│   │   ├── auth/               # Authentication handlers (login, me)
│   │   ├── batches/            # Batch lifecycle (create, submit, activate)
│   │   ├── inspector/          # Inspector endpoints (inspect-item, add-item, history)
│   │   └── officer/            # Officer adjudication, ledger, and PDF report routes
│   ├── layout.tsx              # Root HTML layout & application metadata
│   └── page.tsx                # Client entry point (redirects to login)
├── src/
│   └── lib/                    # Core Business Logic & SDK Clients
│       ├── compliance.ts       # Statutory Rule 6 rules engine, exemptions & penalty logic
│       ├── gemini.ts           # Google Gemini 2.0 Flash prompt engineering & extraction
│       ├── pdf.ts              # Statutory PDF dossier generator using pdf-lib
│       ├── supabase.ts         # Supabase PostgreSQL database queries & storage uploads
│       └── vision.ts           # Google Cloud Vision API Document Text Detection
├── frontend/                   # Static Application Source (PWA, Scripts, Styles)
│   ├── index.html              # Landing portal & role chooser
│   ├── login.html              # Secure authentication interface
│   ├── inspector.html          # Mobile Field Inspector scanning interface
│   ├── inspector.js            # Inspector client logic, camera engine & batch manager
│   ├── officer.html            # Senior Reviewing Officer Judicial Command Center
│   ├── officer.js              # Review queue, adjudication modal, and PDF viewers
│   ├── camera.js               # HTML5 guided camera engine with blur detection
│   └── style.css               # Archival paper design system and typography tokens
├── public/                     # Public static assets & mirrored web application files
├── scripts/                    # Database migrations, seed data, and verification suites
│   ├── test_pipeline.ts        # End-to-end OCR and Gemini compliance pipeline test
│   ├── audit_endpoints_and_integrity.mjs # API endpoint integrity verifier
│   ├── reseed_demo_batches.mjs # Benchmark demo batch reseeder
│   └── migration.sql           # Supabase PostgreSQL DDL schema & table definitions
├── docs/                       # Technical architecture & compliance specifications
│   ├── ARCHITECTURE.md         # Detailed sequence diagrams and entity relations
│   ├── SETUP.md                # Deployment and configuration reference
│   ├── TECH_STACK.md           # Engineering decisions and architectural specifications
│   └── LEGAL_COMPLIANCE.md     # Legal Metrology Act 2009 & Rule 6 compliance standards
├── .env.example                # Environment variables template
├── next.config.js              # Next.js routing and clean URL rewrites
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment configuration
├── LICENSE                     # MIT Open Source License
└── README.md                   # Project documentation (this file)
```

---

## 🧪 Verification & Testing Scripts

Run the verification scripts to validate the end-to-end pipeline, database integrity, and production build:

```bash
# 1. Type check and verify production Next.js build
npm run build

# 2. Run the AI OCR & Rule 6 Compliance pipeline test
npx tsx scripts/test_pipeline.ts

# 3. Verify API endpoint integrity and database connectivity
node scripts/audit_endpoints_and_integrity.mjs
```

---

## 📚 Documentation Index

For in-depth architectural, setup, and statutory details, refer to the documentation suite in `docs/`:

| Document | Description |
| :--- | :--- |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | End-to-end sequence diagrams, Supabase PostgreSQL data model (ER diagram), and RBAC matrix. |
| **[docs/SETUP.md](docs/SETUP.md)** | Comprehensive developer guide, environment variables, Supabase storage bucket setup, and Vercel edge deployment. |
| **[docs/LEGAL_COMPLIANCE.md](docs/LEGAL_COMPLIANCE.md)** | Statutory analysis of the Legal Metrology Act 2009, PC Rules 2011 (Rule 6), conditional exemptions, font sizes, and compounding. |
| **[docs/TECH_STACK.md](docs/TECH_STACK.md)** | Engineering rationale for Next.js 14, Supabase, Google Vision, Gemini 2.0 Flash, and `pdf-lib`. |

---

## ⚖️ Statutory Legal Citations

- **Legal Metrology Act, 2009 (Act No. 1 of 2010)**:
  - **Section 18(1)**: Prohibition of manufacture, packing, sale, or distribution of non-standard packaged commodities.
  - **Section 36(1)**: Penalty for manufacture, sale, etc., of non-standard packages (fine up to ₹25,000 for first offence; ₹50,000 for second; ₹1,00,000 or imprisonment up to 1 year for subsequent offences).
  - **Section 49**: Corporate liability and compounding provisions.
- **Legal Metrology (Packaged Commodities) Rules, 2011**:
  - **Rule 6**: Mandatory declarations on every retail package.
  - **Rule 7 & 8**: Principal Display Panel (PDP) placement, character height, and visibility standards.
  - **Rule 9 & 10**: Unit Sale Price (USP) and metric unit specifications.
  - **Rule 32**: Compounding of offences by authorized controllers.

---

## 📜 License & Acknowledgements

Developed by **Team Pirates** for the **Smart India Hackathon 2026**.  
Submitted under **Problem Statement SIH26034** for the **Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India**.

Released under the [MIT License](LICENSE).
