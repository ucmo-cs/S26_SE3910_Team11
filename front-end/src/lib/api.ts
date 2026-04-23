// Central API client — replaces all direct Supabase calls.
// All requests go to the Spring Boot backend.

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem("employee_auth_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ─── Reference data ───────────────────────────────────────────────

export interface Topic {
  id: number;
  name: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  supportedTopicIds: number[];
}

export async function fetchTopics(): Promise<Topic[]> {
  const data = await request<{ topics: Topic[] }>("/topics");
  return data.topics;
}

export async function fetchBranches(topicId?: number): Promise<Branch[]> {
  const qs = topicId ? `?topicId=${topicId}` : "";
  const data = await request<{ branches: Branch[] }>(`/branches${qs}`);
  return data.branches;
}

// ─── Time slots ───────────────────────────────────────────────────

export interface TimeSlot {
  time: string;
  label: string;
}

export async function fetchTimeSlots(): Promise<TimeSlot[]> {
  return request<TimeSlot[]>("/appointments/time-slots");
}

export async function fetchBookedSlots(branchId: number, date: string): Promise<string[]> {
  const data = await request<{ bookedSlots: string[] }>(
    `/appointments/slots?branchId=${branchId}&date=${date}`
  );
  // Normalize HH:mm:ss → HH:mm
  return data.bookedSlots.map((t) => t.slice(0, 5));
}

// ─── Booking ──────────────────────────────────────────────────────

export interface AppointmentResponse {
  id: string;
  topicId: number;
  topicName: string;
  branchId: number;
  branchName: string;
  branchAddress: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  staffNotes: string;
  createdAt: string;
  updatedAt: string;
}

export async function bookAppointment(payload: {
  topicId: number;
  branchId: number;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<AppointmentResponse> {
  return request<AppointmentResponse>("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Employee auth ────────────────────────────────────────────────

export async function employeeLogin(
  password: string
): Promise<{ role: string; token: string }> {
  return request<{ role: string; token: string }>("/employee/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

// ─── Admin — appointments ─────────────────────────────────────────

export async function fetchAdminAppointments(params?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AppointmentResponse[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params?.dateTo) qs.set("dateTo", params.dateTo);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<AppointmentResponse[]>(`/admin/appointments${query}`);
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  time: string
): Promise<AppointmentResponse> {
  return request<AppointmentResponse>(`/admin/appointments/${id}/reschedule`, {
    method: "PATCH",
    body: JSON.stringify({ date, time }),
  });
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<AppointmentResponse> {
  return request<AppointmentResponse>(`/admin/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateAppointmentNotes(
  id: string,
  staffNotes: string
): Promise<AppointmentResponse> {
  return request<AppointmentResponse>(`/admin/appointments/${id}/notes`, {
    method: "PATCH",
    body: JSON.stringify({ staffNotes }),
  });
}

export async function cancelAppointment(id: string): Promise<AppointmentResponse> {
  return request<AppointmentResponse>(`/admin/appointments/${id}`, {
    method: "DELETE",
  });
}

// ─── Admin — history ──────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  appointmentId: string;
  actorRole: string;
  changedFields: Record<string, boolean>;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  createdAt: string;
}

export async function fetchAppointmentHistory(id: string): Promise<HistoryEntry[]> {
  return request<HistoryEntry[]>(`/admin/appointments/${id}/history`);
}

// ─── Admin — audit log ────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  actorRole: string;
  action: string;
  appointmentId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export async function fetchAuditLog(): Promise<AuditEntry[]> {
  return request<AuditEntry[]>("/admin/audit");
}

export async function logAuditEntry(payload: {
  action: string;
  appointmentId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await request<void>("/admin/audit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
