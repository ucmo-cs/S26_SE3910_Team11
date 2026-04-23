package com.commercebank.controller;

import com.commercebank.dto.Dtos;
import com.commercebank.service.EmployeeAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * POST /api/employee/login
 * Mirrors the shared-password gate in employeeAuth.ts.
 * Returns { role, token } — the token is the SHA-256 hash used as a Bearer token.
 */
@RestController
@RequestMapping("/api/employee")
public class EmployeeAuthController {

    private final EmployeeAuthService authService;

    public EmployeeAuthController(EmployeeAuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<Dtos.LoginResponse> login(
            @Valid @RequestBody Dtos.LoginRequest req) {
        EmployeeAuthService.AuthResult result = authService.verify(req.password());
        return ResponseEntity.ok(new Dtos.LoginResponse(result.role(), result.token()));
    }
}
