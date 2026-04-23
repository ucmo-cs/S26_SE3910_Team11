// Lightweight type to avoid circular import from AdminDashboard.
// Mirrors the AppointmentRow shape used in the dashboard.
export interface CsvAppointment {
  id: string;
  topic_name: string;
  branch_name: string;
  branch_address: string;
  date: string;
  time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  staff_notes: string;
  created_at: string;
}

const escapeCsvCell = (val: unknown): string => {
  const str = val === null || val === undefined ? "" : String(val);
  if (/[",\n\r]/.test(str) || str !== str.trim()) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export function appointmentsToCsv(rows: CsvAppointment[]): string {
  const headers = [
    "ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Topic",
    "Branch",
    "Branch Address",
    "Date",
    "Time",
    "Status",
    "Staff Notes",
    "Created At",
  ];

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.topic_name,
        r.branch_name,
        r.branch_address,
        r.date,
        r.time,
        r.status,
        r.staff_notes ?? "",
        r.created_at,
      ]
        .map(escapeCsvCell)
        .join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  // Prepend BOM so Excel detects UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
