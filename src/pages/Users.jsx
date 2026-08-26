import React from "react";
import { useAsync } from "@/lib/useAsync";
import { userApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROLE_LABELS } from "@/lib/constants";

export default function Users() {
  const { data, loading } = useAsync(() => userApi.list());
  const { data: teams } = useAsync(() => userApi.teams());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Users & Teams</h1>
        <p className="text-sm text-slate-500 mt-1">Manage support agents and administrators.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {(data?.items || []).map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-4 py-3">
                <Avatar name={u.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="hidden md:block text-xs text-slate-500">{u.title}</span>
                <Badge tone={u.role === "admin" ? "violet" : u.role === "agent" ? "blue" : "slate"}>{ROLE_LABELS[u.role] || u.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(teams?.items || []).map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">Team assignment ready — individual assignment used by default.</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}