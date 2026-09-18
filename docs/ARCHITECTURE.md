# LabelLens: System Architecture & Data Flow

This document details the multi-tiered architecture, regulatory enforcement workflow, entity relationships, and access control model governing LabelLens.

---

## 🏛️ High-Level System Workflow

The end-to-end regulatory lifecycle progresses through four distinct phases:

```mermaid
sequenceDiagram
    autonumber
    actor Inspector as Field Inspector (Mobile LMO)
    participant UI as Guided Camera UI
    participant AI as AI Pipeline (Vision API + Gemini 2.0)
    participant Rules as Rule 6 Compliance Engine
    participant DB as Supabase (PostgreSQL & Storage)
    actor Officer as Senior Reviewing Officer
    participant PDF as pdf-lib Engine
    
    Note over Inspector,UI: Phase 1: On-Site Retail Batch Initiation
    Inspector->>UI: Create Batch Session (Store Name, Location/GPS)
    UI->>DB: INSERT INTO batches (status: 'draft')
    
    Note over Inspector,UI: Phase 2: Angle-Guided Specimen Capture & AI Analysis
    Inspector->>UI: Capture Front PDP (Mandatory)
    Inspector->>UI: Capture Back Info Panel (Recommended)
    Inspector->>UI: Capture Side Detail Panel (Optional)
    UI->>AI: Transmit Multi-Angle Photos (/api/inspector/inspect-item)
    AI->>Rules: Raw Declarations & Extracted Fields
    Rules-->>UI: Evaluated Rule 6 Checklist & Compliance Score
    Inspector->>UI: Review & Verify in Declaration Editor
    UI->>DB: INSERT INTO batch_items & Store Photos in Supabase Storage
    Inspector->>DB: Submit Batch Dossier (/api/batches/[id]/submit -> status: 'pending_review')

    Note over Officer,DB: Phase 3: Judicial Adjudication
    Officer->>DB: Fetch Jurisdictional Review Queue (/api/officer/batches)
    DB-->>Officer: Dossier with Multi-Angle Photos & Rule 6 Findings
    alt Approve As-Is
        Officer->>DB: Endorse Findings (status: 'approved')
    else Override Verdict
        Officer->>DB: Flip Verdict + Mandatory Judicial Reason (status: 'overridden')
    else Send for Recapture
        Officer->>DB: Reject Specimen + Specific Instructions (status: 'recapture_requested')
        DB-->>UI: Recapture Alert Banner on Mobile Inspector Portal
    else Correct & Remark
        Officer->>DB: Edit Extracted Values + Finalize (status: 'corrected')
    end

    Note over Officer,PDF: Phase 4: Tamper-Evident Audit Dossier
    Officer->>DB: Commit Batch to Permanent Ledger (status: 'completed')
    Officer->>PDF: Generate Statutory Audit Dossier (Form II Notice / Certificate)
    PDF-->>Officer: Streamed Downloadable PDF Certificate
```

---

## 📊 Data Model & Entity Relationships

The relational data model in Supabase (PostgreSQL) connects field enforcement sessions with judicial determinations:

```mermaid
erDiagram
    batches ||--|{ batch_items : "contains"

    batches {
        string batch_id PK
        string inspector_id
        string inspector_name
        string jurisdiction
        string store_name
        text store_location
        string status "draft | pending_review | under_review | completed"
        timestamp created_at
        timestamp submitted_at
    }

    batch_items {
        string item_id PK
        string batch_id FK
        string product_name
        string product_category
        jsonb photos "array of {photo_id, url, angle, is_blurry, blur_score, timestamp}"
        boolean compliant
        float confidence
        jsonb declarations_found "array of rule keys"
        jsonb declarations_missing "array of rule keys"
        jsonb declaration_values "object mapping rule keys to extracted values"
        text raw_ocr_text
        text cleaned_summary
        string status "draft | pending | approved | overridden | recapture_requested"
        boolean needs_review
        jsonb review_reasons "array of reason flags"
        string officer_action
        text officer_remarks
        timestamp created_at
    }
```

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

LabelLens strictly separates field enforcement responsibilities from judicial oversight:

### Role Matrix

| Capability / Route | Field Inspector (`inspector`) | Senior Reviewing Officer (`officer`) | System Administrator (`admin`) |
| :--- | :---: | :---: | :---: |
| **Landing & Role Select (`/login.html`)** | Access | Access | Access |
| **Mobile Inspector Portal (`/inspector.html`)** | Full Access | Read-Only View | Admin View |
| **Camera Capture Engine (`camera.js`)** | Full Access | Disabled | Disabled |
| **Batch Initiation & Manifest Edit** | Full Access | Restricted | Admin Override |
| **Reviewing Officer Workbench (`/officer.html`)** | Access Denied | Full Access | Full Access |
| **Verdict Override & Adjudication** | Restricted | Full Access | Audit Only |
| **Recapture Request Issuance** | Restricted | Full Access | Restricted |
| **Statutory PDF Generation (`pdf-lib`)** | View Only | Generate & Export | Generate & Audit |
| **Jurisdictional User Management** | Access Denied | Access Denied | Full Access |

### Enforcement Mechanisms
1. **Client-Side Route Guard (`frontend/auth.js`)**:
   - Inspects active session credentials and assigned roles.
   - Restricts unauthenticated visitors to `/login.html`.
   - Prevents an authenticated Field Inspector from accessing `/officer.html`, redirecting with a jurisdictional notice.
2. **Serverless API Route Validation (`app/api/`)**:
   - API endpoints enforce role checks prior to executing transactional writes or status transitions.
3. **Supabase Storage Isolation**:
   - Multi-angle photos are stored under structured paths (`uploads/`) within the `specimen-photos` bucket, linked immutably to item IDs.

---

## 🔗 Related Documentation

- Technology Choices: [docs/TECH_STACK.md](TECH_STACK.md)
- Local Setup & Migration Instructions: [docs/SETUP.md](SETUP.md)
- Legal & Regulatory Compliance Guide: [docs/LEGAL_COMPLIANCE.md](LEGAL_COMPLIANCE.md)
- Quick Start & Demo Accounts: [README.md#demo-credentials--test-roles](../README.md#-demo-credentials--test-roles)
