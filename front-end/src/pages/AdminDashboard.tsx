import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, RefreshCw, CalendarDays, Users, Loader2, CalendarClock, Trash2, LogOut, AlertCircle, CheckCircle2, History, StickyNote, UserX, Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isEmployeeAuthenticated, isAdmin, getEmployeeRole, logoutEmployee } from "@/lib/employeeAuth";
import { logAudit } from "@/lib/auditLog";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { AppointmentHistoryDialog } from "@/components/AppointmentHistoryDialog";
import { NotesDialog } from "@/components/NotesDialog";
import { appointmentsToCsv, downloadCsv } from "@/lib/csvExport";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { generateTimeSlots, getBookedSlots } from "@/data/appointmentData";
import { getDisplayStatus, STATUS_LABELS, STATUS_CLASSES } from "@/lib/appointmentStatus";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface AppointmentRow {
  id: string;
  topic_name: string;
  branch_id: number;
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Gate: redirect to login if not authenticated
  useEffect(() => {
    if (!isEmployeeAuthenticated()) {
      navigate("/employee-login", { replace: true });
    }
  }, [navigate]);

  const admin = isAdmin();

  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const timeSlots = generateTimeSlots();

  // Reschedule dialog state
  const [rescheduleApt, setRescheduleApt] = useState<AppointmentRow | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Cancel dialog state
  const [cancelApt, setCancelApt] = useState<AppointmentRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // History dialog state
  const [historyApt, setHistoryApt] = useState<AppointmentRow | null>(null);

  // Notes dialog state
  const [notesApt, setNotesApt] = useState<AppointmentRow | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Date range filter state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching appointments:", error);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Load booked slots when reschedule date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (rescheduleApt && newDate) {
        const dateStr = newDate.toISOString().split("T")[0];
        const slots = await getBookedSlots(rescheduleApt.branch_id, dateStr);
        // Allow keeping the current time slot if same date
        setBookedSlots(slots.filter((t) => !(dateStr === rescheduleApt.date && t === rescheduleApt.time)));
      } else {
        setBookedSlots([]);
      }
    };
    loadSlots();
  }, [rescheduleApt, newDate]);

  const openReschedule = (apt: AppointmentRow) => {
    setRescheduleApt(apt);
    setNewDate(new Date(apt.date + "T00:00:00"));
    setNewTime(apt.time);
  };

  const closeReschedule = () => {
    setRescheduleApt(null);
    setNewDate(undefined);
    setNewTime("");
  };

  const handleReschedule = async () => {
    if (!rescheduleApt || !newDate || !newTime) return;
    const role = getEmployeeRole();
    if (!role) return;
    setSavingReschedule(true);
    const dateStr = newDate.toISOString().split("T")[0];
    const { data, error } = await supabase.functions.invoke("update-appointment", {
      body: {
        actorRole: role,
        appointmentId: rescheduleApt.id,
        updates: { date: dateStr, time: newTime, status: "confirmed" },
      },
    });
    setSavingReschedule(false);
    const ctxErr = (error as { context?: { error?: string } } | null)?.context?.error;
    const errMsg = ctxErr || data?.error || error?.message;
    if (errMsg) {
      toast({ title: "Reschedule failed", description: errMsg, variant: "destructive" });
    } else {
      logAudit("appointment.reschedule", rescheduleApt.id, {
        from_date: rescheduleApt.date,
        from_time: rescheduleApt.time,
        to_date: dateStr,
        to_time: newTime,
        customer: `${rescheduleApt.first_name} ${rescheduleApt.last_name}`,
      });
      toast({ title: "Appointment rescheduled", description: "The booking has been updated." });
      closeReschedule();
      fetchAppointments();
    }
  };

  const handleSetStatus = async (apt: AppointmentRow, status: "pending_action" | "confirmed") => {
    // pending_action is a UI-only marker not in the strict edge-function enum,
    // so we keep the direct table call here. The DB trigger will still record
    // the change in appointment_history (with actor 'system' since this path
    // doesn't go through set_actor_role).
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", apt.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      logAudit("appointment.status_change", apt.id, {
        from: apt.status,
        to: status,
        customer: `${apt.first_name} ${apt.last_name}`,
      });
      toast({
        title: status === "pending_action" ? "Marked as Pending Action" : "Marked as Confirmed",
      });
      fetchAppointments();
    }
  };

  const handleCancel = async () => {
    if (!cancelApt) return;
    const role = getEmployeeRole();
    if (role !== "admin") {
      toast({
        title: "Permission denied",
        description: "Only administrators can cancel appointments.",
        variant: "destructive",
      });
      return;
    }
    setCancelling(true);
    const { data, error } = await supabase.functions.invoke("cancel-appointment", {
      body: { actorRole: role, appointmentId: cancelApt.id },
    });
    setCancelling(false);
    const ctxErr = (error as { context?: { error?: string } } | null)?.context?.error;
    const errMsg = ctxErr || data?.error || error?.message;
    if (errMsg) {
      toast({ title: "Cancellation failed", description: errMsg, variant: "destructive" });
    } else {
      logAudit("appointment.cancel", cancelApt.id, {
        customer: `${cancelApt.first_name} ${cancelApt.last_name}`,
        date: cancelApt.date,
        time: cancelApt.time,
        branch: cancelApt.branch_name,
      });
      toast({ title: "Appointment cancelled", description: "Status set to cancelled." });
      setCancelApt(null);
      fetchAppointments();
    }
  };

  const handleSaveNotes = async (newNotes: string) => {
    if (!notesApt) return;
    const role = getEmployeeRole();
    if (!role) return;
    setSavingNotes(true);
    const { data, error } = await supabase.functions.invoke("update-appointment", {
      body: {
        actorRole: role,
        appointmentId: notesApt.id,
        updates: { staff_notes: newNotes },
      },
    });
    setSavingNotes(false);
    const ctxErr = (error as { context?: { error?: string } } | null)?.context?.error;
    const errMsg = ctxErr || data?.error || error?.message;
    if (errMsg) {
      toast({ title: "Could not save notes", description: errMsg, variant: "destructive" });
    } else {
      toast({ title: "Notes saved" });
      setNotesApt(null);
      fetchAppointments();
    }
  };

  const handleMarkNoShow = async (apt: AppointmentRow) => {
    const role = getEmployeeRole();
    if (!role) return;
    const { data, error } = await supabase.functions.invoke("update-appointment", {
      body: {
        actorRole: role,
        appointmentId: apt.id,
        updates: { status: "no_show" },
      },
    });
    const ctxErr = (error as { context?: { error?: string } } | null)?.context?.error;
    const errMsg = ctxErr || data?.error || error?.message;
    if (errMsg) {
      toast({ title: "Update failed", description: errMsg, variant: "destructive" });
    } else {
      logAudit("appointment.status_change", apt.id, {
        from: apt.status,
        to: "no_show",
        customer: `${apt.first_name} ${apt.last_name}`,
      });
      toast({ title: "Marked as no-show" });
      fetchAppointments();
    }
  };

  const getTimeLabel = (time: string) =>
    timeSlots.find((s) => s.time === time)?.label ?? time;

  const fromStr = dateFrom ? format(dateFrom, "yyyy-MM-dd") : "";
  const toStr = dateTo ? format(dateTo, "yyyy-MM-dd") : "";

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.first_name.toLowerCase().includes(q) ||
      a.last_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.topic_name.toLowerCase().includes(q) ||
      a.branch_name.toLowerCase().includes(q);
    const matchesFrom = !fromStr || a.date >= fromStr;
    const matchesTo = !toStr || a.date <= toStr;
    return matchesSearch && matchesFrom && matchesTo;
  });

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No appointments match your filters." });
      return;
    }
    const stamp = format(new Date(), "yyyy-MM-dd_HHmm");
    downloadCsv(`appointments_${stamp}.csv`, appointmentsToCsv(filtered));
    toast({ title: "Export ready", description: `${filtered.length} appointment(s) downloaded.` });
  };


  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.date === todayStr).length;
  const upcomingCount = appointments.filter((a) => a.date >= todayStr).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-lg font-serif">
              C
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">
              {admin ? "Administrator Dashboard" : "Staff Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Booking
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                logoutEmployee();
                navigate("/employee-login");
              }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today's Appointments</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </Card>
        </div>

        {/* Toolbar: Search, date range, export, refresh */}
        <div className="flex flex-col gap-3 mb-4 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, topic, or branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="justify-start">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>
        {filtered.length !== appointments.length && (
          <p className="text-xs text-muted-foreground mb-2">
            Showing {filtered.length} of {appointments.length} appointments
          </p>
        )}

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading appointments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {search ? "No appointments match your search." : "No appointments booked yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const display = getDisplayStatus(a.status, a.date);
                    const isCompleted = display === "completed";
                    return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.first_name} {a.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.email}</TableCell>
                      <TableCell className="text-muted-foreground">{a.phone}</TableCell>
                      <TableCell>{a.topic_name}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{a.branch_name}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{a.branch_address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(a.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{getTimeLabel(a.time)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_CLASSES[display]}>
                          {STATUS_LABELS[display]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end flex-wrap gap-2">
                          {display === "pending_action" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetStatus(a, "confirmed")}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Confirmed
                            </Button>
                          ) : (
                            !isCompleted && display !== "cancelled" && display !== "no_show" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetStatus(a, "pending_action")}
                              >
                                <AlertCircle className="w-4 h-4 mr-1" /> Mark Pending
                              </Button>
                            )
                          )}
                          {(isCompleted || display === "pending_action") && a.status !== "no_show" && a.status !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkNoShow(a)}
                            >
                              <UserX className="w-4 h-4 mr-1" /> No-Show
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotesApt(a)}
                          >
                            <StickyNote className="w-4 h-4 mr-1" />
                            Notes{a.staff_notes ? ` (${a.staff_notes.length > 0 ? "•" : ""})` : ""}
                          </Button>
                          {display !== "cancelled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReschedule(a)}
                            >
                              <CalendarClock className="w-4 h-4 mr-1" /> Reschedule
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryApt(a)}
                          >
                            <History className="w-4 h-4 mr-1" /> History
                          </Button>
                          {admin && display !== "cancelled" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setCancelApt(a)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {admin && <AuditLogPanel />}
      </main>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleApt} onOpenChange={(open) => !open && closeReschedule()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              {rescheduleApt && (
                <>
                  {rescheduleApt.first_name} {rescheduleApt.last_name} — {rescheduleApt.branch_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New date</label>
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                disabled={(d) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return d < today || d.getDay() === 0 || d.getDay() === 6;
                }}
                className="rounded-md border pointer-events-auto"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">New time</label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem
                      key={slot.time}
                      value={slot.time}
                      disabled={bookedSlots.includes(slot.time)}
                    >
                      {slot.label} {bookedSlots.includes(slot.time) && "(booked)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReschedule} disabled={savingReschedule}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={!newDate || !newTime || savingReschedule}>
              {savingReschedule && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelApt} onOpenChange={(open) => !open && setCancelApt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelApt && (
                <>
                  This will mark the appointment for{" "}
                  <span className="font-medium">
                    {cancelApt.first_name} {cancelApt.last_name}
                  </span>{" "}
                  on {new Date(cancelApt.date + "T00:00:00").toLocaleDateString()} as{" "}
                  <span className="font-medium">cancelled</span>. The record is preserved
                  in the appointment history.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Yes, cancel it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Appointment History */}
      <AppointmentHistoryDialog
        appointment={historyApt}
        onClose={() => setHistoryApt(null)}
      />

      {/* Notes */}
      <NotesDialog
        open={!!notesApt}
        initialNotes={notesApt?.staff_notes ?? ""}
        customerName={notesApt ? `${notesApt.first_name} ${notesApt.last_name}` : ""}
        saving={savingNotes}
        onSave={handleSaveNotes}
        onClose={() => setNotesApt(null)}
      />
    </div>
  );
};

export default AdminDashboard;
