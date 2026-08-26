import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { ticketApi, customerApi, userApi } from "@/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { TicketTable } from "@/components/tickets/TicketTable";
import { ErrorState } from "@/components/ui/EmptyState";
import { STATUSES, PRIORITIES, CATEGORIES } from "@/lib/constants";

const SAVED_VIEWS = [
  { id: "all", label: "All Tickets", params: {} },
  { id: "my-open", label: "My Open Tickets", params: { assigned_me: "u2" } },
  { id: "urgent", label: "Urgent+", params: { priority: "urgent" } },
  { id: "unassigned", label: "Unassigned", params: { unassigned: "true" } },
  { id: "waiting", label: "Waiting for Customer", params: { status: "waiting_customer" } },
  { id: "overdue", label: "Overdue", params: { overdue: "true" } },
];

const PAGE_SIZE = 10;

export default function Tickets() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "", category: "", customer_id: "", assigned_user_id: "", unassigned: "", overdue: "" });
  const [activeView, setActiveView] = useState("all");
  const [sort, setSort] = useState({ key: "updated", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [showFilters, setShowFilters] = useState(true);

  const { data: customers } = useAsync(() => customerApi.list());
  const { data: users } = useAsync(() => userApi.list());

  const viewParams = SAVED_VIEWS.find((v) => v.id === activeView)?.params || {};
  const params = { ...viewParams, ...filters, search: search || undefined };
  Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

  const { data, loading, error, refetch } = useAsync(() => ticketApi.list(params), [activeView, JSON.stringify(filters), search]);

  const sorted = useMemo(() => {
    if (!data?.items) return [];
    const items = [...data.items];
    const dir = sort.dir === "asc" ? 1 : -1;
    items.sort((a, b) => {
      const get = (t, k) => {
        if (k === "customer") return t.customer?.name || "";
        if (k === "assignee") return t.assignee?.name || "";
        if (k === "updated") return t.updated_at;
        if (k === "reference") return t.reference;
        return t[k] || "";
      };
      const av = get(a, sort.key), bv = get(b, sort.key);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return items;
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [activeView, JSON.stringify(filters), search]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }
  function toggle(id) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected((s) => {
      const all = paged.every((t) => s.has(t.id));
      const n = new Set(s);
      if (all) paged.forEach((t) => n.delete(t.id));
      else paged.forEach((t) => n.add(t.id));
      return n;
    });
  }
  function applyView(id) {
    setActiveView(id);
    setFilters({ status: "", priority: "", category: "", customer_id: "", assigned_user_id: "", unassigned: "", overdue: "" });
  }
  async function bulkAssign() {
    const agentId = window.prompt("Assign selected tickets to agent ID (e.g. u2):", "u2");
    if (!agentId) return;
    for (const id of selected) {
      const t = data.items.find((x) => x.id === id);
      if (t) await ticketApi.update(t.reference, { assigned_user_id: agentId });
    }
    setSelected(new Set());
    refetch();
  }
  async function bulkStatus() {
    const status = window.prompt("Set status for selected tickets:", "resolved");
    if (!status) return;
    for (const id of selected) {
      const t = data.items.find((x) => x.id === id);
      if (t) await ticketApi.update(t.reference, { status });
    }
    setSelected(new Set());
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.total ?? "—"} tickets total</p>
        </div>
      </div>

      {/* Saved views */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SAVED_VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => applyView(v.id)}
            className={"px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors " +
              (activeView === v.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700")}
          >
            {v.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference, subject, customer…"
                className="w-full h-9 pl-10 pr-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-transparent focus:border-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </Button>
            {(filters.status || filters.priority || filters.category || filters.unassigned || filters.overdue) && (
              <Button variant="ghost" size="sm" onClick={() => setFilters({ status: "", priority: "", category: "", customer_id: "", assigned_user_id: "", unassigned: "", overdue: "" })}>
                <X className="w-4 h-4" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
                <option value="">All Priorities</option>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
              <Select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Select value={filters.customer_id} onChange={(e) => setFilters((f) => ({ ...f, customer_id: e.target.value }))}>
                <option value="">All Customers</option>
                {(customers?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select value={filters.assigned_user_id} onChange={(e) => setFilters((f) => ({ ...f, assigned_user_id: e.target.value }))}>
                <option value="">All Agents</option>
                {(users?.items || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={filters.unassigned === "true"} onChange={(e) => setFilters((f) => ({ ...f, unassigned: e.target.checked ? "true" : "" }))} className="rounded border-slate-300" />
                  Unassigned
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={filters.overdue === "true"} onChange={(e) => setFilters((f) => ({ ...f, overdue: e.target.checked ? "true" : "" }))} className="rounded border-slate-300" />
                  Overdue
                </label>
              </div>
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selected.size} selected</span>
            <Button variant="secondary" size="sm" onClick={bulkAssign}>Assign</Button>
            <Button variant="secondary" size="sm" onClick={bulkStatus}>Set status</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        {error ? <ErrorState title="Couldn't load tickets" description={error.message} onRetry={refetch} /> : (
          <TicketTable
            tickets={paged}
            loading={loading}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            sort={sort}
            onSort={toggleSort}
          />
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Showing {paged.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + paged.length} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 px-2">{page} / {totalPages}</span>
            <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}