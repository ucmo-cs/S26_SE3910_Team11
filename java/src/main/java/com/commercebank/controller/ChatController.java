package com.commercebank.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;

/**
 * POST /api/chat
 * Proxies the conversation to the configured AI provider (OpenAI-compatible API)
 * and streams the SSE response back to the client.
 *
 * Set CHAT_API_KEY and optionally CHAT_API_URL + CHAT_MODEL in environment variables.
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final String SYSTEM_PROMPT = """
            You are a helpful Commerce Bank virtual assistant. You help customers with:
            - Booking appointments at branch locations
            - Information about banking services (accounts, loans, financial planning)
            - Branch locations and hours

            Branch locations:
            1. Southland Shopping Center - 1731 E Mechanic St, Harrisonville, MO 64701
               (supports: Open an Account, Loan & Mortgage, Other)
            2. Harrisonville Main Branch & ATM - 1301 Locust St, Harrisonville, MO 64701
               (supports: Open an Account, Financial Planning, Other)

            Appointments are available in 30-minute slots from 9:00 AM to 5:00 PM, Monday through Friday.
            Topics: Open an Account, Loan & Mortgage Consultation, Financial Planning & Wealth Management, Other.
            When users want to book, guide them to use the appointment wizard on the page.
            Keep responses concise and friendly.
            """;

    @Value("${app.chat.api-key:}")
    private String apiKey;

    @Value("${app.chat.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.chat.model:gpt-4o-mini}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public void chat(@RequestBody Map<String, Object> body,
                     HttpServletResponse response) throws IOException {

        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");

        if (apiKey == null || apiKey.isBlank()) {
            response.getWriter().write("data: {\"error\":\"Chat API key not configured\"}\n\n");
            response.getWriter().flush();
            return;
        }

        @SuppressWarnings("unchecked")
        List<Map<String, String>> incomingMessages = (List<Map<String, String>>) body.get("messages");
        if (incomingMessages == null) incomingMessages = List.of();

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        messages.addAll(incomingMessages);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", messages,
                "stream", true
        );

        try {
            String jsonBody = objectMapper.writeValueAsString(requestBody);

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<InputStream> apiResponse = httpClient.send(
                    req, HttpResponse.BodyHandlers.ofInputStream());

            if (apiResponse.statusCode() != 200) {
                String error = new String(apiResponse.body().readAllBytes());
                response.getWriter().write("data: {\"error\":\"AI service error: " +
                        apiResponse.statusCode() + "\"}\n\n");
                response.getWriter().flush();
                return;
            }

            // Stream SSE lines straight through to the client
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(apiResponse.body()))) {
                PrintWriter writer = response.getWriter();
                String line;
                while ((line = reader.readLine()) != null) {
                    writer.write(line + "\n");
                    if (line.isBlank()) writer.write("\n");
                    writer.flush();
                }
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            response.getWriter().write("data: {\"error\":\"Request interrupted\"}\n\n");
            response.getWriter().flush();
        } catch (Exception e) {
            response.getWriter().write("data: {\"error\":\"Internal error\"}\n\n");
            response.getWriter().flush();
        }
    }
}
