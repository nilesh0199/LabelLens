# LabelLens: Setup & Deployment Guide

This guide provides instructions for setting up the local development environment, configuring required environment variables, running database migrations, and deploying to Vercel and Supabase.

---

## 💻 1. Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/labellens.git
cd labellens
```

### Step 2: Install Dependencies
LabelLens requires **Node.js 18.18+** (Node.js 20+ recommended).

```bash
npm install
```

---

## 🔑 2. Environment Variables Configuration

Create a local environment file `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

> [!CAUTION]
> Never commit real secrets or API keys to version control. Refer to the [Demo Credentials section in README.md](../README.md#-demo-credentials--test-roles) for pre-seeded test accounts.

### Required Variable Names

| Variable Name | Environment Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend & Server (`.env.local`) | HTTPS endpoint for your Supabase project instance. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend & Server (`.env.local`) | Public anonymous API key for client-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side (`.env.local`) | Privileged service key for administrative queries, audit logs, and PDF generation. |
| `GEMINI_API_KEY` | Server-side (`.env.local`) | API key for Google Gemini 2.0 Flash (`gemini-2.0-flash`). |
| `GOOGLE_VISION_API_KEY` | Server-side (`.env.local`) | API key for Google Cloud Vision Document Text Detection. |
| `USE_VISION_API` | Server-side (`.env.local`) | Feature flag (`true`/`false`) controlling Vision API OCR usage. |

---

## 🚀 3. Running the Local Application

Start the local Next.js development server:

```bash
npm run dev
```

The application will bind to **[http://localhost:3000](http://localhost:3000)**:
- **Landing & Role Selector**: [http://localhost:3000/login.html](http://localhost:3000/login.html)
- **Field Inspector Portal**: [http://localhost:3000/inspector.html](http://localhost:3000/inspector.html)
- **Reviewing Officer Command Center**: [http://localhost:3000/officer.html](http://localhost:3000/officer.html)

---

## ☁️ 4. Supabase Setup & Migrations

1. **Create Project**: Create a new project in the [Supabase Dashboard](https://app.supabase.com/).
2. **Execute Schema SQL**: In the SQL Editor, execute `scripts/migration.sql` to initialize:
   - `batches` (store inspection sessions)
   - `batch_items` (specimens, multi-angle photos, and statutory audit logs)
3. **Configure Storage Bucket**:
   - Ensure a public bucket named `specimen-photos` exists.
   - Set file size limits to 10MB per image (JPEG, PNG, WebP).
4. **Seed Test Accounts & Batches**:
   - Demo batches can be reset or reseeded via `node scripts/reseed_demo_batches.mjs`.

---

## 🌐 5. Vercel Deployment

The project is configured for native Next.js 14 deployment on Vercel:

1. **Import Repository**: Connect the repository to your [Vercel Dashboard](https://vercel.com/).
2. **Environment Variables on Vercel**:
   - Navigate to **Project Settings > Environment Variables**.
   - Add all keys defined in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GOOGLE_VISION_API_KEY`).
3. **Deploy**: Push to the production branch to trigger deployment.

---

## 🔗 Related Documentation

- Technology Choices: [docs/TECH_STACK.md](TECH_STACK.md)
- System Architecture: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- Legal & Regulatory Compliance Guide: [docs/LEGAL_COMPLIANCE.md](LEGAL_COMPLIANCE.md)
- Quick Start & Demo Accounts: [README.md](../README.md)
