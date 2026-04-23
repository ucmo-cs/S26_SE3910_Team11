package com.commercebank;

import com.commercebank.config.AppProperties;
import com.commercebank.dto.Dtos;
import com.commercebank.exception.Exceptions;
import com.commercebank.model.Appointment;
import com.commercebank.repository.*;
import com.commercebank.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock AppointmentRepository appointmentRepo;
    @Mock AppointmentHistoryRepository historyRepo;
    @Mock RateLimitLogRepository rateLimitRepo;

    AppointmentService service;

    static final AppProperties PROPS = new AppProperties(
            new AppProperties.RateLimit(3, 5),
            new AppProperties.Auth("staffhash", "adminhash"),
            new AppProperties.Cors(List.of("http://localhost:5173"))
    );

    @BeforeEach
    void setUp() {
        service = new AppointmentService(appointmentRepo, historyRepo, rateLimitRepo, PROPS);
    }

    // ─────────────────────────────────────────────────────
    // Booking
    // ─────────────────────────────────────────────────────

    @Test
    void book_success() {
        var req = new Dtos.BookAppointmentRequest(
                1, 1,
                LocalDate.of(2026, 6, 1), LocalTime.of(10, 0),
                "Jane", "Doe", "jane@example.com", "555-1234"
        );

        when(rateLimitRepo.countByEmailAndCreatedAtAfter(anyString(), any())).thenReturn(0L);
        when(rateLimitRepo.countByIpAddressAndCreatedAtAfter(anyString(), any())).thenReturn(0L);
        when(appointmentRepo.existsByBranchIdAndDateAndTime(anyInt(), any(), any())).thenReturn(false);

        Appointment saved = Appointment.builder()
                .id(UUID.randomUUID())
                .topicId(1).topicName("Open an account")
                .branchId(1).branchName("Southland Shopping Center")
                .branchAddress("1731 E Mechanic St, Harrisonville, MO 64701")
                .date(req.date()).time(req.time())
                .firstName("Jane").lastName("Doe")
                .email("jane@example.com").phone("555-1234")
                .status("confirmed").staffNotes("")
                .createdAt(Instant.now()).updatedAt(Instant.now())
                .build();

        when(appointmentRepo.save(any())).thenReturn(saved);

        Dtos.AppointmentResponse result = service.book(req, "127.0.0.1");

        assertThat(result.email()).isEqualTo("jane@example.com");
        assertThat(result.status()).isEqualTo("confirmed");
        verify(appointmentRepo).save(any());
    }

    @Test
    void book_slotConflict_throws() {
        var req = new Dtos.BookAppointmentRequest(
                1, 1,
                LocalDate.of(2026, 6, 1), LocalTime.of(10, 0),
                "Jane", "Doe", "jane@example.com", "555-1234"
        );
        when(rateLimitRepo.countByEmailAndCreatedAtAfter(anyString(), any())).thenReturn(0L);
        when(rateLimitRepo.countByIpAddressAndCreatedAtAfter(anyString(), any())).thenReturn(0L);
        when(appointmentRepo.existsByBranchIdAndDateAndTime(anyInt(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> service.book(req, "127.0.0.1"))
                .isInstanceOf(Exceptions.SlotAlreadyBookedException.class);
    }

    @Test
    void book_emailRateLimit_throws() {
        var req = new Dtos.BookAppointmentRequest(
                1, 1,
                LocalDate.of(2026, 6, 1), LocalTime.of(10, 0),
                "Jane", "Doe", "jane@example.com", "555-1234"
        );
        when(rateLimitRepo.countByEmailAndCreatedAtAfter(anyString(), any())).thenReturn(3L);

        assertThatThrownBy(() -> service.book(req, "127.0.0.1"))
                .isInstanceOf(Exceptions.RateLimitExceededException.class)
                .hasMessageContaining("email");
    }

    @Test
    void book_ipRateLimit_throws() {
        var req = new Dtos.BookAppointmentRequest(
                1, 1,
                LocalDate.of(2026, 6, 1), LocalTime.of(10, 0),
                "Jane", "Doe", "jane@example.com", "555-1234"
        );
        when(rateLimitRepo.countByEmailAndCreatedAtAfter(anyString(), any())).thenReturn(0L);
        when(rateLimitRepo.countByIpAddressAndCreatedAtAfter(anyString(), any())).thenReturn(5L);

        assertThatThrownBy(() -> service.book(req, "10.0.0.1"))
                .isInstanceOf(Exceptions.RateLimitExceededException.class)
                .hasMessageContaining("network");
    }

    // ─────────────────────────────────────────────────────
    // Reschedule
    // ─────────────────────────────────────────────────────

    @Test
    void reschedule_success() {
        UUID id = UUID.randomUUID();
        Appointment appt = baseAppointment(id);
        when(appointmentRepo.findById(id)).thenReturn(Optional.of(appt));
        when(appointmentRepo.existsByBranchIdAndDateAndTimeAndIdNot(anyInt(), any(), any(), any()))
                .thenReturn(false);
        when(appointmentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LocalDate newDate = LocalDate.of(2026, 7, 1);
        LocalTime newTime = LocalTime.of(14, 0);

        Dtos.AppointmentResponse result = service.reschedule(id, newDate, newTime, "staff");

        assertThat(result.date()).isEqualTo(newDate);
        assertThat(result.time()).isEqualTo(newTime);
        assertThat(result.status()).isEqualTo("confirmed");
        verify(historyRepo).save(any());
    }

    @Test
    void reschedule_conflictingSlot_throws() {
        UUID id = UUID.randomUUID();
        when(appointmentRepo.findById(id)).thenReturn(Optional.of(baseAppointment(id)));
        when(appointmentRepo.existsByBranchIdAndDateAndTimeAndIdNot(anyInt(), any(), any(), any()))
                .thenReturn(true);

        assertThatThrownBy(() -> service.reschedule(id, LocalDate.now(), LocalTime.of(9, 0), "staff"))
                .isInstanceOf(Exceptions.SlotAlreadyBookedException.class);
    }

    // ─────────────────────────────────────────────────────
    // Cancel
    // ─────────────────────────────────────────────────────

    @Test
    void cancel_adminRole_succeeds() {
        UUID id = UUID.randomUUID();
        Appointment appt = baseAppointment(id);
        when(appointmentRepo.findById(id)).thenReturn(Optional.of(appt));
        when(appointmentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Dtos.AppointmentResponse result = service.cancel(id, "admin");
        assertThat(result.status()).isEqualTo("cancelled");
    }

    @Test
    void cancel_staffRole_throws() {
        UUID id = UUID.randomUUID();
        assertThatThrownBy(() -> service.cancel(id, "staff"))
                .isInstanceOf(Exceptions.InsufficientRoleException.class);
    }

    // ─────────────────────────────────────────────────────
    // Status update
    // ─────────────────────────────────────────────────────

    @Test
    void updateStatus_invalidValue_throws() {
        UUID id = UUID.randomUUID();
        when(appointmentRepo.findById(id)).thenReturn(Optional.of(baseAppointment(id)));

        assertThatThrownBy(() -> service.updateStatus(id, "unknown_status", "staff"))
                .isInstanceOf(Exceptions.InvalidStatusException.class);
    }

    @Test
    void updateStatus_valid_savesHistory() {
        UUID id = UUID.randomUUID();
        Appointment appt = baseAppointment(id);
        when(appointmentRepo.findById(id)).thenReturn(Optional.of(appt));
        when(appointmentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.updateStatus(id, "no_show", "staff");

        verify(historyRepo).save(any());
    }

    // ─────────────────────────────────────────────────────
    // Notes
    // ─────────────────────────────────────────────────────

    @Test
    void updateNotes_persistsNote() {
        UUID id = UUID.randomUUID();
        Appointment appt = baseAppointment(id);
        when(appointmentRepo.findById(id)).thenReturn(Optional.of(appt));
        when(appointmentRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Dtos.AppointmentResponse result = service.updateNotes(id, "Customer called ahead.");
        assertThat(result.staffNotes()).isEqualTo("Customer called ahead.");
    }

    // ─────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────

    private Appointment baseAppointment(UUID id) {
        return Appointment.builder()
                .id(id)
                .topicId(1).topicName("Open an account")
                .branchId(1).branchName("Southland Shopping Center")
                .branchAddress("1731 E Mechanic St, Harrisonville, MO 64701")
                .date(LocalDate.of(2026, 6, 1))
                .time(LocalTime.of(10, 0))
                .firstName("John").lastName("Smith")
                .email("john@example.com").phone("555-9999")
                .status("confirmed").staffNotes("")
                .createdAt(Instant.now()).updatedAt(Instant.now())
                .build();
    }
}
