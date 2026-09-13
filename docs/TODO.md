# LabelLens: Project Tasks & Roadmap

A concise, running checklist of completed milestones, in-progress items, and pending deliverables for the LabelLens regulatory platform.

---

## 🚀 1. Landing & Role Selection
- [x] Redesign landing screen to single split paper panel (`#FCFBF7`) with vertical desktop divider and horizontal mobile rule.
- [x] Implement Fraunces serif headings and IBM Plex Sans body typography via Google Fonts.
- [x] Replace shield emblem with custom Label + Lens SVG logo mark and SVG data URI favicon.
- [x] Remove stage/sequence numbering and assigned officer lines; trim role descriptions to one sentence.
- [x] Update button copy to "Continue as Inspector" and "Continue as Officer" with min 44px tap targets.
- [x] Remove auto-login bug; clicking role buttons now sets role context and opens Sign In modal with empty fields.
- [x] Enforce manual authentication against database records with strict role validation and inline error alerts.
- [x] Remove SIH hackathon suffix and secondary credentials link from landing footer.
- [ ] Implement Supabase magic link and OTP login in the credentials modal.

---

## 👮‍♂️ 2. Mobile Field Inspector Portal (`/inspector`)
- [x] Implement HTML5 `getUserMedia` guided camera engine with reticle overlay (`camera.js`).
- [x] Add continuous sequential capture progression: Front PDP $\rightarrow$ Back Info $\rightarrow$ Side Panel.
- [x] Wire ❌ Cross (immediate retake of same angle) and ✔️ Tick (confirm & next angle) controls.
- [x] Add fallback file picker upload under each individual angle slot.
- [x] Implement retail batch establishment session starter (Store Name, Address).
- [x] Build batch specimen manifest table with preliminary compliance badges and counter pills.
- [x] Add dossier submission workflow to transmit completed batches to Reviewing Officer.
- [ ] Enable per-slot direct camera activation (tap individual Front/Back/Side box to retake single angle).
- [ ] Add torch / flashlight toggle support for dim supermarket aisle scanning.
- [ ] Implement inline Rule 6 declaration text editor allowing inspectors to adjust OCR misreads before adding to manifest.
- [ ] Wire mobile bottom navigation bar (Camera, Batch, Manifest) to scroll smoothly between sections.
- [ ] Wire "Resolve Recaptures" banner button to open returned specimen retake workflow.

---

## ⚖️ 3. Senior Reviewing Officer Command Center (`/officer`)
- [x] Implement jurisdictional review queue table with status filters (All, Pending Review, Completed).
- [x] Build item audit workbench displaying multi-angle specimen photos and automated Rule 6 checklist.
- [x] Add statutory legal citations and Section 36 penalty advisory calculations.
- [x] Implement the 4 symmetrical review action buttons:
  - [x] **Approve As-Is**: Endorses field inspection findings to permanent ledger.
  - [x] **Override Verdict**: Reverses compliance status with mandatory justification remarks.
  - [x] **Send Back for Recapture**: Rejects item and triggers inspector alert for re-photographing.
  - [x] **Correct & Remark**: Edits statutory fields and finalizes record.
- [ ] Add export to PDF button on finalized batch dossiers using the ReportLab certificate engine.
- [ ] Add jurisdictional district filter dropdown for zonal controllers.

---

## ☁️ 4. Supabase & Cloud Migration
- [x] Document target stack decisions in `docs/TECH_STACK.md` and `README.md`.
- [x] Configure `vercel.json` routing rules for SPA paths (`/login`, `/inspector`, `/officer`).
- [ ] Set up production Supabase project and execute initial PostgreSQL DDL schema.
- [ ] Configure `specimen-photos` Supabase storage bucket with public read access.
- [ ] Implement Row Level Security (RLS) policies for Inspector vs Officer table isolation.
- [ ] Replace local SQLite `history.db` queries in frontend clients with Supabase JS client queries.

---

## 🔍 5. OCR & AI Analysis Engine
- [x] Rule 6 10-point mandatory statutory declaration regex & parsing rules.
- [x] Prototype EasyOCR & OpenCV image preprocessing pipeline.
- [ ] Integrate Google Cloud Vision API (`DOCUMENT_TEXT_DETECTION`) client.
- [ ] Implement fine-print font height verification algorithm (verifying minimum 1mm / 2mm statutory size).
- [ ] Add bilingual Hindi/English packaging detection support for statutory labels.

---

## 🔗 Related Documentation

- Project Architecture: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Technology Stack: [docs/TECH_STACK.md](TECH_STACK.md)
- Setup & Deployment: [docs/SETUP.md](SETUP.md)
