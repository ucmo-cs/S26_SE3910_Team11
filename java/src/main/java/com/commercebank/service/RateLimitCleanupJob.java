package com.commercebank.service;

import com.commercebank.repository.RateLimitLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Periodically removes rate_limit_log entries older than 2 hours
 * so the table stays small. Runs every 30 minutes.
 */
@Component
public class RateLimitCleanupJob {

    private final RateLimitLogRepository repo;

    public RateLimitCleanupJob(RateLimitLogRepository repo) {
        this.repo = repo;
    }

    @Scheduled(fixedDelay = 30 * 60 * 1000) // every 30 min
    @Transactional
    public void purgeOldEntries() {
        Instant cutoff = Instant.now().minusSeconds(2 * 3600);
        repo.deleteByCreatedAtBefore(cutoff);
    }
}
