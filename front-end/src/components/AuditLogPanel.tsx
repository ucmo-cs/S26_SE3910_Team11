import { useEffect, useState } from "react";
import { fetchAuditLog, AuditEntry } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Shield, ScrollText } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  "appointment.reschedule": "Rescheduled appointment",
  "appointment.cancel": "Cancelled appointment",
  "appointment.status_change": "Changed status",
};

const formatDetails = (action: string, details: Record<string, unknown>): string => {
  if (action === "appointment.reschedule") {
    return `${details.from_date} ${details.from_time} → ${details.to_date} ${details.to_time}`;
  }
  if (action === "appointment.status_change") {
    return `${details.from ?? "?"} → ${details.to ?? "?"}`;
  }
  if (action === "appointment.cancel") {
    return `${details.customer ?? ""} • ${details.date ?? ""} ${details.time ?? ""}`;
  }
  return JSON.stringify(details);
};

export const AuditLogPanel = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditLog();
      setEntries(data);
    } catch (err) {
      console.error("Failed to fetch audit log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLog(); }, []);

  return (
    <Card className="mt-8">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              Audit Log <Shield className="w-4 h-4 text-primary" />
            </h2>
            <p className="text-xs text-muted-foreground">
              Last 100 staff actions. Visible to administrators only.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLog} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading audit history…
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No actions recorded yet.</div>
      ) : (
        <div className="divide-y">
          {entries.map((e) => (
            <div key={e.id} className="p-4 flex items-start gap-4">
              <Badge className={e.actorRole === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                {e.actorRole}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {ACTION_LABELS[e.action] ?? e.action}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatDetails(e.action, e.details)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(e.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
