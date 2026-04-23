package com.commercebank.service;

import com.commercebank.config.AppProperties;
import com.commercebank.exception.Exceptions;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Verifies employee passwords by comparing the SHA-256 hash of the
 * submitted password against the configured hashes.
 * Mirrors employeeAuth.ts from the React project.
 */
@Service
public class EmployeeAuthService {

    private final AppProperties props;

    public EmployeeAuthService(AppProperties props) {
        this.props = props;
    }

    /**
     * Returns "admin" or "staff" if the password matches; throws otherwise.
     * The returned hash value doubles as the session token sent to the client.
     */
    public AuthResult verify(String password) {
        String hash = sha256(password);
        if (hash.equals(props.auth().adminHash())) return new AuthResult("admin", hash);
        if (hash.equals(props.auth().staffHash())) return new AuthResult("staff", hash);
        throw new Exceptions.InvalidCredentialsException();
    }

    public String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public record AuthResult(String role, String token) {}
}
