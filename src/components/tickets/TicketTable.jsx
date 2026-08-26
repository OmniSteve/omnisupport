import React from "react";
import { Link } from "react-router-dom";
import { StatusBadge, PriorityBadge, SlaBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { slaStatus } from "@/lib/format";
import { SLA_RULES } from "@/lib/constants";
import { cn } from "@/lib/cn";

const columns = [
  { key: "reference", label: "Ticket", width: "w-32" },
  { key: "subject", label: "Subject" },
  { key: "customer", label: "Customer", width: "w-44" },
  { key: "category", label: "Category", width: "w-36" },
  { key: "priority", label: "Priority", width: "w-28" },
  { key: "status", label: "Status", width: "w-36" },
  { key: "assignee", label: "Assigned", width: "w-40" },
  { key: "updated", label: "Updated", width: "w-28" },
  { key: "sla", label: "SLA", width: "w-28" },
];

export function TicketTable({ tickets, loading, selected, onToggle, onToggleAll, sort, onSort }) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (!tickets || tickets.length === 0) {
    return <EmptyState title="No tickets found" description="Try adjusting your filters or create a new ticket." />;
  }

  const allSelected = selected && tickets.every((t) => selected.has(t.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
            {selected && (
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={!!allSelected} onChange={onToggleAll} className="rounded border-slate-300" />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide", c.width)}>
                <button
                  onClick={() => onSort && onSort(c.key)}
                  className={cn("inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300", !onSort && "cursor-default")}
                >
                  {c.label}
                  {sort?.key === c.key && <span className="text-slate-400">{sort.dir === "asc" ? "▲" : "▼"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const sla = slaStatus(t, SLA_RULES);
            return (
              <tr
                key={t.id}
                className={cn(
                  "border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors",
                  selected?.has(t.id) && "bg-blue-50/40 dark:bg-blue-950/20"
                )}
              >
                {selected && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => onToggle(t.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link to={"/tickets/" + t.reference} className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600">
                    {t.reference}
                  </Link>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <Link to={"/tickets/" + t.reference} className="block truncate font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate">{t.customer?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{t.category?.replace(/_/g, " ")}</td>
                <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  {t.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={t.assignee.name} size="xs" />
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{t.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{timeShort(t.updated_at)}</td>
                <td className="px-4 py-3"><SlaBadge state={sla.state} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function timeShort(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 3600000;
  if (diff < 24) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}