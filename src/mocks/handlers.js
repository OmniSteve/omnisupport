// Mock API router. Parses REST-style paths and operates on the in-memory db.
// Mirrors the production endpoint contract documented in README.md so that
// switching VITE_USE_MOCK=false requires no UI changes.

import { db, nextRef } from "./db";
import { SLA_RULES, formatReference, statusMap, priorityMap } from "@/lib/constants";

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function ok(data) {
  return { status: 200, data };
}
function created(data) {
  return { status: 201, data };
}
function err(message, status = 400, details) {
  return { status, error: message, details };
}

function parseQuery(search) {
  const params = {};
  if (!search) return params;
  new URLSearchParams(search).forEach((v, k) => {
    params[k] = v;
  });
  return params;
}

function hydrateTicket(t) {
  const customer = db.customers.find((c) => c.id === t.customer_id);
  const organisation = db.organisations.find((o) => o.id === t.organisation_id);
  const assignee = t.assigned_user_id ? db.users.find((u) => u.id === t.assigned_user_id) : null;
  return {
    ...t,
    customer: customer ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } : null,
    organisation: organisation ? { id: organisation.id, name: organisation.name } : null,
    assignee: assignee ? { id: assignee.id, name: assignee.name, avatar: assignee.avatar } : null,
  };
}

function hydrateCustomer(c) {
  const org = db.organisations.find((o) => o.id === c.organisation_id);
  const tickets = db.tickets.filter((t) => t.customer_id === c.id);
  return {
    ...c,
    organisation: org ? { id: org.id, name: org.name } : null,
    ticket_count: tickets.length,
    open_tickets: tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length,
  };
}

