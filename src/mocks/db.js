// In-memory mock database for local development.
// This module is ONLY used when VITE_USE_MOCK !== "false".
// It is fully isolated from React components — swap it for the real
// Cloudflare REST API by setting VITE_USE_MOCK=false.

import { SLA_RULES, formatReference } from "@/lib/constants";

function iso(daysAgo, hoursAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

function dueAt(priority, createdAt) {
  const hours = SLA_RULES[priority] ?? 24;
  const d = new Date(createdAt);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export const db = {
  users: [
    { id: "u1", name: "Alex Mercer", email: "alex@omnisolutions.mt", role: "admin", avatar: null, title: "Support Lead" },
    { id: "u2", name: "Steve Carter", email: "steve@omnisolutions.mt", role: "agent", avatar: null, title: "Senior Agent" },
    { id: "u3", name: "Maria Lopez", email: "maria@omnisolutions.mt", role: "agent", avatar: null, title: "Support Agent" },
    { id: "u4", name: "Daniel Grech", email: "daniel@omnisolutions.mt", role: "agent", avatar: null, title: "Support Agent" },
    { id: "u5", name: "Priya Nair", email: "priya@omnisolutions.mt", role: "agent", avatar: null, title: "Support Agent" },
  ],
  organisations: [
    { id: "o1", name: "Northwind Trading", domain: "northwind.com", status: "active", created_at: iso(120) },
    { id: "o2", name: "Contoso Ltd", domain: "contoso.com", status: "active", created_at: iso(90) },
    { id: "o3", name: "Globex Corporation", domain: "globex.io", status: "active", created_at: iso(60) },
    { id: "o4", name: "Initech", domain: "initech.com", status: "inactive", created_at: iso(200) },
  ],
  customers: [
    { id: "c1", name: "John Pemberton", email: "john@northwind.com", phone: "+356 99112233", organisation_id: "o1", status: "active", notes: "VIP contact. Prefers email.", created_at: iso(80) },
    { id: "c2", name: "Sarah Mitchell", email: "sarah@northwind.com", phone: "+356 99887766", organisation_id: "o1", status: "active", notes: "", created_at: iso(70) },
    { id: "c3", name: "David Chen", email: "david@contoso.com", phone: "+44 20 7946 0011", organisation_id: "o2", status: "active", notes: "Technical lead.", created_at: iso(55) },
    { id: "c4", name: "Emma Wilson", email: "emma@contoso.com", phone: "", organisation_id: "o2", status: "active", notes: "", created_at: iso(40) },
    { id: "c5", name: "Raj Patel", email: "raj@globex.io", phone: "+1 415 555 0199", organisation_id: "o3", status: "active", notes: "", created_at: iso(30) },
    { id: "c6", name: "Lisa Anderson", email: "lisa@initech.com", phone: "", organisation_id: "o4", status: "inactive", notes: "Account suspended.", created_at: iso(150) },
  ],
  tickets: [],
  messages: [],
  activity: [],
  notifications: [],
  knowledgeCategories: [
    { id: "kc1", name: "Getting Started", slug: "getting-started" },
    { id: "kc2", name: "Billing", slug: "billing" },
    { id: "kc3", name: "Technical", slug: "technical" },
    { id: "kc4", name: "Account", slug: "account" },
  ],
  knowledgeArticles: [
    { id: "ka1", title: "How to reset your password", slug: "how-to-reset-your-password", category_id: "kc4", content: "To reset your password, click 'Forgot password' on the login screen and follow the email instructions.", published: true, author_id: "u2", created_at: iso(20), updated_at: iso(5) },
    { id: "ka2", title: "Understanding your invoice", slug: "understanding-your-invoice", category_id: "kc2", content: "Invoices are issued monthly and can be downloaded from the Billing section.", published: true, author_id: "u1", created_at: iso(18), updated_at: iso(18) },
    { id: "ka3", title: "Deploying to Cloudflare", slug: "deploying-to-cloudflare", category_id: "kc3", content: "Connect your Git repository and enable automatic deployments via the dashboard.", published: true, author_id: "u3", created_at: iso(12), updated_at: iso(2) },
    { id: "ka4", title: "Common error codes", slug: "common-error-codes", category_id: "kc3", content: "A reference of common error codes and their meanings.", published: false, author_id: "u4", created_at: iso(6), updated_at: iso(1) },
  ],
  settings: {
    sla_rules: SLA_RULES,
    ticket_prefix: "OMNI",
  },
};

// Seed tickets -------------------------------------------------------------
const seedTickets = [
  { ref: 1, subject: "Website unavailable after deployment", customer_id: "c1", category: "technical", priority: "high", status: "in_progress", assigned_user_id: "u2", tags: ["cloudflare", "production"], created: 2, updated: 0.2 },
  { ref: 2, subject: "Invoice shows incorrect VAT amount", customer_id: "c3", category: "billing", priority: "normal", status: "waiting_customer", assigned_user_id: "u3", tags: ["billing", "vat"], created: 3, updated: 1 },
  { ref: 3, subject: "Feature request: dark mode", customer_id: "c2", category: "feature", priority: "low", status: "open", assigned_user_id: null, tags: ["ui"], created: 4, updated: 4 },
  { ref: 4, subject: "Cannot log in — 2FA code not arriving", customer_id: "c5", category: "account", priority: "urgent", status: "new", assigned_user_id: null, tags: ["2fa", "auth"], created: 0.1, updated: 0.1 },
  { ref: 5, subject: "API returns 500 on bulk import", customer_id: "c3", category: "bug", priority: "critical", status: "in_progress", assigned_user_id: "u2", tags: ["api", "production"], created: 0.3, updated: 0.05 },
  { ref: 6, subject: "Request: additional admin seats", customer_id: "c1", category: "service", priority: "normal", status: "resolved", assigned_user_id: "u4", tags: ["seats"], created: 6, updated: 1 },
  { ref: 7, subject: "Email notifications delayed", customer_id: "c4", category: "technical", priority: "high", status: "waiting_internal", assigned_user_id: "u5", tags: ["email"], created: 1.5, updated: 0.5 },
  { ref: 8, subject: "Dashboard charts not loading", customer_id: "c5", category: "bug", priority: "high", status: "open", assigned_user_id: "u3", tags: ["dashboard"], created: 0.8, updated: 0.8 },
  { ref: 9, subject: "How do I export my data?", customer_id: "c2", category: "general", priority: "low", status: "closed", assigned_user_id: "u4", tags: [], created: 10, updated: 8 },
  { ref: 10, subject: "SSL certificate expiring soon", customer_id: "c1", category: "technical", priority: "urgent", status: "in_progress", assigned_user_id: "u2", tags: ["ssl", "production"], created: 0.5, updated: 0.1 },
  { ref: 11, subject: "Webhook deliveries failing intermittently", customer_id: "c3", category: "technical", priority: "high", status: "waiting_customer", assigned_user_id: "u5", tags: ["webhooks"], created: 2.2, updated: 1.2 },
  { ref: 12, subject: "General enquiry about enterprise plan", customer_id: "c6", category: "general", priority: "normal", status: "new", assigned_user_id: null, tags: ["sales"], created: 0.04, updated: 0.04 },
  { ref: 13, subject: "Mobile app crashes on launch", customer_id: "c5", category: "bug", priority: "critical", status: "in_progress", assigned_user_id: "u3", tags: ["mobile", "crash"], created: 0.2, updated: 0.02 },
  { ref: 14, subject: "Need to update billing contact", customer_id: "c4", category: "billing", priority: "low", status: "resolved", assigned_user_id: "u4", tags: ["billing"], created: 5, updated: 2 },
];

seedTickets.forEach((t) => {
  const created_at = iso(t.created, 0);
  const updated_at = iso(t.updated, 0);
  const ticket = {
    id: "t" + t.ref,
    reference: formatReference(t.ref),
    subject: t.subject,
    description: "Initial report submitted by the customer through the support portal.",
    customer_id: t.customer_id,
    organisation_id: db.customers.find((c) => c.id === t.customer_id).organisation_id,
    category: t.category,
    status: t.status,
    priority: t.priority,
    assigned_user_id: t.assigned_user_id,
    assigned_team_id: null,
    tags: t.tags,
    created_at,
    updated_at,
    due_at: dueAt(t.priority, created_at),
    resolved_at: t.status === "resolved" || t.status === "closed" ? updated_at : null,
    closed_at: t.status === "closed" ? updated_at : null,
  };
  db.tickets.push(ticket);

  db.messages.push({
    id: "m" + t.ref + "-1",
    ticket_id: ticket.id,
    author_id: t.customer_id,
    author_type: "customer",
    message_type: "customer_message",
    content: ticket.subject + " — please could you look into this as soon as possible? Happy to provide more detail if needed.",
    attachments: [],
    created_at,
  });

  if (t.assigned_user_id) {
    db.messages.push({
      id: "m" + t.ref + "-2",
      ticket_id: ticket.id,
      author_id: t.assigned_user_id,
      author_type: "agent",
      message_type: "agent_reply",
      content: "Thanks for reaching out. I've picked this up and am investigating now — I'll keep you posted.",
      attachments: [],
      created_at: updated_at,
    });
  }
  if (t.status === "waiting_customer") {
    db.messages.push({
      id: "m" + t.ref + "-3",
      ticket_id: ticket.id,
      author_id: t.assigned_user_id || "u2",
      author_type: "agent",
      message_type: "agent_reply",
      content: "Could you share a screenshot of the error and the approximate time it occurred?",
      attachments: [],
      created_at: updated_at,
    });
  }
  // an internal note (not visible to clients)
  db.messages.push({
    id: "m" + t.ref + "-int",
    ticket_id: ticket.id,
    author_id: t.assigned_user_id || "u2",
    author_type: "agent",
    message_type: "internal_note",
    content: "Internal: check the deploy logs around the reported time. Possibly related to the CDN cache flush.",
    attachments: [],
    created_at: updated_at,
  });

  db.activity.push({
    id: "a" + t.ref + "-1",
    ticket_id: ticket.id,
    event: "ticket_created",
    description: "Ticket created by customer",
    actor_id: t.customer_id,
    created_at,
  });
  if (t.assigned_user_id) {
    db.activity.push({
      id: "a" + t.ref + "-2",
      ticket_id: ticket.id,
      event: "assigned",
      description: "Assigned to " + db.users.find((u) => u.id === t.assigned_user_id).name,
      actor_id: "u1",
      created_at: updated_at,
    });
  }
  db.activity.push({
    id: "a" + t.ref + "-3",
    ticket_id: ticket.id,
    event: "status_changed",
    description: "Status changed to " + t.status.replace(/_/g, " "),
    actor_id: t.assigned_user_id || "u2",
    created_at: updated_at,
  });
});

db.notifications = [
  { id: "n1", user_id: "u2", title: "Critical ticket assigned", body: "OMNI-000005 — API returns 500 on bulk import", read: false, created_at: iso(0.05), link: "/tickets/OMNI-000005" },
  { id: "n2", user_id: "u2", title: "Customer replied", body: "OMNI-000002 — Invoice shows incorrect VAT amount", read: false, created_at: iso(0.4), link: "/tickets/OMNI-000002" },
  { id: "n3", user_id: "u2", title: "SLA warning", body: "OMNI-000010 approaching SLA deadline", read: true, created_at: iso(1), link: "/tickets/OMNI-000010" },
];

let seq = seedTickets.length + 1;
export function nextRef() {
  return seq++;
}