import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { customerApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default function CustomerDetail() {
  const { id } = useParams();
  const { data: customer, loading, error, refetch } = useAsync(() => customerApi.get(id), [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (error) return <ErrorState title="Customer not found" description={error.message} onRetry={refetch} />;

  const tickets = customer.tickets || [];
  const open = tickets.filter((t) => !["resolved", "closed"].includes(t.status));
  const previous = tickets.filter((t) => ["resolved", "closed"].includes(t.status));

  return (
    <div className="space-y-5">
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      <div className="flex items-start gap-4">
        <Avatar name={customer.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{customer.name}</h1>
            <Badge tone={customer.status === "active" ? "green" : "slate"}>{customer.status}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" /> {customer.email}</span>
            {customer.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> {customer.phone}</span>}
            <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {customer.organisation?.name || "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total tickets" value={customer.ticket_count} />
        <Stat label="Open tickets" value={customer.open_tickets} />
        <Stat label="Resolved" value={previous.length} />
        <Stat label="Customer since" value={formatDate(customer.created_at)} />
      </div>

      {customer.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-slate-600 dark:text-slate-300">{customer.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Open Tickets ({open.length})</CardTitle></CardHeader>
        {open.length === 0 ? <EmptyState title="No open tickets" /> : <TicketList tickets={open} />}
      </Card>

      <Card>
        <CardHeader><CardTitle>Previous Tickets ({previous.length})</CardTitle></CardHeader>
        {previous.length === 0 ? <EmptyState title="No previous tickets" /> : <TicketList tickets={previous} />}
      </Card>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card>
      <CardContent>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

function TicketList({ tickets }) {
  return (
    <div className="divide-y divide-slate-50 dark:divide-slate-800">
      {tickets.map((t) => (
        <Link key={t.id} to={"/tickets/" + t.reference} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.subject}</p>
            <p className="text-xs text-slate-400 font-mono">{t.reference} · {formatDate(t.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={t.priority} />
            <StatusBadge status={t.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}