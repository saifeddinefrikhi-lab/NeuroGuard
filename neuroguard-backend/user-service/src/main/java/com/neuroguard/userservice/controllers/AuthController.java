package com.neuroguard.userservice.controllers;

import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.security.JwtUtils;
import com.neuroguard.userservice.services.UserService;
import com.neuroguard.userservice.services.PasswordResetService;
import com.neuroguard.userservice.repositories.PasswordResetTokenRepository;
import com.neuroguard.userservice.dto.GoogleLoginRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@Slf4j
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Value("${app.google.client-id:550789921754-tdpg2nso52gvhr2mgdhk0ra01hk79kt8.apps.googleusercontent.com}")
    private String googleClientId;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        String token;
        try {
            token = userService.loginUser(loginRequest.getUsername(), loginRequest.getPassword());
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            if ("BANNED".equals(e.getMessage())) {
                error.put("message", "Your account has been banned. Please contact support.");
            } else if ("DISABLED".equals(e.getMessage())) {
                error.put("message", "Your account has been disabled. Please contact support.");
            } else {
                error.put("message", "An error occurred during login.");
            }
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        if (token != null) {
            userService.updateLastSeen(loginRequest.getUsername());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "Login successful");
            return ResponseEntity.ok(response);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Invalid credentials");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        String result = userService.registerUser(user);
        Map<String, String> response = new HashMap<>();
        response.put("message", result);

        if (result.contains("successfully")) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Map<String, String> response = new HashMap<>();
        try {
            if (request.getEmail() == null || !isValidEmail(request.getEmail())) {
                response.put("message", "Valid email address is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            String resultMessage = passwordResetService.processForgotPassword(request.getEmail());
            response.put("message", resultMessage);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in forgot password controller: ", e);
            response.put("message", "An error occurred while processing your request.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        Map<String, String> response = new HashMap<>();
        try {
            if (request.getToken() == null || request.getToken().trim().isEmpty()) {
                response.put("message", "Reset token is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            passwordResetService.completePasswordReset(request.getToken().trim(), request.getNewPassword());
            response.put("message", "Password has been reset successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during password reset: ", e);
            response.put("message", "Failed to reset password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequest googleRequest) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleRequest.getIdToken());
            if (idToken != null) {
                Payload payload = idToken.getPayload();
                String email = payload.getEmail();

                Optional<User> userOpt = userService.findUserByEmail(email);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    String token = jwtUtils.generateJwtToken(user.getUsername(), user.getRole().name(), user.getId(), user.getTokenVersion());
                    Map<String, Object> response = new HashMap<>();
                    response.put("token", token);
                    response.put("message", "Google login successful");
                    return ResponseEntity.ok(response);
                } else {
                    Map<String, Object> response = new HashMap<>();
                    response.put("newUser", true);
                    response.put("email", email);
                    response.put("firstName", (String) payload.get("given_name"));
                    response.put("lastName", (String) payload.get("family_name"));
                    return ResponseEntity.ok(response);
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("message", "Invalid Google ID token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Google login failed"));
        }
    }

    @PostMapping("/google/complete")
    public ResponseEntity<?> googleComplete(@Valid @RequestBody GoogleLoginRequest googleRequest) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(googleRequest.getIdToken());
            if (idToken != null) {
                Payload payload = idToken.getPayload();
                User user = new User();
                user.setEmail(payload.getEmail());
                user.setFirstName((String) payload.get("given_name"));
                user.setLastName((String) payload.get("family_name"));
                user.setUsername(user.getEmail().split("@")[0] + "_" + System.currentTimeMillis() % 1000);
                user.setRole(Role.valueOf(googleRequest.getRole().toUpperCase()));
                
                User savedUser = userService.registerGoogleUser(user);
                String token = jwtUtils.generateJwtToken(savedUser.getUsername(), savedUser.getRole().name(), savedUser.getId(), savedUser.getTokenVersion());
                
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("message", "Google registration completed");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("message", "Invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestHeader(value = "Authorization", required = false) String token) {
        Map<String, String> response = new HashMap<>();
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            if (jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUsernameFromJwtToken(jwt);
                userService.clearLastSeen(username);
                jwtUtils.invalidateToken(jwt);
                SecurityContextHolder.clearContext();
                response.put("message", "User logged out successfully");
                return ResponseEntity.ok(response);
            }
        }
        response.put("message", "Logout failed or no active session");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @Getter
    @Setter
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Getter
    @Setter
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Getter
    @Setter
    public static class ResetPasswordRequest {
        @NotBlank(message = "Reset token is required")
        private String token;
        @NotBlank(message = "New password is required")
        private String newPassword;
        @NotBlank(message = "Password confirmation is required")
        private String confirmPassword;
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }
}