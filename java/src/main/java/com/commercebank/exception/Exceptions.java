package com.commercebank.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

public final class Exceptions {
    private Exceptions() {}

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class SlotAlreadyBookedException extends RuntimeException {
        public SlotAlreadyBookedException() {
            super("That time slot is already booked. Please choose another.");
        }
    }

    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public static class RateLimitExceededException extends RuntimeException {
        public RateLimitExceededException(String message) {
            super(message);
        }
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    public static class AppointmentNotFoundException extends RuntimeException {
        public AppointmentNotFoundException(java.util.UUID id) {
            super("Appointment not found: " + id);
        }
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class InsufficientRoleException extends RuntimeException {
        public InsufficientRoleException(String message) {
            super(message);
        }
    }

    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid credentials.");
        }
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class InvalidStatusException extends RuntimeException {
        public InvalidStatusException(String status) {
            super("Invalid status value: " + status);
        }
    }
}
