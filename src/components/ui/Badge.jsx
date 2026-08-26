import React from "react";
import { cn } from "@/lib/cn";

const tones = {
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/30",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/30",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/30",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-400/30",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/30",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-400/30",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/30",
};

export function Badge({ tone = "slate", className, children, dot }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        tones[tone] || tones.slate,
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, withLabel = true }) {
  const map = {
    new: { tone: "blue", label: "New" },
    open: { tone: "blue", label: "Open" },
    in_progress: { tone: "amber", label: "In Progress" },
    waiting_customer: { tone: "violet", label: "Waiting for Customer" },
    waiting_internal: { tone: "violet", label: "Waiting for Internal" },
    resolved: { tone: "green", label: "Resolved" },
    closed: { tone: "slate", label: "Closed" },
  };
  const s = map[status] || { tone: "slate", label: status };
  return <Badge tone={s.tone} dot>{withLabel ? s.label : null}</Badge>;
}

export function PriorityBadge({ priority }) {
  const map = {
    low: { tone: "slate", label: "Low" },
    normal: { tone: "blue", label: "Normal" },
    high: { tone: "amber", label: "High" },
    urgent: { tone: "orange", label: "Urgent" },
    critical: { tone: "red", label: "Critical" },
  };
  const p = map[priority] || { tone: "slate", label: priority };
  return (
    <Badge tone={p.tone}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-slate-400": p.tone === "slate",
        "bg-blue-500": p.tone === "blue",
        "bg-amber-500": p.tone === "amber",
        "bg-orange-500": p.tone === "orange",
        "bg-red-500": p.tone === "red",
      })} />
      {p.label}
    </Badge>
  );
}

export function SlaBadge({ state }) {
  const map = {
    ok: { tone: "green", label: "On track" },
    warning: { tone: "amber", label: "At risk" },
    breached: { tone: "red", label: "Overdue" },
    met: { tone: "slate", label: "SLA met" },
    none: { tone: "slate", label: "—" },
  };
  const s = map[state] || map.none;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}