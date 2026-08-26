import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paperclip, X, ArrowLeft } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { ticketApi, customerApi, userApi } from "@/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PRIORITIES, CATEGORIES } from "@/lib/constants";

export default function NewTicket() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { data: customers } = useAsync(() => customerApi.list());
  const { data: users } = useAsync(() => userApi.list());

  const [form, setForm] = useState({
    customer_id: "",
    subject: "",
    description: "",
    category: "general",
    priority: "normal",
    assigned_user_id: "",
    tags: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);

  const isClient = user?.role === "client";

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function onFiles(e) {
    const files = Array.from(e.target.files || []);
    setAttachments((a) => [...a, ...files.map((f) => ({ name: f.name, size: f.size, type: f.type }))]);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.subject || (!isClient && !form.customer_id)) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        attachments: attachments.map((a) => ({ name: a.name, size: a.size })),
        customer_id: isClient ? user?.id : form.customer_id,
      };
      const ticket = await ticketApi.create(payload);
      toast.success("Ticket " + ticket.reference + " created");
      navigate("/tickets/" + ticket.reference);
    } catch (err) {
      toast.error(err.message || "Could not create ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">New Ticket</h1>
        <p className="text-sm text-slate-500 mt-1">Create a new support request.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Ticket details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {!isClient && (
              <Select label="Customer" value={form.customer_id} onChange={(e) => set("customer_id", e.target.value)} required>
                <option value="">Select customer…</option>
                {(customers?.items || []).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.organisation?.name || ""}</option>)}
              </Select>
            )}
            <Input label="Subject" value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Brief summary of the issue" required />
            <Textarea label="Description" rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the issue in detail…" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Category" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Select label="Priority" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </div>

            {!isClient && (
              <Select label="Assign to agent" value={form.assigned_user_id} onChange={(e) => set("assigned_user_id", e.target.value)}>
                <option value="">Leave unassigned</option>
                {(users?.items || []).filter((u) => u.role !== "client").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            )}

            <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="cloudflare, production, billing" />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Attachments</label>
              <label className="flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Paperclip className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">Click to upload files</span>
                <input type="file" multiple className="hidden" onChange={onFiles} />
              </label>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                      <span className="text-slate-700 dark:text-slate-200 truncate">{a.name}</span>
                      <button type="button" onClick={() => setAttachments((arr) => arr.filter((_, x) => x !== i))} className="text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create ticket</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}