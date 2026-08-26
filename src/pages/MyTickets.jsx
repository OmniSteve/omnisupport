import React from "react";
import { useAsync } from "@/lib/useAsync";
import { ticketApi } from "@/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { TicketTable } from "@/components/tickets/TicketTable";
import { ErrorState } from "@/components/ui/EmptyState";

export default function MyTickets() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useAsync(() => ticketApi.list({ assigned_me: user?.id || "u2" }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">My Tickets</h1>
        <p className="text-sm text-slate-500 mt-1">Tickets currently assigned to you.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Assigned to {user?.name || "you"}</CardTitle></CardHeader>
        {error ? <ErrorState title="Couldn't load tickets" description={error.message} onRetry={refetch} /> : (
          <TicketTable tickets={data?.items || []} loading={loading} />
        )}
      </Card>
    </div>
  );
}