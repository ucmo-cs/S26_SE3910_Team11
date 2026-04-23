package com.commercebank.service;

import com.commercebank.dto.Dtos;
import com.commercebank.exception.Exceptions;
import com.commercebank.model.*;
import com.commercebank.repository.*;
import com.commercebank.config.AppProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepo;
    private final AppointmentHistoryRepository historyRepo;
    private final RateLimitLogRepository rateLimitRepo;
    private final AppProperties props;

    public AppointmentService(AppointmentRepository appointmentRepo,
                              AppointmentHistoryRepository historyRepo,
                              RateLimitLogRepository rateLimitRepo,
                              AppProperties props) {
        this.appointmentRepo = appointmentRepo;
        this.historyRepo = historyRepo;
        this.rateLimitRepo = rateLimitRepo;
        this.props = props;
    }

    // ─────────────────────────────────────────────────────
    // Public booking
    // ─────────────────────────────────────────────────────

    @Transactional
    public Dtos.AppointmentResponse book(Dtos.BookAppointmentRequest req, String clientIp) {
        String email = req.email().toLowerCase();
        Instant windowStart = Instant.now().minusSeconds(3600);

        // Rate limiting
        long emailCount = rateLimitRepo.countByEmailAndCreatedAtAfter(email, windowStart);
        if (emailCount >= props.rateLimit().emailPerHour()) {
            throw new Exceptions.RateLimitExceededException(
                    "Too many bookings from this email. Please try again later.");
        }
        long ipCount = rateLimitRepo.countByIpAddressAndCreatedAtAfter(clientIp, windowStart);
        if (ipCount >= props.rateLimit().ipPerHour()) {
            throw new Exceptions.RateLimitExceededException(
                    "Too many bookings from your network. Please try again later.");
        }

        // Slot conflict check
        if (appointmentRepo.existsByBranchIdAndDateAndTime(req.branchId(), req.date(), req.time())) {
            throw new Exceptions.SlotAlreadyBookedException();
        }

        // Resolve names from reference data
        ReferenceData.Topic topic = ReferenceData.topicById(req.topicId());
        ReferenceData.Branch branch = ReferenceData.branchById(req.branchId());

        Appointment appt = Appointment.builder()
                .topicId(req.topicId())
                .topicName(topic.name())
                .branchId(req.branchId())
                .branchName(branch.name())
                .branchAddress(branch.address() + ", " + branch.city() + ", " + branch.state() + " " + branch.zip())
                .date(req.date())
                .time(req.time())
                .firstName(req.firstName().trim())
                .lastName(req.lastName().trim())
                .email(email)
                .phone(req.phone().trim())
                .build();

        appt = appointmentRepo.save(appt);

        // Rate limit log (fire-and-forget; don't fail on error)
        try {
            rateLimitRepo.save(RateLimitLog.builder()
                    .email(email)
                    .ipAddress(clientIp)
                    .build());
        } catch (Exception ignored) {}

        return toResponse(appt);
    }

    // ─────────────────────────────────────────────────────
    // Slot availability
    // ─────────────────────────────────────────────────────

    public List<LocalTime> getBookedSlots(int branchId, LocalDate date) {
        return appointmentRepo.findBookedTimesByBranchAndDate(branchId, date);
    }

    // ─────────────────────────────────────────────────────
    // Admin — read
    // ─────────────────────────────────────────────────────

    public List<Dtos.AppointmentResponse> getAllAppointments() {
        return appointmentRepo.findAllByOrderByDateDesc().stream()
                .map(this::toResponse).toList();
    }

    public List<Dtos.AppointmentResponse> searchAppointments(String q) {
        if (q == null || q.isBlank()) return getAllAppointments();
        return appointmentRepo.searchByNameOrEmail(q).stream()
                .map(this::toResponse).toList();
    }

    public List<Dtos.AppointmentResponse> getAppointmentsByDateRange(LocalDate from, LocalDate to) {
        return appointmentRepo.findByDateRange(from, to).stream()
                .map(this::toResponse).toList();
    }

    // ─────────────────────────────────────────────────────
    // Admin — reschedule
    // ─────────────────────────────────────────────────────

    @Transactional
    public Dtos.AppointmentResponse reschedule(UUID id, LocalDate newDate, LocalTime newTime,
                                               String actorRole) {
        Appointment appt = findOrThrow(id);

        if (appointmentRepo.existsByBranchIdAndDateAndTimeAndIdNot(
                appt.getBranchId(), newDate, newTime, id)) {
            throw new Exceptions.SlotAlreadyBookedException();
        }

        // Build history diff
        Map<String, Object> changed = new LinkedHashMap<>();
        Map<String, Object> oldVals = new LinkedHashMap<>();
        Map<String, Object> newVals = new LinkedHashMap<>();

        if (!newDate.equals(appt.getDate())) {
            changed.put("date", true);
            oldVals.put("date", appt.getDate().toString());
            newVals.put("date", newDate.toString());
        }
        if (!newTime.equals(appt.getTime())) {
            changed.put("time", true);
            oldVals.put("time", appt.getTime().toString());
            newVals.put("time", newTime.toString());
        }

        appt.setDate(newDate);
        appt.setTime(newTime);
        appt.setStatus("confirmed");
        appt = appointmentRepo.save(appt);

        if (!changed.isEmpty()) {
            saveHistory(id, actorRole, changed, oldVals, newVals);
        }
        return toResponse(appt);
    }

    // ─────────────────────────────────────────────────────
    // Admin — status update
    // ─────────────────────────────────────────────────────

    @Transactional
    public Dtos.AppointmentResponse updateStatus(UUID id, String status, String actorRole) {
        List<String> allowed = List.of("confirmed", "cancelled", "completed", "no_show", "pending_action");
        if (!allowed.contains(status)) throw new Exceptions.InvalidStatusException(status);

        Appointment appt = findOrThrow(id);
        String oldStatus = appt.getStatus();

        appt.setStatus(status);
        appt = appointmentRepo.save(appt);

        if (!status.equals(oldStatus)) {
            saveHistory(id, actorRole,
                    Map.of("status", true),
                    Map.of("status", oldStatus),
                    Map.of("status", status));
        }
        return toResponse(appt);
    }

    // ─────────────────────────────────────────────────────
    // Admin — notes
    // ─────────────────────────────────────────────────────

    @Transactional
    public Dtos.AppointmentResponse updateNotes(UUID id, String notes) {
        Appointment appt = findOrThrow(id);
        appt.setStaffNotes(notes);
        return toResponse(appointmentRepo.save(appt));
    }

    // ─────────────────────────────────────────────────────
    // Admin — cancel (soft-delete)
    // ─────────────────────────────────────────────────────

    @Transactional
    public Dtos.AppointmentResponse cancel(UUID id, String actorRole) {
        if (!"admin".equals(actorRole)) {
            throw new Exceptions.InsufficientRoleException(
                    "Only admins can cancel appointments.");
        }
        return updateStatus(id, "cancelled", actorRole);
    }

    // ─────────────────────────────────────────────────────
    // History
    // ─────────────────────────────────────────────────────

    public List<Dtos.HistoryEntryResponse> getHistory(UUID appointmentId) {
        return historyRepo.findByAppointmentIdOrderByCreatedAtDesc(appointmentId)
                .stream()
                .map(h -> new Dtos.HistoryEntryResponse(
                        h.getId(), h.getAppointmentId(), h.getActorRole(),
                        h.getChangedFields(), h.getOldValues(), h.getNewValues(),
                        h.getCreatedAt()))
                .toList();
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private Appointment findOrThrow(UUID id) {
        return appointmentRepo.findById(id)
                .orElseThrow(() -> new Exceptions.AppointmentNotFoundException(id));
    }

    private void saveHistory(UUID appointmentId, String actorRole,
                             Map<String, Object> changed,
                             Map<String, Object> oldVals,
                             Map<String, Object> newVals) {
        historyRepo.save(AppointmentHistory.builder()
                .appointmentId(appointmentId)
                .actorRole(actorRole != null ? actorRole : "system")
                .changedFields(changed)
                .oldValues(oldVals)
                .newValues(newVals)
                .build());
    }

    Dtos.AppointmentResponse toResponse(Appointment a) {
        return Dtos.AppointmentResponse.builder()
                .id(a.getId())
                .topicId(a.getTopicId())
                .topicName(a.getTopicName())
                .branchId(a.getBranchId())
                .branchName(a.getBranchName())
                .branchAddress(a.getBranchAddress())
                .date(a.getDate())
                .time(a.getTime())
                .firstName(a.getFirstName())
                .lastName(a.getLastName())
                .email(a.getEmail())
                .phone(a.getPhone())
                .status(a.getStatus())
                .staffNotes(a.getStaffNotes())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
