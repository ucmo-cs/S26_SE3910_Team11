export type DisplayStatus =
  | "confirmed"
  | "completed"
  | "pending_action"
  | "cancelled"
  | "no_show";

/**
 * Compute the status to display for an appointment.
 * - explicit terminal statuses (cancelled / no_show) win
 * - "pending_action" if stored that way (customer requested a change)
 * - "completed" if the appointment date has passed (display-only)
 * - "confirmed" otherwise
 */
export function getDisplayStatus(
  storedStatus: string,
  date: string
): DisplayStatus {
  if (storedStatus === "cancelled") return "cancelled";
  if (storedStatus === "no_show") return "no_show";
  if (storedStatus === "pending_action") return "pending_action";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(date + "T00:00:00");
  if (apptDate < today) return "completed";

  return "confirmed";
}

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  pending_action: "Pending Action",
  cancelled: "Cancelled",
  no_show: "No-Show",
};

export const STATUS_CLASSES: Record<DisplayStatus, string> = {
  confirmed: "bg-status-confirmed text-status-confirmed-foreground hover:bg-status-confirmed/90",
  completed: "bg-status-completed text-status-completed-foreground hover:bg-status-completed/90",
  pending_action: "bg-status-pending text-status-pending-foreground hover:bg-status-pending/90",
  cancelled: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  no_show: "bg-muted text-muted-foreground hover:bg-muted/80 border border-border",
};
