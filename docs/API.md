# REST API Contract

The Omni Support frontend talks to a REST API at `VITE_API_BASE_URL`. The mock
router (`src/mocks/handlers.js`) implements this exact contract, so it serves as
both the dev backend and the specification for the real Cloudflare Workers
backend.

All requests use JSON. Authenticated requests send
`Authorization: Bearer <token>`. Errors return `{ "error": "<message>",
"details": ... }` with an appropriate HTTP status.

---

## Authentication

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — | `user` |
| POST | `/api/auth/logout` | — | `204` |

## Tickets

| Method | Path | Query / Body | Returns |
|---|---|---|---|
| GET | `/api/tickets` | `status, priority, category, customer_id, assigned_user_id, unassigned, overdue, assigned_me, search` | `{ items: Ticket[], total }` |
| POST | `/api/tickets` | `{ customer_id, subject, description, category, priority, assigned_user_id, assigned_team_id, tags, attachments }` | `Ticket` |
| GET | `/api/tickets/:reference` | — | `Ticket` |
| PATCH | `/api/tickets/:reference` | `{ status?, priority?, category?, assigned_user_id?, tags?, due_at? }` | `Ticket` |
| GET | `/api/tickets/:reference/messages` | — | `{ items: Message[] }` |
| POST | `/api/tickets/:reference/messages` | `{ author_id, author_type, message_type, content, attachments }` | `Message` |
| GET | `/api/tickets/:reference/activity` | — | `{ items: Activity[] }` |

## Customers & Organisations

| Method | Path | Returns |
|---|---|---|
| GET | `/api/customers` | `{ items: Customer[] }` |
| POST | `/api/customers` | `Customer` |
| GET | `/api/customers/:id` | `Customer` (with `tickets: Ticket[]`) |
| GET | `/api/organisations` | `{ items: Organisation[] }` |

## Users & Teams

| Method | Path | Returns |
|---|---|---|
| GET | `/api/users` | `{ items: User[] }` |
| GET | `/api/teams` | `{ items: Team[] }` |

## Reports

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/reports/summary` | `range` | summary object (see below) |

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
| GET | `/api/knowledge/categories` | — | `{ items: Category[] }` |
| GET | `/api/knowledge/articles` | `published` | `{ items: Article[] }` |

## Notifications

| Method | Path | Returns |
|---|---|---|
| GET | `/api/notifications` | `{ items: Notification[] }` |

## Admin / Settings

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/settings` | — | `Settings` |
| PUT | `/api/admin/settings` | `Settings` | `Settings` |

## Attachments (R2-ready)

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/attachments` | `multipart/form-data` | `{ url, name, size }` |
| GET | `/api/attachments/:id` | — | file stream (authorized) |

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