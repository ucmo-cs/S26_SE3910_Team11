package com.commercebank.controller;

import com.commercebank.dto.Dtos;
import com.commercebank.service.*;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * All endpoints under /api/admin require a valid employee Bearer token.
 * Role-specific checks (admin-only actions) are enforced in the service layer.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AppointmentService appointmentService;
    private final AuditLogService auditLogService;

    public AdminController(AppointmentService appointmentService,
                           AuditLogService auditLogService) {
        this.appointmentService = appointmentService;
        this.auditLogService = auditLogService;
    }

    // ─────────────────────────────────────────────────────
    // Appointments — read
    // ─────────────────────────────────────────────────────

    /**
     * GET /api/admin/appointments
     * Optional params: search=query, dateFrom=YYYY-MM-DD, dateTo=YYYY-MM-DD
     */
    @GetMapping("/appointments")
    public ResponseEntity<List<Dtos.AppointmentResponse>> getAppointments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        List<Dtos.AppointmentResponse> results;
        if (dateFrom != null && dateTo != null) {
            results = appointmentService.getAppointmentsByDateRange(dateFrom, dateTo);
        } else if (search != null && !search.isBlank()) {
            results = appointmentService.searchAppointments(search);
        } else {
            results = appointmentService.getAllAppointments();
        }
        return ResponseEntity.ok(results);
    }

    // ─────────────────────────────────────────────────────
    // Appointments — write
    // ─────────────────────────────────────────────────────

    /**
     * PATCH /api/admin/appointments/{id}/reschedule
     * Mirrors the update-appointment edge function (date + time update).
     */
    @PatchMapping("/appointments/{id}/reschedule")
    public ResponseEntity<Dtos.AppointmentResponse> reschedule(
            @PathVariable UUID id,
            @Valid @RequestBody Dtos.RescheduleRequest req,
            Authentication auth) {

        String role = actorRole(auth);
        Dtos.AppointmentResponse result =
                appointmentService.reschedule(id, req.date(), req.time(), role);
        auditLogService.log(role, "appointment.reschedule", id,
                Map.of("to_date", req.date().toString(), "to_time", req.time().toString()));
        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/admin/appointments/{id}/status
     * Mirrors the update-appointment edge function (status update).
     */
    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<Dtos.AppointmentResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody Dtos.StatusUpdateRequest req,
            Authentication auth) {

        String role = actorRole(auth);
        Dtos.AppointmentResponse result =
                appointmentService.updateStatus(id, req.status(), role);
        auditLogService.log(role, "appointment.status_change", id,
                Map.of("status", req.status()));
        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/admin/appointments/{id}/notes
     * Saves staff notes (staff + admin).
     */
    @PatchMapping("/appointments/{id}/notes")
    public ResponseEntity<Dtos.AppointmentResponse> updateNotes(
            @PathVariable UUID id,
            @Valid @RequestBody Dtos.NotesUpdateRequest req,
            Authentication auth) {

        return ResponseEntity.ok(appointmentService.updateNotes(id, req.staffNotes()));
    }

    /**
     * DELETE /api/admin/appointments/{id}
     * Soft-cancel — admin only. Mirrors the cancel-appointment edge function.
     */
    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Dtos.AppointmentResponse> cancel(
            @PathVariable UUID id,
            Authentication auth) {

        String role = actorRole(auth);
        Dtos.AppointmentResponse result = appointmentService.cancel(id, role);
        auditLogService.log(role, "appointment.cancel", id, Map.of());
        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────
    // History
    // ─────────────────────────────────────────────────────

    /** GET /api/admin/appointments/{id}/history */
    @GetMapping("/appointments/{id}/history")
    public ResponseEntity<List<Dtos.HistoryEntryResponse>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getHistory(id));
    }

    // ─────────────────────────────────────────────────────
    // Audit log (admin only)
    // ─────────────────────────────────────────────────────

    /** GET /api/admin/audit */
    @GetMapping("/audit")
    public ResponseEntity<List<Dtos.AuditLogEntryResponse>> getAuditLog(Authentication auth) {
        if (!"admin".equals(actorRole(auth))) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(auditLogService.getAll());
    }

    /**
     * POST /api/admin/audit
     * Explicit audit log entry (mirrors log-audit edge function).
     */
    @PostMapping("/audit")
    public ResponseEntity<Void> logAudit(
            @Valid @RequestBody Dtos.AuditRequest req,
            Authentication auth) {

        String role = actorRole(auth);
        auditLogService.log(role, req.action(), req.appointmentId(), req.details());
        return ResponseEntity.ok().build();
    }

    // ─────────────────────────────────────────────────────

    private String actorRole(Authentication auth) {
        return auth != null ? auth.getName() : "system";
    }
}
