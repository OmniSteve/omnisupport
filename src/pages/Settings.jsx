import React, { useState, useEffect } from "react";
import { useAsync } from "@/lib/useAsync";
import { adminApi } from "@/api";
import { useToast } from "@/context/ToastContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PRIORITIES, STATUSES, CATEGORIES } from "@/lib/constants";

export default function Settings() {
  const { data, loading, refetch } = useAsync(() => adminApi.getSettings());
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (data) setSettings(data); }, [data]);

  async function save() {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success("Settings saved");
      refetch();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure ticket prefixes, SLA rules and system options.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Ticket reference prefix" value={settings.ticket_prefix} onChange={(e) => setSettings((s) => ({ ...s, ticket_prefix: e.target.value }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SLA Rules (resolution hours by priority)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {PRIORITIES.map((p) => (
            <div key={p.value} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300 w-24">{p.label}</span>
              <Input
                type="number"
                value={settings.sla_rules?.[p.value] ?? 0}
                onChange={(e) => setSettings((s) => ({ ...s, sla_rules: { ...s.sla_rules, [p.value]: Number(e.target.value) } }))}
                className="max-w-[120px]"
              />
              <span className="text-xs text-slate-400">hours</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Configurable Lists</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-500">
          <p>Statuses, priorities and categories are managed here in production via /api/admin/settings.</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => <span key={s.value} className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1">{s.label}</span>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => <span key={c.value} className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1">{c.label}</span>)}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>Save changes</Button>
      </div>
    </div>
  );
}