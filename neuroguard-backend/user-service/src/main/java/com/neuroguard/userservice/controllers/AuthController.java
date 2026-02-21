package com.neuroguard.userservice.controllers;



import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.security.JwtUtils;
import com.neuroguard.userservice.services.UserService;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtils jwtUtils;

    // Login endpoint that returns a JWT token
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest loginRequest) {
        String token = userService.loginUser(loginRequest.getUsername(), loginRequest.getPassword());
        return Objects.requireNonNullElse(token, "Invalid credentials"); // Simplified if statement
    }

    // Register user method
    @PostMapping("/register")
    public String register(@RequestBody User user) {
        return userService.registerUser(user);
    }

    // DTO for login request
    @Getter
    @Setter
    public static class LoginRequest {
        private String username;
        private String password;
    }

    // Logout endpoint
    @PostMapping("/logout")
    public String logoutUser(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7); // Remove "Bearer " prefix
            jwtUtils.invalidateToken(jwt); // Invalidate the token
            SecurityContextHolder.clearContext();
            return "User logged out successfully!";
        }
        return "No active session to logout!";
    }


}