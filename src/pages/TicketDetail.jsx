import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Paperclip, X, Send, Lock, MessageSquare, History, Tag, Plus,
} from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { ticketApi, userApi } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Textarea, Select } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, PriorityBadge, Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/EmptyState";
import { STATUSES, PRIORITIES, CATEGORIES } from "@/lib/constants";
import { formatRelative, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function TicketDetail() {
  const { reference } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isStaff = user?.role !== "client";

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [composer, setComposer] = useState({ mode: "reply", content: "", attachments: [] });
  const [sending, setSending] = useState(false);
  const [newTag, setNewTag] = useState("");

  const { data: users } = useAsync(() => userApi.list());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [t, m, a] = await Promise.all([
        ticketApi.get(reference),
        ticketApi.messages(reference),
        ticketApi.activity(reference),
      ]);
      setTicket(t);
      setMessages(m.items || []);
      setActivity(a.items || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [reference]);

  async function patch(data) {
    try {
      const updated = await ticketApi.update(reference, data);
      setTicket(updated);
      toast.success("Ticket updated");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function sendMessage() {
    if (!composer.content.trim()) return;
    setSending(true);
    try {
      await ticketApi.addMessage(reference, {
        author_id: user?.id || "u2",
        author_type: isStaff ? "agent" : "customer",
        message_type: composer.mode === "internal" ? "internal_note" : isStaff ? "agent_reply" : "customer_message",
        content: composer.content,
        attachments: composer.attachments.map((a) => ({ name: a.name, size: a.size })),
      });
      setComposer({ mode: composer.mode, content: "", attachments: [] });
      toast.success(composer.mode === "internal" ? "Internal note added" : "Reply sent");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  function addTag() {
    if (!newTag.trim() || !ticket) return;
    const tags = [...new Set([...(ticket.tags || []), newTag.trim()])];
    patch({ tags });
    setNewTag("");
  }
  function removeTag(tag) {
    patch({ tags: (ticket.tags || []).filter((t) => t !== tag) });
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (error) return <ErrorState title="Ticket not found" description={error.message} onRetry={() => navigate("/tickets")} />;

  const internalMode = composer.mode === "internal";

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/tickets")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to tickets
      </button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-semibold text-slate-500">{ticket.reference}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">{ticket.subject}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
            <span>Customer: <span className="text-slate-700 dark:text-slate-300 font-medium">{ticket.customer?.name}</span></span>
            <span>Company: <span className="text-slate-700 dark:text-slate-300 font-medium">{ticket.organisation?.name}</span></span>
            <span>{ticket.customer?.email}</span>
            {ticket.customer?.phone && <span>{ticket.customer.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* Conversation + composer */}
        <div className="space-y-4 min-w-0">
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <CardTitle>Conversation</CardTitle>
              <span className="text-xs text-slate-400">{messages.length} entries</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} isStaff={isStaff} users={users?.items || []} />
              ))}
            </CardContent>
          </Card>

          {/* Composer */}
          <Card className={cn(internalMode && "ring-2 ring-amber-300 dark:ring-amber-700")}>
            <CardHeader className="flex items-center gap-2 flex-row">
              {isStaff ? (
                <>
                  <button
                    onClick={() => setComposer((c) => ({ ...c, mode: "reply" }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      !internalMode ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}
                  >
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" /> Reply to Customer
                  </button>
                  <button
                    onClick={() => setComposer((c) => ({ ...c, mode: "internal" }))}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      internalMode ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}
                  >
                    <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Internal Note
                  </button>
                </>
              ) : (
                <span className="text-xs font-medium text-slate-500">Your reply</span>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {internalMode && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg px-3 py-2">
                  <Lock className="w-3.5 h-3.5" /> Internal notes are never visible to customers.
                </div>
              )}
              <Textarea
                rows={4}
                value={composer.content}
                onChange={(e) => setComposer((c) => ({ ...c, content: e.target.value }))}
                placeholder={internalMode ? "Add an internal note for your team…" : "Type your reply…"}
              />
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                  <Paperclip className="w-4 h-4" /> Attach
                  <input type="file" multiple className="hidden" onChange={(e) => {
                    const files = Array.from(e.target.files || []).map((f) => ({ name: f.name, size: f.size, type: f.type }));
                    setComposer((c) => ({ ...c, attachments: [...c.attachments, ...files] }));
                  }} />
                </label>
                <div className="flex items-center gap-2">
                  {composer.attachments.map((a, i) => (
                    <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 flex items-center gap-1">
                      {a.name}
                      <button onClick={() => setComposer((c) => ({ ...c, attachments: c.attachments.filter((_, x) => x !== i) }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <Button onClick={sendMessage} loading={sending} disabled={!composer.content.trim()} variant={internalMode ? "secondary" : "primary"}>
                    <Send className="w-4 h-4" /> {internalMode ? "Add note" : "Send reply"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity history */}
          <Card>
            <CardHeader><CardTitle><History className="w-4 h-4 inline mr-1.5" />Activity History</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-1 space-y-4">
                {activity.map((a) => (
                  <li key={a.id} className="ml-4">
                    <span className="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900" />
                    <p className="text-sm text-slate-700 dark:text-slate-200">{a.description}</p>
                    <p className="text-xs text-slate-400">{formatRelative(a.created_at)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <SidebarSelect label="Status" value={ticket.status} onChange={(v) => patch({ status: v })} options={STATUSES.map((s) => [s.value, s.label])} />
              <SidebarSelect label="Priority" value={ticket.priority} onChange={(v) => patch({ priority: v })} options={PRIORITIES.map((p) => [p.value, p.label])} />
              <SidebarSelect label="Category" value={ticket.category} onChange={(v) => patch({ category: v })} options={CATEGORIES.map((c) => [c.value, c.label])} />
              {isStaff && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Assigned Agent</label>
                  <Select value={ticket.assigned_user_id || ""} onChange={(e) => patch({ assigned_user_id: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {(users?.items || []).filter((u) => u.role !== "client").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</p>
              <div className="flex items-center gap-3">
                <Avatar name={ticket.customer?.name} size="md" />
                <div className="min-w-0">
                  <Link to={"/customers/" + ticket.customer?.id} className="text-sm font-medium text-slate-900 dark:text-white hover:underline truncate block">{ticket.customer?.name}</Link>
                  <p className="text-xs text-slate-400 truncate">{ticket.customer?.email}</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Row label="Company" value={ticket.organisation?.name} />
                <Row label="Created" value={formatDateTime(ticket.created_at)} />
                <Row label="Updated" value={formatDateTime(ticket.updated_at)} />
                <Row label="Due" value={formatDateTime(ticket.due_at)} />
                <Row label="Resolved" value={ticket.resolved_at ? formatDateTime(ticket.resolved_at) : "—"} />
              </div>
            </CardContent>
          </Card>

          {isStaff && (
            <Card>
              <CardContent>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(ticket.tags || []).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5">
                      {t}
                      <button onClick={() => removeTag(t)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {(ticket.tags || []).length === 0 && <span className="text-xs text-slate-400">No tags</span>}
                </div>
                <div className="flex gap-2">
                  <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag…" className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs focus:outline-none" />
                  <Button size="sm" variant="secondary" onClick={addTag}><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m, isStaff, users }) {
  const author = m.author_type === "customer"
    ? { name: "Customer", id: m.author_id }
    : users.find((u) => u.id === m.author_id) || { name: "Agent" };
  const isInternal = m.message_type === "internal_note";
  const isCustomer = m.message_type === "customer_message";
  // Hide internal notes from clients
  if (isInternal && !isStaff) return null;

  return (
    <div className={cn("flex gap-3", isInternal && "bg-amber-50 dark:bg-amber-950/30 -mx-5 px-5 py-3 border-y border-amber-100 dark:border-amber-900/50")}>
      <Avatar name={author.name || "?"} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{author.name}</span>
          {isInternal && <Badge tone="amber"><Lock className="w-3 h-3" />Internal</Badge>}
          {isCustomer && <Badge tone="blue">Customer</Badge>}
          {m.message_type === "agent_reply" && <Badge tone="green">Support</Badge>}
          <span className="text-xs text-slate-400">{formatRelative(m.created_at)}</span>
        </div>
        <div className={cn("mt-1.5 rounded-xl px-3.5 py-2.5 text-sm",
          isInternal ? "bg-amber-50 dark:bg-transparent text-slate-700 dark:text-amber-100"
          : isCustomer ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          : "bg-blue-50 dark:bg-blue-950/40 text-slate-700 dark:text-blue-100")}>
          <p className="whitespace-pre-wrap">{m.content}</p>
          {m.attachments?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-white/70 dark:bg-slate-900/40 rounded px-2 py-1">
                  <Paperclip className="w-3 h-3" /> {a.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-600 dark:text-slate-300 text-right">{value}</span>
    </div>
  );
}