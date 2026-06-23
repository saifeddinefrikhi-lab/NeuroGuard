package com.neuroguard.medicalhistoryservice.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    private static final Logger log = LoggerFactory.getLogger(TestController.class);

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuthGet(HttpServletRequest request) {
        return buildAuthResponse("GET", request);
    }

    @PostMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuthPost(HttpServletRequest request) {
        return buildAuthResponse("POST", request);
    }

    @PutMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuthPut(HttpServletRequest request) {
        return buildAuthResponse("PUT", request);
    }

    @DeleteMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuthDelete(HttpServletRequest request) {
        return buildAuthResponse("DELETE", request);
    }

    private ResponseEntity<Map<String, Object>> buildAuthResponse(String method, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("method", method);
        response.put("path", request.getRequestURI());

        String authHeader = request.getHeader("Authorization");
        response.put("authHeaderPresent", authHeader != null);
        if (authHeader != null) {
            response.put("authHeaderStartsWith Bearer", authHeader.startsWith("Bearer "));
        }

        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");
        response.put("userId", userId);
        response.put("userRole", userRole);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        response.put("authenticated", auth != null && auth.isAuthenticated());
        if (auth != null) {
            response.put("principal", auth.getPrincipal());
            response.put("authorities", auth.getAuthorities().stream().map(Object::toString).toArray());
        }

        log.info("Test {} {} - UserId: {}, UserRole: {}, Auth: {}", method, request.getRequestURI(), userId, userRole, auth != null && auth.isAuthenticated());

        return ResponseEntity.ok(response);
    }
}
