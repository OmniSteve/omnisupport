# Omni Solutions — Support Ticket Management System

A production-quality, **standalone** support ticket / helpdesk application for Omni
Solutions and its clients. Built with React + Vite + Tailwind CSS. It is designed
to be exported, stored in GitHub, and deployed independently on Cloudflare
(Workers + D1 + R2) — **with zero Base44 runtime dependencies** in the shipped
application code.

> Base44 is used only to help generate this project. The finished app does not
> import `@base44/sdk`, Base44 entities, Base44 auth, Base44 database, Base44
> functions, or any Base44 runtime API. All data access goes through a clean
> REST abstraction (`src/api/`) that can be pointed at any backend.

---

## Features

- **Dashboard** — KPI cards (Open, Awaiting Response, In Progress, Resolved Today,
  Overdue), trend chart, breakdowns by status / priority / category / agent,
  recent tickets and a personal work queue.
- **Tickets** — powerful table with search, sort, multi-filter, saved views,
  pagination, multi-select and bulk actions.
- **Ticket Detail** — conversation timeline distinguishing customer messages,
  support replies and **internal notes** (hidden from clients), a reply composer
  with Reply / Internal Note modes, sidebar controls (status, priority, category,
  assignee, customer, dates, tags) and an immutable activity history.
- **Human-readable ticket references** — `OMNI-000001`, permanent and unique.
- **Customers & Organisations** — company → contacts → tickets hierarchy with
  full support history per customer.
- **Knowledge Base** — categories and articles (published / draft).
- **Reports** — created / resolved, average response & resolution times,
  breakdowns, SLA compliance, with date range filtering.
- **Users & Teams** — agent / admin management, team-ready assignment model.
- **Settings** — configurable ticket prefix, SLA rules, statuses, priorities,
  categories (sourced from the API in production).
- **Role-aware UI** — Admin / Support Agent / Client.
- **Dark mode** ready (token-based architecture).
- **Responsive** — desktop-first, works on tablet and mobile.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   - VITE_USE_MOCK=true  (default) uses the in-browser mock API — no backend needed
#   - VITE_API_BASE_URL=/api

# 3. Run the dev server
npm run dev
```

Open the printed URL and sign in with any seeded account, e.g.
`alex@omnisolutions.mt` / any password (mock mode accepts any seeded email).

---

## Switching from mock to the real backend

The frontend never talks to the database directly. Everything goes through
`src/api/`, which routes to either the mock layer (`src/mocks/`) or the real REST
API depending on `VITE_USE_MOCK`:

```
VITE_USE_MOCK=true   →  src/mocks/handlers.js  (in-browser)
VITE_USE_MOCK=false  →  fetch(VITE_API_BASE_URL + path)   (your Cloudflare API)
```

No UI changes are required to switch — just set the env vars and deploy.

---

## Environment variables

See `.env.example`. All are **public** (Vite env vars are bundled into the
browser) — never put secrets here.

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base URL of the REST API |
| `VITE_USE_MOCK` | `true` | `true` = in-browser mock, `false` = real API |
| `VITE_SUPPORT_EMAIL` | `support@omnisolutions.mt` | Display-only support email |
| `VITE_APP_NAME` | `Omni Solutions Support` | App name shown in the UI |

Secrets (API keys, DB credentials, email provider keys) belong **server-side**
on the Cloudflare Worker — never in the frontend bundle.

---

## Project structure

```
src/
  api/            # REST abstraction (client, auth, tickets, customers, users, reports, knowledge)
  mocks/          # In-browser mock DB + request router (dev only, fully isolated)
  context/        # Standalone Auth, Theme, Toast providers
  lib/            # constants, formatting, hooks, utils
  components/
    layout/       # Sidebar, Topbar, AppLayout
    ui/           # Badge, Button, Card, Input, Avatar, Skeleton, EmptyState
    tickets/      # TicketTable
  pages/          # Dashboard, Tickets, TicketDetail, NewTicket, MyTickets,
                  # Customers, CustomerDetail, KnowledgeBase, Reports, Users, Settings, Login
docs/
  API.md          # Expected REST API contract
  DEPLOYMENT.md   # Cloudflare deployment guide
```

---

## Expected REST API contract

See [`docs/API.md`](docs/API.md) for the full endpoint list the frontend calls.
The mock router in `src/mocks/handlers.js` implements exactly these endpoints,
so it doubles as a living specification.

---

## Deployment (Cloudflare)

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Summary:

- **Frontend** → Cloudflare Pages (build with `npm run build`, serve `dist/`).
- **Backend** → Cloudflare Workers exposing the REST API in `docs/API.md`.
- **Database** → Cloudflare D1.
- **Attachments** → Cloudflare R2 (upload via `/api/attachments`, return a URL).
- **Auth** → handled by the Worker (issue JWTs); the frontend only stores the
  token and sends `Authorization: Bearer <token>`.

Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL` to your Worker URL for
production builds.

---

## Removing Base44 from the exported project

This project is generated inside Base44, but the shipped app is standalone. The
only Base44-touched file that remains in the generator environment is the
platform-managed `src/lib/AuthContext.jsx` (used solely so the project builds
inside the Base44 builder). When exporting to GitHub:

1. The app uses `src/context/AuthContext.jsx` (standalone) for authentication —
   not `src/lib/AuthContext.jsx`.
2. Delete `src/lib/AuthContext.jsx`, `src/lib/app-params.js`,
   `src/api/base44Client*`, and `src/components/UserNotRegisteredError.jsx`
   (only referenced by the platform scaffold).
3. Remove the `AuthProvider` / `useAuth` import from `@/lib/AuthContext` in
   `src/App.jsx` and the `<AuthProvider>` wrapper (keep the standalone
   `AppAuthProvider` from `@/context/AuthContext`).
4. Remove `@base44/sdk` and `@base44/vite-plugin` from `package.json` and adjust
   `vite.config.js` to a standard Vite config.
5. `grep -ri base44 src/` should return nothing.

After these steps the project builds with standard `npm install && npm run build`
and runs anywhere Node/Vite is available.

---

## License

© Omni Solutions. All rights reserved.