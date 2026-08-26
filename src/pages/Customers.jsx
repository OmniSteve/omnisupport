import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Building2, Plus } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { customerApi } from "@/api";
import { useToast } from "@/context/ToastContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Customers() {
  const { data, loading, refetch } = useAsync(() => customerApi.list());
  const [search, setSearch] = useState("");
  const toast = useToast();

  const filtered = (data?.items || []).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || (c.organisation?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.items?.length || "—"} contacts across organisations</p>
        </div>
        <Button onClick={() => toast.info("Customer creation will connect to /api/customers (POST) in production.")}>
          <Plus className="w-4 h-4" /> New Customer
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers, companies, emails…" className="w-full h-9 pl-10 pr-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-transparent focus:border-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none" />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map((c) => (
              <Link key={c.id} to={"/customers/" + c.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <Avatar name={c.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.email}{c.phone ? " · " + c.phone : ""}</p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                  <Building2 className="w-3.5 h-3.5" /> {c.organisation?.name || "—"}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{c.open_tickets} open · {c.ticket_count} total</p>
                  <Badge tone={c.status === "active" ? "green" : "slate"}>{c.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}