package com.commercebank;

import com.commercebank.config.AppProperties;
import com.commercebank.controller.AppointmentController;
import com.commercebank.dto.Dtos;
import com.commercebank.service.AppointmentService;
import com.commercebank.service.TimeSlotService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.*;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {

    @Mock AppointmentService appointmentService;
    @Mock TimeSlotService timeSlotService;

    MockMvc mockMvc;
    ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        AppointmentController controller =
                new AppointmentController(appointmentService, timeSlotService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    @Test
    void postAppointment_valid_returns200() throws Exception {
        var req = new Dtos.BookAppointmentRequest(
                1, 1,
                LocalDate.of(2026, 6, 1), LocalTime.of(10, 0),
                "Jane", "Doe", "jane@example.com", "555-1234"
        );

        Dtos.AppointmentResponse response = Dtos.AppointmentResponse.builder()
                .id(UUID.randomUUID())
                .topicId(1).topicName("Open an account")
                .branchId(1).branchName("Southland Shopping Center")
                .branchAddress("1731 E Mechanic St")
                .date(req.date()).time(req.time())
                .firstName("Jane").lastName("Doe")
                .email("jane@example.com").phone("555-1234")
                .status("confirmed").staffNotes("")
                .createdAt(Instant.now()).updatedAt(Instant.now())
                .build();

        when(appointmentService.book(any(), anyString())).thenReturn(response);

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("jane@example.com"))
                .andExpect(jsonPath("$.status").value("confirmed"));
    }

    @Test
    void postAppointment_missingEmail_returns400() throws Exception {
        // email is blank — validation should reject
        String body = """
                {
                  "topicId": 1, "branchId": 1,
                  "date": "2026-06-01", "time": "10:00",
                  "firstName": "Jane", "lastName": "Doe",
                  "email": "", "phone": "555-1234"
                }
                """;

        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getBookedSlots_returnsSlots() throws Exception {
        when(appointmentService.getBookedSlots(1, LocalDate.of(2026, 6, 1)))
                .thenReturn(List.of(LocalTime.of(9, 0), LocalTime.of(10, 0)));

        mockMvc.perform(get("/api/appointments/slots")
                        .param("branchId", "1")
                        .param("date", "2026-06-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookedSlots").isArray())
                .andExpect(jsonPath("$.bookedSlots.length()").value(2));
    }

    @Test
    void getTimeSlots_returnsList() throws Exception {
        when(timeSlotService.generateSlots()).thenReturn(List.of(
                new TimeSlotService.TimeSlot("09:00", "9:00 AM"),
                new TimeSlotService.TimeSlot("09:30", "9:30 AM")
        ));

        mockMvc.perform(get("/api/appointments/time-slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }
}
