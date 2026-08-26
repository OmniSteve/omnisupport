import moment from "moment";

export function formatDate(value) {
  if (!value) return "—";
  return moment(value).format("DD MMM YYYY");
}

export function formatDateTime(value) {
  if (!value) return "—";
  return moment(value).format("DD MMM YYYY, HH:mm");
}

export function timeAgo(value) {
  if (!value) return "—";
  return moment(value).fromNow();
}

export function formatRelative(value) {
  if (!value) return "—";
  const m = moment(value);
  const now = moment();
  const diffH = now.diff(m, "hours");
  if (diffH < 1) return m.fromNow();
  if (diffH < 24) return `${diffH}h ago`;
  return m.format("DD MMM YYYY");
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// SLA helpers ---------------------------------------------------------------
export function slaStatus(ticket, slaRules) {
  if (!ticket?.due_at) return { state: "none", label: "No SLA" };
  const due = moment(ticket.due_at);
  const now = moment();
  if (ticket.status === "resolved" || ticket.status === "closed") {
    return { state: "met", label: "SLA met" };
  }
  if (now.isAfter(due)) {
    const over = moment.duration(now.diff(due));
    return { state: "breached", label: `Overdue ${over.humanize()}` };
  }
  const diffH = due.diff(now, "hours");
  if (diffH <= 1) {
    return { state: "warning", label: `Due in ${due.fromNow(true)}` };
  }
  return { state: "ok", label: `Due ${due.fromNow()}` };
}