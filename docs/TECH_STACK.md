# LabelLens: Technology Stack Specification

This document details the production technology stack, architectural components, and external services powering LabelLens, along with the rationale for each engineering decision.

---

## 🧭 Technology Stack Evolution

> [!IMPORTANT]
> **Stack Architecture Transition Notice**:
> In the initial local prototype phase, the system utilized a local Python FastAPI backend, SQLite database (`history.db`), and CPU-based EasyOCR with OpenCV image processing.
> To support high-volume mobile field inspections, multi-lingual Indian packaging, real-time officer adjudication, and zero-maintenance global deployment for **SIH 2026**, the official production stack has transitioned to:
> - **Hosting**: **Vercel** (Global Edge CDN & Serverless)
> - **Backend & Database**: **Supabase** (PostgreSQL, Supabase Auth RBAC, Storage)
> - **OCR & Document AI**: **Google Vision API** (Cloud Document Text Detection)
>
> Legacy FastAPI and local EasyOCR routes are retained in `backend/` as a development fallback while the cloud migration is in progress.

---

## 🎨 1. Frontend Layer

| Component | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Architecture** | Vanilla HTML5 / ES6+ JavaScript | Zero-framework runtime for maximum performance and instant load times on mobile field devices. |
| **Hosting & Edge Delivery** | **Vercel** | Configured via `vercel.json` with clean URLs, SPA redirects, and API reverse-proxying. |
| **Styling & Design System** | Custom CSS3 + Design Tokens | Warm archival paper theme (`#FCFBF7`) with official deep navy gradients (`#14163A`/`#1D2050`). |
| **Typography** | Google Fonts | **Fraunces** (editorial serif for titles/wordmark) + **IBM Plex Sans** (crisp UI body & forms). |
| **Mobile PWA Support** | Web App Manifest (`manifest.json`) | Standalone app experience, home-screen installation, and mobile viewport locking (`375px–430px`). |
| **Guided Camera Engine** | HTML5 `MediaDevices.getUserMedia` | Custom `GuidedCameraEngine` (`frontend/camera.js`) with reticle overlay, blur detection, and continuous angle capture. |

---

## ⚡ 2. Backend & Data Layer (Supabase)

Supabase provides the managed backend infrastructure for user authentication, transactional ledger records, and multi-angle image storage:

| Supabase Module | Production Role | Current Status |
| :--- | :--- | :--- |
| **Supabase Auth** | Role-Based Access Control (RBAC) handling distinct roles (`inspector`, `officer`, `admin`) via JWT claims. | **In Progress**: Local demo session engine (`frontend/auth.js`) active; Supabase JS SDK client integration pending. |
| **PostgreSQL Database** | Relational tables for inspection batches, specimen items, statutory Rule 6 checklist results, and officer remarks. | **In Progress**: Active schema implemented in SQLite (`backend/database.py`); Supabase migration SQL prepared in [docs/SETUP.md](SETUP.md). |
| **Supabase Storage** | S3-compatible cloud storage bucket (`specimen-photos`) storing Front, Back, and Side label captures. | **Pending**: Local uploads currently saved to `backend/uploads/`. |
| **Row Level Security (RLS)** | Ensures field inspectors can only modify their own active batches while reviewing officers have jurisdictional read/adjudicate access. | **Pending**: RLS policies defined in schema migration script. |

---

## 🔍 3. OCR & Regulatory Compliance Engine (Google Vision API)

| Attribute | Specification |
| :--- | :--- |
| **Service** | **Google Cloud Vision API** (`DOCUMENT_TEXT_DETECTION`) |
| **Purpose** | Extracting micro-print text, numeric values, and statutory declarations from high-resolution package angles (Front PDP, Back Panel, Side Panels). |
| **Invocation Source** | Invoked from the backend API gateway (`/api/inspector/inspect-item`) or Supabase Edge Function upon inspector specimen submission. |
| **Strengths for SIH26034** | Superior accuracy on low-contrast curved packaging, bilingual Indian scripts (Hindi, regional languages + English), and small font sizes (down to 1mm statutory heights). |
| **Local Fallback** | `backend/main.py` maintains an EasyOCR / OpenCV processing pipeline for offline local testing when Google Vision credentials are not configured. |

---

## 📦 4. Additional Services & Dependencies

| Package / Library | Ecosystem | Role & Justification |
| :--- | :--- | :--- |
| **ReportLab** | Python / Backend | Generates formal, tamper-evident statutory PDF inspection certificates (`backend/pdf_generator.py`). |
| **Pillow (PIL)** | Python / Backend | Performs client/server image resizing, rotation correction, and thumbnail generation. |
| **OpenCV (`cv2`)** | Python / Backend | Image preprocessing (CLAHE contrast normalization, grayscale, blur estimation via Laplacian variance). |
| **Uvicorn & Starlette** | Python / Backend | High-performance ASGI runtime powering local development and testing routes. |

---

## 🔗 Related Documentation

- System Architecture & Data Flow: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Local Development & Deployment Setup: [docs/SETUP.md](SETUP.md)
- Development Roadmap & Pending Tasks: [docs/TODO.md](TODO.md)
