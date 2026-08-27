# Omni Solutions — Support Ticket Management System

A production-quality support ticket / helpdesk application for Omni Solutions and
its clients. Built as a **standalone React + Vite + Tailwind CSS** frontend with a
clean REST API abstraction layer. It is designed to be developed in any standard
editor (VS Code / Codex) and deployed to **Cloudflare** (Pages + Workers + D1 + R2).

The frontend has no platform-specific runtime dependencies. All data access goes
through `src/api/`, which routes to either an in-browser mock layer or a real REST
backend, controlled by environment variables.

---

## Features

- **Dashboard** — KPI cards, 7-day trend, breakdowns by status / priority / category / agent, recent tickets, personal work queue.
- **Tickets** — searchable, sortable, filterable table with saved views, pagination, multi-select and bulk actions.
- **Ticket Detail** — conversation timeline separating customer messages, support replies and **internal notes** (hidden from clients); reply composer with Reply / Internal Note modes; sidebar controls (status, priority, category, assignee, customer, dates, tags); immutable activity history.
- **Human-readable ticket references** — `OMNI-000001`.
- **Customers & Organisations** — company → contacts → tickets hierarchy with full support history per customer.
- **Knowledge Base** — categories and articles (published / draft).
- **Reports** — created / resolved, average response & resolution times, breakdowns, SLA compliance, date range filtering.
- **Users & Teams** — agent / admin management.
- **Settings** — configurable ticket prefix, SLA rules, categories (sourced from the API in production).
- **Role-aware UI** — Admin / Support Agent / Client.
- **Dark mode** ready (token-based architecture).
- **Responsive** — desktop-first, works on tablet and mobile.

---

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

With the default `.env` (`VITE_USE_MOCK=true`) the app runs entirely in the browser
using the mock API — no backend required. Sign in with any seeded account, e.g.
`alex@omnisolutions.mt` (any password is accepted in mock mode).

---

## Architecture

```
UI (src/pages, src/components)
  ↓
src/api/*            (resource modules: auth, tickets, customers, users, reports, knowledge)
  ↓
src/api/client.js    (single request() entry point)
  ↓
VITE_USE_MOCK=true   →  src/mocks/handlers.js   (in-browser mock DB + router)
VITE_USE_MOCK=false  →  fetch(VITE_API_BASE_URL + path)   (your REST API)
```

React components never call `fetch()` directly — they use the `src/api/*` modules.
Backend-specific logic stays out of the UI.

---

## Environment variables

All variables are public (bundled into the browser) — never put secrets here.
See `.env.example`.

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base URL of the REST API. Must include the `/api` segment. |
| `VITE_USE_MOCK` | `true` | `true` = in-browser mock, `false` = real API. |
| `VITE_SUPPORT_EMAIL` | `support@omnisolutions.mt` | Display-only support email. |
| `VITE_APP_NAME` | `Omni Solutions Support` | App name shown in the UI. |

### API base URL convention

The frontend calls paths like `/auth/login`, `/tickets`, `/customers` and prepends
`VITE_API_BASE_URL`. The frontend does **not** add an extra `/api`. Therefore:

```
VITE_API_BASE_URL=/api
request("/auth/login")  →  GET/POST  /api/auth/login
```

Or for a dedicated API domain:

```
VITE_API_BASE_URL=https://api.omnisolutions.mt/api
request("/auth/login")  →  GET/POST  https://api.omnisolutions.mt/api/auth/login
```

Secrets (DB credentials, JWT signing keys, email provider keys) belong
server-side on the Worker — never in the frontend bundle.

---

## Authentication

Authentication is handled entirely by the standalone auth context
(`src/context/AuthContext.jsx`) and the API abstraction (`src/api/auth.js`):

1. On startup, if a token is stored, the app calls `GET /auth/me` to validate it.
   The backend-returned user is authoritative; on failure the local session is cleared.
2. `POST /auth/login` returns `{ token, user }`; the token is stored and sent as
   `Authorization: Bearer <token>` on subsequent requests.
3. `POST /auth/logout` notifies the backend (so it can revoke the session), then
   clears the local session regardless of the server response.

Protected routes redirect unauthenticated users to `/login`. Admin-only routes
(`/users`, `/settings`) require `user.role === "admin"`.

---

## Project structure

```
src/
  api/            # REST abstraction (client, auth, tickets, customers, users, reports, knowledge)
  mocks/          # In-browser mock DB + request router (dev only)
  context/        # Standalone Auth, Theme, Toast providers
  lib/            # constants, formatting, hooks, utils
  components/
    layout/       # Sidebar, Topbar, AppLayout
    ui/           # Badge, Button, Card, Input, Avatar, Skeleton, EmptyState (shadcn-based)
    tickets/      # TicketTable
  pages/          # Dashboard, Tickets, TicketDetail, NewTicket, MyTickets, Customers,
                  # CustomerDetail, KnowledgeBase, Reports, Users, Settings, Login
docs/
  API.md          # REST API contract
  DEPLOYMENT.md   # Cloudflare deployment guide
```

---

## REST API contract

See [`docs/API.md`](docs/API.md). The mock router (`src/mocks/handlers.js`)
implements the exact same contract, so it doubles as a living specification for the
Cloudflare Workers backend.

---

## Deployment (Cloudflare)

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Summary:

- **Frontend** → Cloudflare Pages (`npm run build`, serve `dist/`).
- **Backend** → Cloudflare Workers exposing the REST API in `docs/API.md`.
- **Database** → Cloudflare D1 (planned).
- **Attachments** → Cloudflare R2 (planned).
- **Auth** → handled by the Worker (JWTs); the frontend only stores the token.

Set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL` to your Worker URL for production.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server (mock mode by default). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |

---

## License

© Omni Solutions. All rights reserved.