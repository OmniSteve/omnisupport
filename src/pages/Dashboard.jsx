import React from "react";
import { Link } from "react-router-dom";
import {
  Ticket, Clock, Loader, CheckCircle2, AlertOctagon, TrendingUp, ArrowRight,
} from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { reportApi, ticketApi } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { TicketTable } from "@/components/tickets/TicketTable";
import { STATUSES, PRIORITIES, CATEGORIES } from "@/lib/constants";

const kpiConfig = [
  { key: "open", label: "Open Tickets", icon: Ticket, tone: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
  { key: "awaiting", label: "Awaiting Response", icon: Clock, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950" },
  { key: "inProgress", label: "In Progress", icon: Loader, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
  { key: "resolvedToday", label: "Resolved Today", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
  { key: "overdue", label: "Overdue", icon: AlertOctagon, tone: "text-red-600 bg-red-50 dark:bg-red-950" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, loading } = useAsync(() => reportApi.summary());
  const { data: recent } = useAsync(() => ticketApi.list());
  const { data: mine } = useAsync(() => ticketApi.list({ assigned_me: user?.id || "u2" }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Operational overview of your support queue.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiConfig.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.key} className="overflow-hidden">
              <CardContent className="flex items-center gap-4">
                <div className={"w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 " + k.tone}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {loading ? <Skeleton className="h-7 w-10" /> : (summary?.[k.key] ?? 0)}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle>Tickets created (last 7 days)</CardTitle>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            {loading || !summary ? <Skeleton className="h-48 w-full" /> : <TrendChart data={summary.trend || []} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
          <CardContent>
            {loading || !summary ? <Skeleton className="h-48 w-full" /> : <BreakdownBars data={summary.byStatus || {}} labels={STATUSES.map((s) => [s.value, s.label])} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>By Priority</CardTitle></CardHeader>
          <CardContent>
            {loading || !summary ? <Skeleton className="h-40 w-full" /> : <BreakdownBars data={summary.byPriority || {}} labels={PRIORITIES.map((p) => [p.value, p.label])} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By Category</CardTitle></CardHeader>
          <CardContent>
            {loading || !summary ? <Skeleton className="h-40 w-full" /> : <BreakdownBars data={summary.byCategory || {}} labels={CATEGORIES.map((c) => [c.value, c.label])} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Per Agent</CardTitle></CardHeader>
          <CardContent>
            {loading || !summary ? <Skeleton className="h-40 w-full" /> : <AgentBars data={summary.byAgent || {}} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between flex-row">
          <CardTitle>Recent Tickets</CardTitle>
          <Link to="/tickets" className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <TicketTable tickets={(recent?.items || []).slice(0, 8)} loading={!recent} />
      </Card>

      <Card>
        <CardHeader><CardTitle>My Work Queue</CardTitle></CardHeader>
        {!mine ? <TicketTable tickets={[]} loading /> : (mine.items?.length ? <TicketTable tickets={mine.items} loading={false} /> : <EmptyState title="No tickets assigned to you" />)}
      </Card>
    </div>
  );
}

function TrendChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end justify-between gap-2 h-48">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex items-end justify-center h-full">
            <div
              className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-slate-200 to-slate-900 dark:from-slate-700 dark:to-slate-400 transition-all hover:from-blue-200 hover:to-blue-600"
              style={{ height: (d.count / max) * 100 + "%" }}
              title={d.count + " tickets"}
            />
          </div>
          <span className="text-[10px] text-slate-400">{new Date(d.date).toLocaleDateString([], { weekday: "short" })}</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownBars({ data, labels }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-2.5">
      {labels.map(([value, label]) => {
        const count = data[value] || 0;
        return (
          <div key={value}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300">{label}</span>
              <span className="text-slate-400">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-slate-900 dark:bg-slate-300" style={{ width: (count / total) * 100 + "%" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgentBars({ data }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  if (!entries.length) return <p className="text-sm text-slate-400">No assignments yet.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([name, count]) => (
        <div key={name} className="flex items-center gap-3">
          <Avatar name={name} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300 truncate">{name}</span>
              <span className="text-slate-400">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: (count / max) * 100 + "%" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}