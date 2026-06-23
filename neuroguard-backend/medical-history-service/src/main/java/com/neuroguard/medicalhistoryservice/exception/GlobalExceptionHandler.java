package com.neuroguard.medicalhistoryservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        // Map specific error messages to appropriate HTTP status codes
        if (message != null) {
            if (message.contains("not found") || message.contains("Not found")) {
                status = HttpStatus.NOT_FOUND;
            } else if (message.contains("Access denied") || message.contains("access denied")) {
                status = HttpStatus.FORBIDDEN;
            } else if (message.contains("Unauthorized") || message.contains("unauthorized")) {
                status = HttpStatus.UNAUTHORIZED;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("error", message);
        response.put("status", status.value());
        response.put("timestamp", LocalDateTime.now());

        return new ResponseEntity<>(response, status);
    }
}
