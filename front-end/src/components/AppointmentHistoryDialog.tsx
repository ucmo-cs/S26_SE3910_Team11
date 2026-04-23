import { useEffect, useState } from "react";
import { fetchAppointmentHistory, HistoryEntry } from "@/lib/api";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, History as HistoryIcon } from "lucide-react";

interface AppointmentLite {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  appointment: AppointmentLite | null;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  status: "Status", date: "Date", time: "Time",
  first_name: "First name", last_name: "Last name",
  email: "Email", phone: "Phone", branch_id: "Branch", topic_id: "Topic",
};

const formatValue = (field: string, val: unknown, row: Record<string, unknown>): string => {
  if (val === null || val === undefined || val === "") return "—";
  if (field === "branch_id" && row.branch_name) return String(row.branch_name);
  if (field === "topic_id" && row.topic_name) return String(row.topic_name);
  return String(val);
};

export const AppointmentHistoryDialog = ({ appointment, onClose }: Props) => {
  const [rows, setRows] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!appointment) { setRows([]); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAppointmentHistory(appointment.id);
        if (!cancelled) setRows(data);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [appointment]);

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5" /> Appointment History
          </DialogTitle>
          <DialogDescription>
            {appointment && <>Full change log for {appointment.first_name} {appointment.last_name}</>}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading history...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No changes recorded yet. Edits to this appointment will appear here.
          </div>
        ) : (
          <ol className="space-y-3">
            {rows.map((r) => {
              const fields = Object.keys(r.changedFields || {});
              return (
                <li key={r.id} className="border rounded-md p-3 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{r.actorRole}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {fields.map((f) => (
                      <li key={f} className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-medium text-foreground">{FIELD_LABELS[f] ?? f}:</span>
                        <span className="text-muted-foreground line-through">
                          {formatValue(f, r.oldValues?.[f], r.oldValues || {})}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground">
                          {formatValue(f, r.newValues?.[f], r.newValues || {})}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
};
