package com.commercebank.exception;

import com.commercebank.dto.Dtos;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exceptions.SlotAlreadyBookedException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleConflict(Exceptions.SlotAlreadyBookedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Dtos.ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(Exceptions.RateLimitExceededException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleRateLimit(Exceptions.RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Dtos.ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(Exceptions.AppointmentNotFoundException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleNotFound(Exceptions.AppointmentNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Dtos.ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(Exceptions.InsufficientRoleException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleForbidden(Exceptions.InsufficientRoleException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Dtos.ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(Exceptions.InvalidCredentialsException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleUnauthorized(Exceptions.InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Dtos.ErrorResponse.of(ex.getMessage()));
    }

    @ExceptionHandler(Exceptions.InvalidStatusException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleBadStatus(Exceptions.InvalidStatusException ex) {
        return ResponseEntity.badRequest().body(Dtos.ErrorResponse.of(ex.getMessage()));
    }

    /** Bean validation errors */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Dtos.ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
                .body(new Dtos.ErrorResponse("Validation failed", fieldErrors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Dtos.ErrorResponse> handleGeneral(Exception ex, HttpServletRequest req) {
        // Log at error level in a real app
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Dtos.ErrorResponse.of("Internal server error"));
    }
}
