import React, { useState } from "react";
import { Search, BookOpen, FileText } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { knowledgeApi } from "@/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function KnowledgeBase() {
  const { data: cats } = useAsync(() => knowledgeApi.categories());
  const { data: articles, loading } = useAsync(() => knowledgeApi.articles());
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [open, setOpen] = useState(null);

  const filtered = (articles?.items || []).filter((a) => {
    if (activeCat !== "all" && a.category_id !== activeCat) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catName = (id) => cats?.items?.find((c) => c.id === id)?.name || "Uncategorised";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Knowledge Base</h1>
        <p className="text-sm text-slate-500 mt-1">Articles to help customers and agents resolve issues faster.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Categories */}
        <div className="lg:w-56 flex-shrink-0">
          <Card>
            <CardContent className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Categories</p>
              <button onClick={() => setActiveCat("all")} className={cn("w-full text-left px-3 py-1.5 rounded-lg text-sm", activeCat === "all" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}>All articles</button>
              {(cats?.items || []).map((c) => (
                <button key={c.id} onClick={() => setActiveCat(c.id)} className={cn("w-full text-left px-3 py-1.5 rounded-lg text-sm", activeCat === c.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}>{c.name}</button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Articles */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles…" className="w-full h-10 pl-10 pr-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-slate-400" />
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={BookOpen} title="No articles found" />
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{catName(a.category_id)} · Updated {formatDate(a.updated_at)}</p>
                        </div>
                      </div>
                      <Badge tone={a.published ? "green" : "amber"}>{a.published ? "Published" : "Draft"}</Badge>
                    </div>
                    {open === a.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {a.content}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}