# LabelLens: System Architecture & Data Flow

This document details the multi-tiered architecture, regulatory enforcement workflow, entity relationships, and access control model governing LabelLens.

---

## 🏛️ High-Level System Workflow

The end-to-end regulatory lifecycle progresses through four distinct phases:

```mermaid
sequenceDiagram
    autonumber
    actor Inspector as Field Inspector (Mobile)
    participant UI as Guided Camera UI
    participant OCR as Google Vision API / OCR
    participant DB as Supabase Ledger
    actor Officer as Senior Reviewing Officer
    
    Note over Inspector,UI: Phase 1: On-Site Retail Verification
    Inspector->>UI: Create Batch Session (Store Name, Location)
    UI->>DB: INSERT INTO batches (status: 'active')
    
    Note over Inspector,UI: Phase 2: Angle-Guided Specimen Capture
    Inspector->>UI: Capture Front PDP (Mandatory)
    Inspector->>UI: Capture Back Info Panel (Recommended)
    Inspector->>UI: Capture Side Detail Panel (Optional)
    UI->>OCR: Transmit Multi-Angle Photos
    OCR-->>UI: Extracted Text & Rule 6 Declarations
    Inspector->>DB: Add Specimen to Batch Manifest
    Inspector->>DB: Submit Batch Dossier (status: 'pending_review')

    Note over Officer,DB: Phase 3: Judicial Adjudication
    Officer->>DB: Fetch Jurisdictional Review Queue
    DB-->>Officer: Dossier with Photos & Automated Checklist
    alt Approve As-Is
        Officer->>DB: Endorse Findings (status: 'approved')
    else Override Verdict
        Officer->>DB: Flip Verdict + Mandatory Justification (status: 'overridden')
    else Send for Recapture
        Officer->>DB: Reject Specimen + Specific Instructions (status: 'recapture_requested')
        DB-->>Inspector: Recapture Warning Banner on Mobile
    else Correct & Remark
        Officer->>DB: Edit Extracted Values + Finalize (status: 'corrected')
    end

    Note over Officer,DB: Phase 4: Tamper-Evident Record
    Officer->>DB: Commit to Permanent Regulatory Ledger
    DB-->>Officer: Generate Legal Certificate / PDF
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
        string status "active | pending_review | under_review | completed"
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
        jsonb declarations_found "array of string rule keys"
        jsonb declarations_missing "array of string rule keys"
        jsonb declaration_values "object mapping rule keys to extracted values"
        text raw_ocr_text
        text cleaned_summary
        string status "pending | approved | overridden | recapture_requested"
        boolean needs_review
        jsonb review_reasons "array of string flags"
        string officer_action
        text officer_remarks
        timestamp created_at
    }
```

---

## 🔐 Authentication & Role-Based Access Control (RBAC)

LabelLens strictly separates field enforcement responsibilities from judicial oversight:

### Role Matrix

| Capability / Route | Field Inspector | Senior Reviewing Officer | System Administrator |
| :--- | :---: | :---: | :---: |
| **Landing & Role Select (`/login`)** | Access | Access | Access |
| **Mobile Inspector Portal (`/inspector`)** | Full Access | Read-Only View | Admin View |
| **Camera Capture Engine (`camera.js`)** | Full Access | Disabled | Disabled |
| **Batch Initiation & Manifest Edit** | Full Access | Restricted | Admin Override |
| **Reviewing Officer Workbench (`/officer`)** | Access Denied | Full Access | Full Access |
| **Verdict Override & Adjudication** | Restricted | Full Access | Audit Only |
| **Recapture Request Issuance** | Restricted | Full Access | Restricted |
| **Jurisdictional User Management** | Access Denied | Access Denied | Full Access |

### Enforcement Mechanisms
1. **Client-Side Route Guard (`frontend/auth.js`)**:
   - Inspects `LabelLensAuth.getAuthSession()`.
   - Bounces unauthenticated visitors to `/login`.
   - Prevents an authenticated Field Inspector from navigating to `/officer`, displaying a departmental access restriction notice.
2. **Supabase Row Level Security (RLS)**:
   - Inspectors can only `INSERT` and `UPDATE` batches where `inspector_id = auth.uid()`.
   - Reviewing officers possess `SELECT` and `UPDATE` permissions on batches matching their assigned `jurisdiction`.
   - Immutable audit log triggers prevent post-adjudication alterations of finalized records.

---

## 🔗 Related Documentation

- Technology Choices: [docs/TECH_STACK.md](TECH_STACK.md)
- Local Setup & Migration Instructions: [docs/SETUP.md](SETUP.md)
- Outstanding Tasks & Roadmap: [docs/TODO.md](TODO.md)
- Local Dev Credentials: [CREDENTIALS.md](../CREDENTIALS.md)
