package com.commercebank.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        RateLimit rateLimit,
        Auth auth,
        Cors cors
) {
    public record RateLimit(int emailPerHour, int ipPerHour) {}
    public record Auth(String staffHash, String adminHash) {}
    public record Cors(List<String> allowedOrigins) {}
}
