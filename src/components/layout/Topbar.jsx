import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Plus, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { notificationApi, ticketApi } from "@/api";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

export function Topbar({ onNewTicket, onMenu }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    notificationApi.list().then((r) => setNotifications(r.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      ticketApi.list({ search: query }).then((r) => setResults((r.items || []).slice(0, 6))).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800">
      <button onClick={onMenu} className="lg:hidden text-slate-500">
        <Menu className="w-5 h-5" />
      </button>

      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search tickets, customers, references…"
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:border-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors"
        />
        {showResults && results.length > 0 && (
          <div className="absolute top-12 left-0 right-0 rounded-xl border border-slate-200 bg-white shadow-xl dark:bg-slate-800 dark:border-slate-700 overflow-hidden z-50">
            {results.map((t) => (
              <button
                key={t.id}
                onClick={() => { navigate("/tickets/" + t.reference); setShowResults(false); setQuery(""); }}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.subject}</p>
                  <p className="text-xs text-slate-400">{t.reference} · {t.customer?.name}</p>
                </div>
                <span className="text-xs text-slate-400 ml-3">{t.status.replace(/_/g, " ")}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={toggle} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Toggle theme">
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        <div className="relative">
          <button onClick={() => setShowNotif(!showNotif)} className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:bg-slate-800 dark:border-slate-700 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 && <p className="px-4 py-6 text-sm text-slate-400 text-center">You're all caught up.</p>}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { if (n.link) navigate(n.link); setShowNotif(false); }}
                      className={cn("w-full flex gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700/50", !n.read && "bg-blue-50/40 dark:bg-blue-950/30")}
                    >
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Button size="sm" onClick={onNewTicket} className="hidden sm:inline-flex ml-1">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
        <button onClick={onNewTicket} className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-900 text-white">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}