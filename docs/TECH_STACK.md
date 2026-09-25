# LabelLens: Technology Stack Specification

This document details the production technology stack, architectural components, and external services powering LabelLens, along with the rationale for each engineering decision.

---

## 🧭 Technology Stack Overview

To support high-volume mobile field inspections, multi-lingual Indian packaging, real-time officer adjudication, and zero-maintenance cloud deployment for **SIH 2026**, the production stack is built entirely on:
- **Full-Stack Framework**: **Next.js 14.2 (App Router & Serverless TypeScript API)**
- **Database & Object Storage**: **Supabase (PostgreSQL 15+ & Supabase Storage)**
- **OCR & Document AI**: **Google Cloud Vision API (`DOCUMENT_TEXT_DETECTION`)**
- **LLM Reasoning & Structuring**: **Google Gemini 3.7 Flash (`gemini-3.7-flash`)**
- **Statutory Audit Dossiers**: **`pdf-lib` (Tamper-evident legal certificate generation)**
- **Hosting & Edge Delivery**: **Vercel**

---

## 🎨 1. Frontend Layer

| Component | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Architecture** | Vanilla HTML5 / ES6+ JavaScript | Zero-framework runtime for maximum performance and instant load times on mobile field devices. |
| **Hosting & Edge Delivery** | **Vercel** | Configured with clean URLs, Next.js rewrites, and serverless API routing. |
| **Styling & Design System** | Custom CSS3 + Design Tokens | Warm archival paper theme (`#FCFBF7`) with official deep navy gradients (`#14163A`/`#1D2050`). |
| **Typography** | Google Fonts | **Fraunces** (editorial serif for titles/wordmark) + **IBM Plex Sans** (crisp UI body & forms). |
| **Mobile PWA Support** | Web App Manifest (`manifest.json`) | Standalone app experience, home-screen installation, and mobile viewport locking (`375px–430px`). |
| **Guided Camera Engine** | HTML5 `MediaDevices.getUserMedia` | Custom `GuidedCameraEngine` (`frontend/camera.js`) with reticle overlay, blur detection, and continuous angle capture. |

---

## ⚡ 2. Backend & Data Layer (Next.js & Supabase)

Next.js 14 App Router routes handle serverless API execution while Supabase provides managed PostgreSQL and high-resolution photo storage:

| Module | Technology | Production Role |
| :--- | :--- | :--- |
| **API Gateway** | Next.js Serverless Route Handlers (`app/api/`) | High-throughput, stateless endpoints for batch management, inspection, adjudication, and PDF reports. |
| **Role-Based Access Control (RBAC)** | Role validation & sessions (`auth.js` / Supabase Auth) | Distinct roles (`inspector`, `officer`, `admin`) enforcing jurisdictional access control. |
| **PostgreSQL Database** | Supabase Managed PostgreSQL | Relational schema for inspection batches, specimen items, statutory Rule 6 checklist results, and officer remarks. |
| **Cloud Storage** | Supabase Storage (`specimen-photos`) | S3-compatible cloud storage bucket storing Front PDP, Back Info, and Side Panel captures. |
| **Row Level Security (RLS)** | PostgreSQL RLS Policies | Guarantees field inspectors modify only their active batches while reviewing officers adjudicate within their jurisdictional scope. |

---

## 🔍 3. OCR & AI Analysis Engine (Vision API + Gemini 2.0 Flash)

| Attribute | Specification |
| :--- | :--- |
| **OCR Service** | **Google Cloud Vision API** (`DOCUMENT_TEXT_DETECTION`) |
| **Purpose** | Extracting micro-print text, numeric values, and statutory declarations from high-resolution package angles (Front PDP, Back Panel, Side Panels). |
| **LLM & Reasoning** | **Google Gemini 3.7 Flash (`gemini-3.7-flash`)** |
| **Purpose** | Semantic synthesis across multiple package angles, statutory field normalization, fuzzy brand/manufacturer matching, and Rule 6 compliance reasoning. |
| **Strengths for SIH26034** | Superior accuracy on low-contrast curved packaging, bilingual Indian scripts (Hindi, regional languages + English), and small font sizes (down to 1mm statutory heights). |
| **Rules Engine** | Deterministic TypeScript engine (`src/lib/compliance.ts`) validating 10 statutory declarations, conditional exemptions (displaying `"Not Applicable"`), and Section 36 penalties. |

---

## 📦 4. Additional Services & Libraries

| Package / Library | Ecosystem | Role & Justification |
| :--- | :--- | :--- |
| **`pdf-lib`** | Node.js / TypeScript | Generates formal, tamper-evident statutory PDF inspection certificates and Form II notices on the fly without heavy headless browser dependencies. |
| **`@supabase/supabase-js`** | TypeScript | Official client SDK for transactional database CRUD, realtime sync, and object storage uploads. |
| **`next` (v14.2+)** | Node.js / React | Full-stack production runtime providing App Router, SSR/SSG, edge middleware, and optimized asset delivery. |
| **`pg`** | Node.js | Direct PostgreSQL connection pooler for high-throughput batch and ledger verification scripts. |

---

## 🔗 Related Documentation

- System Architecture & Data Flow: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Local Development & Deployment Setup: [docs/SETUP.md](SETUP.md)
- Legal & Regulatory Compliance Guide: [docs/LEGAL_COMPLIANCE.md](LEGAL_COMPLIANCE.md)
- Quick Start & Demo Accounts: [README.md](../README.md#-demo-credentials--test-roles)
