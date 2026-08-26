// Central, configurable domain constants for Omni Support.
// In production these values (statuses, priorities, categories, SLA rules)
// should be fetched from /api/admin/settings. They are defined here as
// defaults so the UI renders before the backend is connected.

export const APP_NAME = import.meta.env.VITE_APP_NAME || "Omni Solutions Support";
export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "support@omnisolutions.mt";
export const TICKET_PREFIX = "OMNI";

export const ROLES = {
  ADMIN: "admin",
  AGENT: "agent",
  CLIENT: "client",
};

export const ROLE_LABELS = {
  admin: "Administrator",
  agent: "Support Agent",
  client: "Client",
};

export const STATUSES = [
  { value: "new", label: "New", tone: "blue" },
  { value: "open", label: "Open", tone: "blue" },
  { value: "in_progress", label: "In Progress", tone: "amber" },
  { value: "waiting_customer", label: "Waiting for Customer", tone: "violet" },
  { value: "waiting_internal", label: "Waiting for Internal", tone: "violet" },
  { value: "resolved", label: "Resolved", tone: "green" },
  { value: "closed", label: "Closed", tone: "slate" },
];

export const PRIORITIES = [
  { value: "low", label: "Low", tone: "slate" },
  { value: "normal", label: "Normal", tone: "blue" },
  { value: "high", label: "High", tone: "amber" },
  { value: "urgent", label: "Urgent", tone: "orange" },
  { value: "critical", label: "Critical", tone: "red" },
];

export const CATEGORIES = [
  { value: "general", label: "General Support" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical Issue" },
  { value: "service", label: "Service Request" },
  { value: "other", label: "Other" },
];

// SLA target resolution times (hours). Sourced from system settings in prod.
export const SLA_RULES = {
  critical: 1,
  urgent: 4,
  high: 8,
  normal: 24,
  low: 48,
};

export const MESSAGE_TYPES = {
  CUSTOMER: "customer_message",
  AGENT: "agent_reply",
  INTERNAL: "internal_note",
  SYSTEM: "system_event",
};

export const statusMap = Object.fromEntries(STATUSES.map((s) => [s.value, s]));
export const priorityMap = Object.fromEntries(PRIORITIES.map((p) => [p.value, p]));
export const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

export function formatReference(n) {
  const padded = String(n).padStart(6, "0");
  return TICKET_PREFIX + "-" + padded;
}