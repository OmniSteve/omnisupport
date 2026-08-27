# REST API Contract

The Omni Support frontend talks to a REST API at `VITE_API_BASE_URL`. The mock
router (`src/mocks/handlers.js`) implements this exact contract, so it serves as
both the dev backend and the specification for the real Cloudflare Workers
backend.

## Base URL convention

The frontend calls logical paths (e.g. `/auth/login`, `/tickets`) and prepends
`VITE_API_BASE_URL`. The frontend does **not** add an extra `/api`, so
`VITE_API_BASE_URL` must include the `/api` segment:

```
VITE_API_BASE_URL=/api
request("/auth/login")  →  /api/auth/login

VITE_API_BASE_URL=https://api.omnisolutions.mt/api
request("/auth/login")  →  https://api.omnisolutions.mt/api/auth/login
```

All requests use JSON. Authenticated requests send
`Authorization: Bearer <token>`. Errors return `{ "error": "<message>",
"details": ... }` with an appropriate HTTP status.

---

## Authentication

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | — | `user` (validates the token) |
| POST | `/auth/logout` | — | `{ ok: true }` |

> Future endpoints (not yet implemented): `POST /auth/forgot-password`,
> `POST /auth/reset-password`. The corresponding UI screens are intentionally
> omitted until the backend supports them.

## Tickets

| Method | Path | Query / Body | Returns |
|---|---|---|---|
| GET | `/tickets` | `status, priority, category, customer_id, assigned_user_id, unassigned, overdue, assigned_me, search` | `{ items: Ticket[], total }` |
| POST | `/tickets` | `{ customer_id, subject, description, category, priority, assigned_user_id, assigned_team_id, tags, attachments }` | `Ticket` |
| GET | `/tickets/:reference` | — | `Ticket` |
| PATCH | `/tickets/:reference` | `{ status?, priority?, category?, assigned_user_id?, tags?, due_at? }` | `Ticket` |
| GET | `/tickets/:reference/messages` | — | `{ items: Message[] }` |
| POST | `/tickets/:reference/messages` | `{ author_id, author_type, message_type, content, attachments }` | `Message` |
| GET | `/tickets/:reference/activity` | — | `{ items: Activity[] }` |

## Customers & Organisations

| Method | Path | Returns |
|---|---|---|
| GET | `/customers` | `{ items: Customer[] }` |
| POST | `/customers` | `Customer` |
| GET | `/customers/:id` | `Customer` (with `tickets: Ticket[]`) |
| GET | `/organisations` | `{ items: Organisation[] }` |

## Users & Teams

| Method | Path | Returns |
|---|---|---|
| GET | `/users` | `{ items: User[] }` |
| GET | `/teams` | `{ items: Team[] }` |

## Reports

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/reports/summary` | `range` | summary object (see below) |

```json
{
  "open": 8, "awaiting": 2, "inProgress": 3, "resolvedToday": 1, "overdue": 1, "total": 14,
  "byStatus": { "new": 2, "open": 2, "in_progress": 3 },
  "byPriority": { "low": 3, "normal": 4, "high": 4, "urgent": 2, "critical": 1 },
  "byCategory": { "technical": 4, "bug": 3 },
  "byAgent": { "Steve Carter": 4, "Maria Lopez": 3 },
  "trend": [{ "date": "2026-08-20", "count": 2 }]
}
```

## Knowledge Base

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/knowledge/categories` | — | `{ items: Category[] }` |
| GET | `/knowledge/articles` | `published` | `{ items: Article[] }` |

## Notifications

| Method | Path | Returns |
|---|---|---|
| GET | `/notifications` | `{ items: Notification[] }` |

## Admin / Settings

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/admin/settings` | — | `Settings` |
| PUT | `/admin/settings` | `Settings` | `Settings` |

## Attachments (R2-ready)

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/attachments` | `multipart/form-data` | `{ url, name, size }` |
| GET | `/attachments/:id` | — | file stream (authorized) |

Attachments are never stored as Base64 in the database — only the returned URL
is referenced on the ticket/message.

---

## Data models

```text
Ticket { id, reference, subject, description, customer_id, organisation_id,
  category, status, priority, assigned_user_id, assigned_team_id,
  tags[], created_at, updated_at, due_at, resolved_at, closed_at }

Message { id, ticket_id, author_id, author_type, message_type, content,
  attachments[], created_at }
  message_type: customer_message | agent_reply | internal_note | system_event

Customer { id, name, company, email, phone, organisation_id, status, notes, created_at }
Organisation { id, name, domain, status, created_at }
User { id, name, email, role, title }
Team { id, name }
Activity { id, ticket_id, event, description, actor_id, created_at }
Notification { id, user_id, title, body, read, link, created_at }
KnowledgeArticle { id, title, slug, category_id, content, published, author_id, created_at, updated_at }
Settings { ticket_prefix, sla_rules, statuses[], priorities[], categories[] }
```

## Security (backend-enforced)

The frontend hides controls by role, but the backend **must** enforce:
authentication, role permissions, ticket ownership, customer isolation,
internal-note visibility (never returned to client users), file access, and
admin privileges.