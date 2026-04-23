package com.commercebank.repository;

import com.commercebank.model.RateLimitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface RateLimitLogRepository extends JpaRepository<RateLimitLog, UUID> {

    long countByEmailAndCreatedAtAfter(String email, Instant after);

    long countByIpAddressAndCreatedAtAfter(String ipAddress, Instant after);

    /** Cleanup job: delete entries older than the window to keep the table lean. */
    void deleteByCreatedAtBefore(Instant before);
}
