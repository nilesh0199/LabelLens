# LabelLens: Legal Metrology Regulatory Enforcement System

LabelLens is an automated compliance verification and audit ledger platform built for the **Smart India Hackathon 2026 (Problem Statement SIH26034)** under the Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution. It solves the critical bottleneck of slow, error-prone manual retail inspections by providing mobile field inspectors with real-time, multi-angle statutory label scanning under the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011**, while offering senior reviewing officers a judicial command center for batch dossier adjudication and penalty management.

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+ (Python 3.14 compatible)
- Modern web browser (Chrome, Edge, Safari, or Firefox with camera permissions)

### 1. Clone & Environment Setup
```bash
git clone https://github.com/your-org/labellens.git
cd labellens
```

Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Environment Variables
Copy example environment configuration (see [docs/SETUP.md](docs/SETUP.md) for details):
```bash
cp backend/.env.example backend/.env
```
*Key variables needed: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_VISION_API_KEY` (placeholder values can be used during local SQLite prototyping).*

### 4. Run the Local Server
```bash
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```
Open your browser at **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** to access the landing screen and role-selection portal.

---

## 📂 Project Structure Overview

```text
.
├── backend/        # FastAPI API gateway, SQLite local persistence, and legacy OCR routes
├── frontend/       # Static web application (Landing, Field Inspector, and Officer portals)
├── docs/           # Architecture, technical stack, setup guides, and project roadmaps
├── venv/           # Python virtual environment (ignored by git)
├── vercel.json     # Vercel deployment routing and API proxy configuration
├── README.md       # Project overview and quick start guide (this file)
└── CREDENTIALS.md  # Local dev credentials reference (git-ignored)
```

---

## 📚 Documentation Index

- **[docs/TECH_STACK.md](docs/TECH_STACK.md)**: Detailed breakdown of frontend, Supabase, Google Vision API, and production dependencies.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System lifecycle, multi-angle capture pipeline, two-tier role adjudication, and data models.
- **[docs/SETUP.md](docs/SETUP.md)**: Comprehensive local development, database seeding, and Vercel/Supabase deployment guide.
- **[docs/TODO.md](docs/TODO.md)**: Running track of in-progress tasks, completed milestones, and upcoming deliverables.
- **[CREDENTIALS.md](CREDENTIALS.md)**: Local developer reference for test accounts and environment secrets *(git-ignored)*.