// Main entry — called by src/api/client.js
export async function handleMock(method, path, body) {
  await delay();
  const [rawPath, search] = path.split("?");
  const q = parseQuery(search);
  const segments = rawPath.split("/").filter(Boolean);
  const m = method.toUpperCase();

  // ---- AUTH ----
  if (rawPath === "/auth/login" && m === "POST") {
    const user = db.users.find((u) => u.email === body?.email);
    if (!user) return err("Invalid credentials", 401);
    return ok({ token: "mock-" + user.id, user });
  }
  if (rawPath === "/auth/me" && m === "GET") {
    const user = db.users[0];
    return ok(user);
  }
  if (rawPath === "/auth/logout" && m === "POST") {
    return ok({ ok: true });
  }

  // ---- TICKETS ----
  if (rawPath === "/tickets" && m === "GET") {
    let list = [...db.tickets];
    if (q.status) list = list.filter((t) => t.status === q.status);
    if (q.priority) list = list.filter((t) => t.priority === q.priority);
    if (q.category) list = list.filter((t) => t.category === q.category);
    if (q.customer_id) list = list.filter((t) => t.customer_id === q.customer_id);
    if (q.assigned_user_id) list = list.filter((t) => t.assigned_user_id === q.assigned_user_id);
    if (q.unassigned === "true") list = list.filter((t) => !t.assigned_user_id);
    if (q.overdue === "true") list = list.filter((t) => t.due_at && new Date(t.due_at) < new Date() && !["resolved", "closed"].includes(t.status));
    if (q.assigned_me && q.assigned_me !== "false") list = list.filter((t) => t.assigned_user_id === q.assigned_me);
    if (q.search) {
      const s = q.search.toLowerCase();
      list = list.filter((t) => {
        const cust = db.customers.find((c) => c.id === t.customer_id);
        return (
          t.reference.toLowerCase().includes(s) ||
          t.subject.toLowerCase().includes(s) ||
          (cust && cust.name.toLowerCase().includes(s))
        );
      });
    }
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return ok({ items: list.map(hydrateTicket), total: list.length });
  }
  if (rawPath === "/tickets" && m === "POST") {
    const ref = nextRef();
    const now = new Date().toISOString();
    const hours = SLA_RULES[body.priority || "normal"] ?? 24;
    const due = new Date(); due.setHours(due.getHours() + hours);
    const customer = db.customers.find((c) => c.id === body.customer_id) || db.customers[0];
    const ticket = {
      id: "t" + ref,
      reference: formatReference(ref),
      subject: body.subject,
      description: body.description || "",
      customer_id: customer.id,
      organisation_id: customer.organisation_id,
      category: body.category || "general",
      status: "new",
      priority: body.priority || "normal",
      assigned_user_id: body.assigned_user_id || null,
      assigned_team_id: body.assigned_team_id || null,
      tags: body.tags || [],
      created_at: now,
      updated_at: now,
      due_at: due.toISOString(),
      resolved_at: null,
      closed_at: null,
    };
    db.tickets.push(ticket);
    db.messages.push({
      id: "m" + ref + "-1",
      ticket_id: ticket.id,
      author_id: customer.id,
      author_type: "customer",
      message_type: "customer_message",
      content: body.description || body.subject,
      attachments: body.attachments || [],
      created_at: now,
    });
    db.activity.push({ id: "a" + ref, ticket_id: ticket.id, event: "ticket_created", description: "Ticket created", actor_id: customer.id, created_at: now });
    if (body.assigned_user_id) {
      db.activity.push({ id: "a" + ref + "-a", ticket_id: ticket.id, event: "assigned", description: "Assigned to " + (db.users.find((u) => u.id === body.assigned_user_id)?.name || "agent"), actor_id: "u1", created_at: now });
    }
    return created(hydrateTicket(ticket));
  }
  if (segments[0] === "tickets" && segments[1] && segments.length === 2) {
    const ref = segments[1];
    const t = db.tickets.find((x) => x.reference === ref || x.id === ref);
    if (!t) return err("Ticket not found", 404);
    if (m === "GET") return ok(hydrateTicket(t));
    if (m === "PATCH") {
      const changes = [];
      if (body.status && body.status !== t.status) {
        changes.push({ field: "status", from: t.status, to: body.status });
        t.status = body.status;
        if (body.status === "resolved") t.resolved_at = new Date().toISOString();
        if (body.status === "closed") t.closed_at = new Date().toISOString();
      }
      if (body.priority && body.priority !== t.priority) changes.push({ field: "priority", from: t.priority, to: body.priority }), (t.priority = body.priority);
      if (body.category && body.category !== t.category) changes.push({ field: "category", from: t.category, to: body.category }), (t.category = body.category);
      if ("assigned_user_id" in body && body.assigned_user_id !== t.assigned_user_id) {
        changes.push({ field: "assigned", from: t.assigned_user_id, to: body.assigned_user_id });
        t.assigned_user_id = body.assigned_user_id;
      }
      if (body.tags) t.tags = body.tags;
      if (body.due_at) t.due_at = body.due_at;
      t.updated_at = new Date().toISOString();
      changes.forEach((c) => {
        const label = c.field === "status" ? `Status changed from ${statusMap[c.from]?.label || c.from} to ${statusMap[c.to]?.label || c.to}`
          : c.field === "priority" ? `Priority changed from ${priorityMap[c.from]?.label || c.from} to ${priorityMap[c.to]?.label || c.to}`
          : c.field === "assigned" ? `Assigned to ${db.users.find((u) => u.id === c.to)?.name || "Unassigned"}`
          : `${c.field} updated`;
        db.activity.push({ id: "a" + t.id + "-" + Date.now(), ticket_id: t.id, event: c.field + "_changed", description: label, actor_id: "u1", created_at: new Date().toISOString() });
      });
      return ok(hydrateTicket(t));
    }
  }
  if (segments[0] === "tickets" && segments[2] === "messages" && m === "POST") {
    const t = db.tickets.find((x) => x.reference === segments[1] || x.id === segments[1]);
    if (!t) return err("Ticket not found", 404);
    const now = new Date().toISOString();
    const msg = {
      id: "m" + t.id + "-" + Date.now(),
      ticket_id: t.id,
      author_id: body.author_id || "u1",
      author_type: body.author_type || "agent",
      message_type: body.message_type || "agent_reply",
      content: body.content,
      attachments: body.attachments || [],
      created_at: now,
    };
    db.messages.push(msg);
    t.updated_at = now;
    if (body.message_type === "agent_reply" && t.status === "waiting_customer") t.status = "in_progress";
    db.activity.push({ id: "a" + t.id + "-" + Date.now(), ticket_id: t.id, event: body.message_type === "internal_note" ? "internal_note" : "agent_replied", description: body.message_type === "internal_note" ? "Internal note added" : "Agent replied", actor_id: body.author_id, created_at: now });
    return created(msg);
  }
  if (segments[0] === "tickets" && segments[2] === "messages" && m === "GET") {
    const t = db.tickets.find((x) => x.reference === segments[1] || x.id === segments[1]);
    if (!t) return err("Ticket not found", 404);
    return ok({ items: db.messages.filter((m2) => m2.ticket_id === t.id) });
  }
  if (segments[0] === "tickets" && segments[2] === "activity" && m === "GET") {
    const t = db.tickets.find((x) => x.reference === segments[1] || x.id === segments[1]);
    if (!t) return err("Ticket not found", 404);
    return ok({ items: db.activity.filter((a) => a.ticket_id === t.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) });
  }

  // ---- CUSTOMERS ----
  if (rawPath === "/customers" && m === "GET") return ok({ items: db.customers.map(hydrateCustomer) });
  if (rawPath === "/customers" && m === "POST") {
    const c = { id: "c" + Date.now(), created_at: new Date().toISOString(), status: "active", notes: "", ...body };
    db.customers.push(c);
    return created(hydrateCustomer(c));
  }
  if (segments[0] === "customers" && segments[1] && m === "GET") {
    const c = db.customers.find((x) => x.id === segments[1]);
    if (!c) return err("Customer not found", 404);
    const tickets = db.tickets.filter((t) => t.customer_id === c.id).map(hydrateTicket);
    return ok({ ...hydrateCustomer(c), tickets });
  }
  if (segments[0] === "organisations" && m === "GET") return ok({ items: db.organisations });

  // ---- USERS ----
  if (rawPath === "/users" && m === "GET") return ok({ items: db.users });
  if (rawPath === "/teams" && m === "GET") return ok({ items: [{ id: "team1", name: "Tier 1 Support" }, { id: "team2", name: "Tier 2 Escalations" }] });

  // ---- REPORTS ----
  if (rawPath === "/reports/summary" && m === "GET") {
    const tickets = db.tickets;
    const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length;
    const awaiting = tickets.filter((t) => t.status === "waiting_customer").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolvedToday = tickets.filter((t) => t.resolved_at && new Date(t.resolved_at).toDateString() === new Date().toDateString()).length;
    const overdue = tickets.filter((t) => t.due_at && new Date(t.due_at) < new Date() && !["resolved", "closed"].includes(t.status)).length;
    const byStatus = {};
    tickets.forEach((t) => (byStatus[t.status] = (byStatus[t.status] || 0) + 1));
    const byPriority = {};
    tickets.forEach((t) => (byPriority[t.priority] = (byPriority[t.priority] || 0) + 1));
    const byCategory = {};
    tickets.forEach((t) => (byCategory[t.category] = (byCategory[t.category] || 0) + 1));
    const byAgent = {};
    tickets.forEach((t) => {
      if (t.assigned_user_id) {
        const u = db.users.find((x) => x.id === t.assigned_user_id);
        byAgent[u?.name || "Unassigned"] = (byAgent[u?.name || "Unassigned"] || 0) + 1;
      }
    });
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const count = tickets.filter((t) => new Date(t.created_at).toDateString() === d.toDateString()).length;
      trend.push({ date: d.toISOString().slice(0, 10), count });
    }
    return ok({ open, awaiting, inProgress, resolvedToday, overdue, total: tickets.length, byStatus, byPriority, byCategory, byAgent, trend });
  }

  // ---- KNOWLEDGE ----
  if (rawPath === "/knowledge/categories" && m === "GET") return ok({ items: db.knowledgeCategories });
  if (rawPath === "/knowledge/articles" && m === "GET") {
    let list = db.knowledgeArticles;
    if (q.published === "true") list = list.filter((a) => a.published);
    return ok({ items: list });
  }

  // ---- NOTIFICATIONS ----
  if (rawPath === "/notifications" && m === "GET") return ok({ items: db.notifications });

  // ---- ADMIN / SETTINGS ----
  if (rawPath === "/admin/settings" && m === "GET") return ok(db.settings);
  if (rawPath === "/admin/settings" && m === "PUT") {
    db.settings = { ...db.settings, ...body };
    return ok(db.settings);
  }

  return err("Not found: " + m + " " + rawPath, 404);
}