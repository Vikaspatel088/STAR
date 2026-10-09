# STAR - Smart Tourist Assistance & Response

STAR is a Rajasthan tourism safety and assistance platform built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

- Rajasthan heritage monument discovery
- Hotel and verified guide browsing
- Tourist registration and authentication
- QR ticketing and footfall dashboards
- Interactive maps and directions
- Safety chat and emergency assistance flows
- Role-based tourist, guide, organisation, and admin dashboards

## Run locally

Requirements: Node.js 18 or newer and npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

The monuments and hotels pages include ready-to-use Rajasthan data and direct web-hosted images, so they work immediately without a database. Never commit `.env`; use `.env.example` as the public template.

## Demo login

The sign-in experience is intentionally configured for presentation/demo use. Enter any valid `@gmail.com` address and any non-empty password. A local browser session is created and persists across refreshes; no email verification or Supabase account is required.

## Production checks

```powershell
npm run lint
npm run build
npm run preview
```

## Optional Supabase setup

The SQL migrations are in [`supabase/migrations`](./supabase/migrations). Apply them through the Supabase dashboard SQL editor or the Supabase CLI:

```powershell
npx supabase login
npx supabase link --project-ref your-project-id
npm run migrate:cli
```

Authentication, dashboards, tickets, chat, and optional map integrations use Supabase. The frontend only uses the public Supabase client key. Keep service-role keys and other secrets out of the browser and out of Git.
