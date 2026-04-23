import { logAuditEntry } from "@/lib/api";
import { getEmployeeRole } from "@/lib/employeeAuth";

export type AuditAction =
  | "appointment.reschedule"
  | "appointment.cancel"
  | "appointment.status_change";

export async function logAudit(
  action: AuditAction,
  appointmentId: string,
  details: Record<string, unknown>
): Promise<void> {
  const role = getEmployeeRole();
  if (!role) return;
  try {
    await logAuditEntry({ action, appointmentId, details });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
