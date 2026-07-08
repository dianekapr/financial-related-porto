# FINANCIAL MONOREPO :: VAULT + SLICE

This repository contains two projects that I built as part of my portfolio. Although they solve different problems, both share the same stack and live inside a single monorepo.

## VAULT
A personal finance app that helps users track income, expenses, budgets, and spending habits without feeling overwhelming.

**Highlights**
- Multi-wallet transaction management
- Monthly budgeting
- Spending analytics
- Clean dark UI with customizable themes
- Google Authentication
- Responsive design

---

## SLICE
A modern split bill app that makes sharing expenses easier. Upload a receipt, let AI read it, assign items to each person, and the app calculates who owes what.

**Highlights**
- AI receipt scanning using Claude Vision
- Item-based bill splitting
- Smart payment calculation
- WhatsApp sharing
- Google Authentication
- Mobile-first interface

---

# Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| AI | Claude Vision API |
| Deployment | Vercel |

---

# Project Structure

```
portfolio/
│
├── apps/
│   ├── vault/
│   └── slice/
│
└── packages/
    └── supabase/
```

The shared package contains the Supabase client, database types, and SQL schema used by both applications.

---

# Running Locally

Install dependencies first.

```bash
npm install
```

Copy the environment file for each app.

```bash
cp .env.example apps/vault/.env.local
cp .env.example apps/slice/.env.local
```

Fill in the required environment variables, then run:

```bash
# VAULT
npm run vault

# SLICE
npm run slice

# Both apps
npm run dev
```

---

# Environment Variables

Both apps require:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

SLICE also needs:

```
ANTHROPIC_API_KEY
```

---

# Deployment

Both projects are deployed separately on Vercel.

```bash
cd apps/vault
vercel --prod
```

```bash
cd apps/slice
vercel --prod
```

Remember to configure the required environment variables in each Vercel project.

---

# Why a Monorepo?

Since both projects use the same technologies, authentication flow, and database setup, keeping them in a monorepo makes shared code easier to manage while allowing each application to be deployed independently.