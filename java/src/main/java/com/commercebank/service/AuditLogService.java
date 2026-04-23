package com.commercebank.service;

import com.commercebank.dto.Dtos;
import com.commercebank.model.AuditLog;
import com.commercebank.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository repo;

    public AuditLogService(AuditLogRepository repo) {
        this.repo = repo;
    }

    public void log(String actorRole, String action, UUID appointmentId, Map<String, Object> details) {
        try {
            repo.save(AuditLog.builder()
                    .actorRole(actorRole)
                    .action(action)
                    .appointmentId(appointmentId)
                    .details(details != null ? details : Map.of())
                    .build());
        } catch (Exception e) {
            // Fire-and-forget — log but don't propagate
            System.err.println("Audit log failed: " + e.getMessage());
        }
    }

    public List<Dtos.AuditLogEntryResponse> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(a -> new Dtos.AuditLogEntryResponse(
                        a.getId(), a.getActorRole(), a.getAction(),
                        a.getAppointmentId(), a.getDetails(), a.getCreatedAt()))
                .toList();
    }
}
