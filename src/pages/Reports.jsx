import React, { useState } from "react";
import { Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { reportApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { STATUSES, PRIORITIES, CATEGORIES } from "@/lib/constants";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "custom", label: "Custom" },
];

export default function Reports() {
  const [range, setRange] = useState("7d");
  const { data, loading } = useAsync(() => reportApi.summary({ range }), [range]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Performance and SLA insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => setRange(r.id)} className={"px-3 py-1.5 rounded-md text-xs font-medium " + (range === r.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500")}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Tickets Created" value={data?.total} loading={loading} tone="text-blue-600 bg-blue-50 dark:bg-blue-950" />
        <Kpi icon={CheckCircle2} label="Resolved Today" value={data?.resolvedToday} loading={loading} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-950" />
        <Kpi icon={Clock} label="Avg First Response" value="1h 12m" loading={loading} tone="text-amber-600 bg-amber-50 dark:bg-amber-950" />
        <Kpi icon={Clock} label="Avg Resolution" value="6h 40m" loading={loading} tone="text-violet-600 bg-violet-50 dark:bg-violet-950" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Tickets by Status</CardTitle></CardHeader>
          <CardContent>
            {loading || !data ? <Skeleton className="h-40 w-full" /> : <Bars data={data.byStatus || {}} labels={STATUSES.map((s) => [s.value, s.label])} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tickets by Priority</CardTitle></CardHeader>
          <CardContent>
            {loading || !data ? <Skeleton className="h-40 w-full" /> : <Bars data={data.byPriority || {}} labels={PRIORITIES.map((p) => [p.value, p.label])} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tickets by Category</CardTitle></CardHeader>
          <CardContent>
            {loading || !data ? <Skeleton className="h-40 w-full" /> : <Bars data={data.byCategory || {}} labels={CATEGORIES.map((c) => [c.value, c.label])} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>SLA Compliance</CardTitle></CardHeader>
          <CardContent>
            {loading || !data ? <Skeleton className="h-40 w-full" /> : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Within SLA</span>
                  <span className="font-semibold text-emerald-600">{Math.round(((data.total - data.overdue) / (data.total || 1)) * 100)}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: Math.round(((data.total - data.overdue) / (data.total || 1)) * 100) + "%" }} />
                </div>
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-slate-600 dark:text-slate-300">Overdue</span>
                  <span className="font-semibold text-red-500">{data.overdue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Open vs Resolved</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{data.open} / {data.resolvedToday}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, loading, tone }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={"w-11 h-11 rounded-xl flex items-center justify-center " + tone}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? <Skeleton className="h-7 w-12 inline-block" /> : value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Bars({ data, labels }) {
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