# Deployment Guide (Cloudflare)

The Omni Support frontend is a standard Vite SPA and can be deployed anywhere.
The intended production stack is Cloudflare.

## Frontend → Cloudflare Pages

```bash
npm install
npm run build      # outputs dist/
```

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables (Pages → Settings → Environment variables):**
  - `VITE_API_BASE_URL` = `https://api.omnisolutions.mt` (your Worker URL)
  - `VITE_USE_MOCK` = `false`

## Backend → Cloudflare Workers

Implement the REST API in [`docs/API.md`](API.md) as a Worker (or set of
Workers). Suggested framework: Hono. Bindings:

- **D1** — database (`DB` binding). Schema mirrors the data models in `API.md`.
- **R2** — attachments (`BUCKET` binding). Uploads return a public/signed URL.
- **Secrets** — JWT signing key, email provider key, etc. Set via
  `wrangler secret put ...` — never in the frontend bundle.

## Database → Cloudflare D1

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

## Attachments → Cloudflare R2

- Upload endpoint `POST /api/attachments` accepts multipart files, stores them
  in R2, and returns `{ url, name, size }`.
- The frontend references only the returned URL on tickets/messages — files
  are never embedded as Base64.

## Email (future)

Email-in ticket creation (`support@omnisolutions.mt` → new ticket) and outbound
reply emails are a **backend** concern. The frontend only exposes clean
abstractions (e.g. `POST /api/tickets` from a webhook). Do not hardcode an email
provider in the frontend.

## Auth

- The Worker issues JWTs on `/api/auth/login` and verifies them on every
  protected request.
- The frontend stores the token in `localStorage` and sends
  `Authorization: Bearer <token>`.
- No provider-specific auth logic lives in the frontend.

## Removing Base44 before export

See the "Removing Base44 from the exported project" section in the root
`README.md`. After those steps, `grep -ri base44 src/` returns nothing and the
project builds with plain `npm install && npm run build`.