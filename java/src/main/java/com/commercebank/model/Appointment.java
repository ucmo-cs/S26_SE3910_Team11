package com.commercebank.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "topic_id", nullable = false)
    private Integer topicId;

    @Column(name = "topic_name", nullable = false, length = 120)
    private String topicName;

    @Column(name = "branch_id", nullable = false)
    private Integer branchId;

    @Column(name = "branch_name", nullable = false, length = 200)
    private String branchName;

    @Column(name = "branch_address", nullable = false, length = 300)
    private String branchAddress;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "time", nullable = false)
    private LocalTime time;

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "phone", nullable = false, length = 40)
    @Builder.Default
    private String phone = "";

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "confirmed";

    @Column(name = "staff_notes", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String staffNotes = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (email != null) email = email.toLowerCase();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
