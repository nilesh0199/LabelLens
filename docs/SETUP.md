# LabelLens: Local Setup & Deployment Guide

This guide provides instructions for setting up the local development environment, configuring required environment variables, executing database migrations, and deploying to Vercel and Supabase.

---

## 💻 1. Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/labellens.git
cd labellens
```

### Step 2: Set Up Python Virtual Environment
LabelLens requires Python 3.11+.

```bash
# On Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# On macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Required Dependencies
```bash
pip install -r backend/requirements.txt
```

---

## 🔑 2. Environment Variables Configuration

Create a local environment file based on `.env.example`. 

> [!CAUTION]
> Never commit real secrets or API keys to version control. Refer to [CREDENTIALS.md](../CREDENTIALS.md) for test accounts and variable sources.

### Required Variable Names

| Variable Name | Environment Scope | Description |
| :--- | :--- | :--- |
| `HOST` | Backend (`backend/.env`) | Host address to bind local server (default: `127.0.0.1`). |
| `PORT` | Backend (`backend/.env`) | Port to listen on (default: `8000`). |
| `DATABASE_PATH` | Backend (`backend/.env`) | Path to local SQLite ledger database (`backend/history.db`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend & Edge (`.env.local`) | HTTPS endpoint for your Supabase project instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend & Edge (`.env.local`) | Public anonymous API key for client-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (`backend/.env`) | Privileged service key for administrative database seeding. |
| `GOOGLE_VISION_API_KEY` | Backend (`backend/.env`) | API key for Google Cloud Vision Document Text Detection. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Backend (`backend/.env`) | Path to service account JSON key file (alternative to API key). |

---

## 🚀 3. Running the Local Application

Start the local server with Uvicorn:

```bash
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

- **Landing & Role Selector**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/) *(auto-redirects to `/login`)*
- **Field Inspector Portal**: [http://127.0.0.1:8000/inspector](http://127.0.0.1:8000/inspector)
- **Reviewing Officer Command Center**: [http://127.0.0.1:8000/officer](http://127.0.0.1:8000/officer)
- **Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## ☁️ 4. Supabase Setup & Migrations

Before connecting the production frontend, set up your Supabase project:

1. **Create Project**: Create a new project in the [Supabase Dashboard](https://app.supabase.com/).
2. **Execute Schema SQL**: In the SQL Editor, execute the migration script to create the relational entities:
   - `users` (profiles & regulatory roles)
   - `batches` (store inspection sessions)
   - `batch_items` (specimens & statutory audit logs)
   - `item_photos` (multi-angle photo metadata)
3. **Configure Storage Bucket**:
   - Create a public bucket named `specimen-photos`.
   - Set file size limits to 10MB per image (JPEG, PNG, WebP).
4. **Seed Default Test Accounts**:
   - Create the initial Inspector and Reviewing Officer demo accounts listed in [CREDENTIALS.md](../CREDENTIALS.md).

---

## 🌐 5. Vercel Deployment

The frontend is optimized for zero-config edge deployment on Vercel:

1. **Link Repository**: Import the Git repository into your [Vercel Dashboard](https://vercel.com/).
2. **Routing Verification**: Ensure `vercel.json` is present in the repository root. It defines clean routing rules:
   ```json
   {
     "version": 2,
     "cleanUrls": true,
     "routes": [
       { "src": "/$", "dest": "/frontend/login.html" },
       { "src": "/login", "dest": "/frontend/login.html" },
       { "src": "/inspector", "dest": "/frontend/inspector.html" },
       { "src": "/officer", "dest": "/frontend/officer.html" },
       { "src": "/(.*)", "dest": "/frontend/$1" }
     ]
   }
   ```
3. **Environment Variables on Vercel**:
   - Navigate to **Project Settings > Environment Variables**.
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Trigger Deployment**: Push to `main` to trigger automatic preview and production deployments.

---

## 🔗 Related Documentation

- Technology Choices: [docs/TECH_STACK.md](TECH_STACK.md)
- System Architecture: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Outstanding Tasks: [docs/TODO.md](TODO.md)
- Test Accounts Reference: [CREDENTIALS.md](../CREDENTIALS.md)
