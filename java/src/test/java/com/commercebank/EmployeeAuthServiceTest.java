package com.commercebank;

import com.commercebank.config.AppProperties;
import com.commercebank.exception.Exceptions;
import com.commercebank.service.EmployeeAuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class EmployeeAuthServiceTest {

    EmployeeAuthService service;

    // Pre-computed hashes for test passwords
    // "staffpass"  → sha256
    // "adminpass"  → sha256
    static final String STAFF_HASH = sha256Static("staffpass");
    static final String ADMIN_HASH  = sha256Static("adminpass");

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.RateLimit(3, 5),
                new AppProperties.Auth(STAFF_HASH, ADMIN_HASH),
                new AppProperties.Cors(List.of())
        );
        service = new EmployeeAuthService(props);
    }

    @Test
    void validStaffPassword_returnsStaffRole() {
        EmployeeAuthService.AuthResult result = service.verify("staffpass");
        assertThat(result.role()).isEqualTo("staff");
        assertThat(result.token()).isEqualTo(STAFF_HASH);
    }

    @Test
    void validAdminPassword_returnsAdminRole() {
        EmployeeAuthService.AuthResult result = service.verify("adminpass");
        assertThat(result.role()).isEqualTo("admin");
        assertThat(result.token()).isEqualTo(ADMIN_HASH);
    }

    @Test
    void invalidPassword_throws() {
        assertThatThrownBy(() -> service.verify("wrongpassword"))
                .isInstanceOf(Exceptions.InvalidCredentialsException.class);
    }

    @Test
    void sha256_isConsistent() {
        String h1 = service.sha256("hello");
        String h2 = service.sha256("hello");
        assertThat(h1).isEqualTo(h2);
        assertThat(h1).hasSize(64);
    }

    @Test
    void sha256_differentInputs_differentHashes() {
        assertThat(service.sha256("abc")).isNotEqualTo(service.sha256("ABC"));
    }

    // Static helper so we can compute the expected hash in @BeforeEach
    static String sha256Static(String input) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            var sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
