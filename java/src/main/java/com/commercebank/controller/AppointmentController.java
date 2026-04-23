package com.commercebank.controller;

import com.commercebank.dto.Dtos;
import com.commercebank.service.AppointmentService;
import com.commercebank.service.TimeSlotService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Public endpoints — accessible without authentication.
 * Mirrors the submit-appointment Supabase edge function.
 */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final TimeSlotService timeSlotService;

    public AppointmentController(AppointmentService appointmentService,
                                 TimeSlotService timeSlotService) {
        this.appointmentService = appointmentService;
        this.timeSlotService = timeSlotService;
    }

    /**
     * Book a new appointment.
     * POST /api/appointments
     */
    @PostMapping
    public ResponseEntity<Dtos.AppointmentResponse> book(
            @Valid @RequestBody Dtos.BookAppointmentRequest req,
            HttpServletRequest httpReq) {

        String ip = extractClientIp(httpReq);
        Dtos.AppointmentResponse response = appointmentService.book(req, ip);
        return ResponseEntity.ok(response);
    }

    /**
     * Get booked time slots for a branch on a given date.
     * GET /api/appointments/slots?branchId=1&date=2026-05-01
     */
    @GetMapping("/slots")
    public ResponseEntity<Dtos.BookedSlotsResponse> getBookedSlots(
            @RequestParam int branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        List<LocalTime> booked = appointmentService.getBookedSlots(branchId, date);
        return ResponseEntity.ok(new Dtos.BookedSlotsResponse(booked));
    }

    /**
     * All available half-hour time slots (09:00–16:30).
     * GET /api/appointments/time-slots
     */
    @GetMapping("/time-slots")
    public ResponseEntity<List<TimeSlotService.TimeSlot>> getTimeSlots() {
        return ResponseEntity.ok(timeSlotService.generateSlots());
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private String extractClientIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String cf = req.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) return cf;
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real;
        return req.getRemoteAddr();
    }
}
