package com.commercebank;

import com.commercebank.controller.AdminController;
import com.commercebank.dto.Dtos;
import com.commercebank.exception.GlobalExceptionHandler;
import com.commercebank.service.AppointmentService;
import com.commercebank.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.*;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock AppointmentService appointmentService;
    @Mock AuditLogService auditLogService;

    MockMvc mockMvc;
    ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        AdminController controller = new AdminController(appointmentService, auditLogService);
        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    // ─────────────────────────────────────────────────────
    // GET /api/admin/appointments
    // ─────────────────────────────────────────────────────

    @Test
    void getAppointments_noParams_returnsAll() throws Exception {
        when(appointmentService.getAllAppointments()).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/admin/appointments")
                        .principal(adminAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getAppointments_withSearch_callsSearch() throws Exception {
        when(appointmentService.searchAppointments("jane")).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/appointments").param("search", "jane")
                        .principal(adminAuth()))
                .andExpect(status().isOk());

        verify(appointmentService).searchAppointments("jane");
    }

    // ─────────────────────────────────────────────────────
    // PATCH /api/admin/appointments/{id}/reschedule
    // ─────────────────────────────────────────────────────

    @Test
    void reschedule_valid_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        var req = new Dtos.RescheduleRequest(LocalDate.of(2026, 7, 1), LocalTime.of(14, 0));
        when(appointmentService.reschedule(eq(id), any(), any(), anyString()))
                .thenReturn(sampleResponse());

        mockMvc.perform(patch("/api/admin/appointments/{id}/reschedule", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req))
                        .principal(staffAuth()))
                .andExpect(status().isOk());
    }

    // ─────────────────────────────────────────────────────
    // PATCH /api/admin/appointments/{id}/status
    // ─────────────────────────────────────────────────────

    @Test
    void updateStatus_valid_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(appointmentService.updateStatus(eq(id), eq("no_show"), anyString()))
                .thenReturn(sampleResponse());

        mockMvc.perform(patch("/api/admin/appointments/{id}/status", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"no_show\"}")
                        .principal(staffAuth()))
                .andExpect(status().isOk());
    }

    // ─────────────────────────────────────────────────────
    // DELETE /api/admin/appointments/{id}
    // ─────────────────────────────────────────────────────

    @Test
    void cancel_admin_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(appointmentService.cancel(eq(id), eq("admin"))).thenReturn(sampleResponse());

        mockMvc.perform(delete("/api/admin/appointments/{id}", id)
                        .principal(adminAuth()))
                .andExpect(status().isOk());
    }

    // ─────────────────────────────────────────────────────
    // GET /api/admin/audit
    // ─────────────────────────────────────────────────────

    @Test
    void auditLog_adminRole_returns200() throws Exception {
        when(auditLogService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/audit").principal(adminAuth()))
                .andExpect(status().isOk());
    }

    @Test
    void auditLog_staffRole_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/audit").principal(staffAuth()))
                .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    private Dtos.AppointmentResponse sampleResponse() {
        return Dtos.AppointmentResponse.builder()
                .id(UUID.randomUUID())
                .topicId(1).topicName("Open an account")
                .branchId(1).branchName("Southland Shopping Center")
                .branchAddress("1731 E Mechanic St")
                .date(LocalDate.of(2026, 6, 1)).time(LocalTime.of(10, 0))
                .firstName("John").lastName("Smith")
                .email("john@example.com").phone("555-9999")
                .status("confirmed").staffNotes("")
                .createdAt(Instant.now()).updatedAt(Instant.now())
                .build();
    }

    private UsernamePasswordAuthenticationToken adminAuth() {
        return new UsernamePasswordAuthenticationToken(
                "admin", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    private UsernamePasswordAuthenticationToken staffAuth() {
        return new UsernamePasswordAuthenticationToken(
                "staff", null, List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
    }
}
