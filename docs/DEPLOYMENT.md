# Deployment Guide (Cloudflare)

The Omni Support frontend is a standard Vite SPA and can be deployed anywhere.
The intended production stack is Cloudflare. The backend (Workers / D1 / R2) is
not implemented yet — this guide describes the target architecture.

## Frontend → Cloudflare Pages

```bash
npm install
npm run build      # outputs dist/
```

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables (Pages → Settings → Environment variables):**
  - `VITE_API_BASE_URL` = `https://api.omnisolutions.mt/api` (your Worker URL, including `/api`)
  - `VITE_USE_MOCK` = `false`

## Backend → Cloudflare Workers (planned)

Implement the REST API in [`docs/API.md`](API.md) as a Worker (or set of
Workers). Suggested framework: Hono. Bindings:

- **D1** — database (`DB` binding). Schema mirrors the data models in `API.md`.
- **R2** — attachments (`BUCKET` binding). Uploads return a public/signed URL.
- **Secrets** — JWT signing key, email provider key, etc. Set via
  `wrangler secret put ...` — never in the frontend bundle.

## Database → Cloudflare D1 (planned)

Create the database and run migrations:

```bash
wrangler d1 create omni-support
wrangler d1 execute omni-support --file=./schema.sql
```

`schema.sql` should create tables for: `users`, `customers`, `organisations`,
`tickets`, `ticket_messages`, `ticket_activity`, `ticket_attachments`,
`ticket_tags`, `ticket_tag_links`, `ticket_categories`, `ticket_statuses`,
`teams`, `team_members`, `notifications`, `knowledge_articles`,
`knowledge_categories`, `system_settings`.

## Attachments → Cloudflare R2 (planned)

- Upload endpoint `POST /attachments` accepts multipart files, stores them in
  R2, and returns `{ url, name, size }`.
- The frontend references only the returned URL on tickets/messages — files are
  never embedded as Base64.

## Email (future)

Email-in ticket creation (`support@omnisolutions.mt` → new ticket) and outbound
reply emails are a **backend** concern. The frontend only exposes clean
abstractions (e.g. `POST /tickets` from a webhook). Do not hardcode an email
provider in the frontend.

## Auth

- The Worker issues JWTs on `/auth/login` and verifies them on every protected
  request.
- The frontend stores the token in `localStorage` and sends
  `Authorization: Bearer <token>`.
- `GET /auth/me` validates the token and returns the current user; the frontend
  uses this on startup to confirm the session.
- `POST /auth/logout` revokes the server-side session; the frontend clears its
  local session regardless of the response.
- No provider-specific auth logic lives in the frontend.

## SPA routing

The app uses `react-router-dom` with client-side routes. Configure the host
(Cloudflare Pages) to serve `index.html` as a fallback for all non-asset paths
so direct navigation to routes like `/tickets/OMNI-000001` works. With Cloudflare
Pages, add a `_redirects` file in `dist/`:

```
/*    /index.html   200
``