package com.commercebank.dto;

import com.commercebank.model.ReferenceData;
import jakarta.validation.constraints.*;
import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// ─────────────────────────────────────────────────────────────────
// Public booking (customer-facing)
// ─────────────────────────────────────────────────────────────────

public final class Dtos {
    private Dtos() {}

    /** POST /api/appointments */
    public record BookAppointmentRequest(
            @NotNull @Min(1) Integer topicId,
            @NotNull @Min(1) Integer branchId,
            @NotNull LocalDate date,
            @NotNull LocalTime time,
            @NotBlank @Size(max = 80) String firstName,
            @NotBlank @Size(max = 80) String lastName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 7, max = 40) String phone
    ) {}

    /** Response for a successfully booked appointment. */
    @Builder
    public record AppointmentResponse(
            UUID id,
            Integer topicId,
            String topicName,
            Integer branchId,
            String branchName,
            String branchAddress,
            LocalDate date,
            LocalTime time,
            String firstName,
            String lastName,
            String email,
            String phone,
            String status,
            String staffNotes,
            Instant createdAt,
            Instant updatedAt
    ) {}

    /** GET /api/appointments/slots?branchId=1&date=2026-05-01 */
    public record BookedSlotsResponse(List<LocalTime> bookedSlots) {}

    // ─────────────────────────────────────────────────────────────────
    // Employee / admin actions
    // ─────────────────────────────────────────────────────────────────

    /** POST /api/employee/login */
    public record LoginRequest(@NotBlank String password) {}

    /** Response after successful employee login. */
    public record LoginResponse(String role, String token) {}

    /** PATCH /api/admin/appointments/{id}/reschedule */
    public record RescheduleRequest(
            @NotNull LocalDate date,
            @NotNull LocalTime time
    ) {}

    /** PATCH /api/admin/appointments/{id}/status */
    public record StatusUpdateRequest(
            @NotBlank String status
    ) {}

    /** PATCH /api/admin/appointments/{id}/notes */
    public record NotesUpdateRequest(
            @NotNull @Size(max = 2000) String staffNotes
    ) {}

    /** POST /api/admin/audit */
    public record AuditRequest(
            @NotBlank @Size(max = 80) String action,
            UUID appointmentId,
            Map<String, Object> details
    ) {}

    // ─────────────────────────────────────────────────────────────────
    // Reference data
    // ─────────────────────────────────────────────────────────────────

    public record TopicsResponse(List<ReferenceData.Topic> topics) {}

    public record BranchesResponse(List<ReferenceData.Branch> branches) {}

    // ─────────────────────────────────────────────────────────────────
    // Appointment history
    // ─────────────────────────────────────────────────────────────────

    public record HistoryEntryResponse(
            UUID id,
            UUID appointmentId,
            String actorRole,
            Map<String, Object> changedFields,
            Map<String, Object> oldValues,
            Map<String, Object> newValues,
            Instant createdAt
    ) {}

    // ─────────────────────────────────────────────────────────────────
    // Audit log
    // ─────────────────────────────────────────────────────────────────

    public record AuditLogEntryResponse(
            UUID id,
            String actorRole,
            String action,
            UUID appointmentId,
            Map<String, Object> details,
            Instant createdAt
    ) {}

    // ─────────────────────────────────────────────────────────────────
    // Error
    // ─────────────────────────────────────────────────────────────────

    public record ErrorResponse(String error, Object details) {
        public static ErrorResponse of(String message) {
            return new ErrorResponse(message, null);
        }
    }
}
