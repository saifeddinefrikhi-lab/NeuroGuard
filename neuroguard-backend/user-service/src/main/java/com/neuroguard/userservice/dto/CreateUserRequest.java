package com.neuroguard.userservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    @Size(max = 100)
    private String email;

    @Size(max = 20, message = "Phone number must be at most 20 characters")
    @Pattern(regexp = "^$|^[0-9+\\s\\-()]+$", message = "Phone number can only contain digits, spaces, +, -, (, )")
    private String phoneNumber;

    private String gender;

    @Min(value = 0, message = "Age must be at least 0")
    @Max(value = 150, message = "Age must be at most 150")
    private Integer age;

    @NotNull(message = "Role is required")
    @Pattern(regexp = "^(ADMIN|PATIENT|PROVIDER|CAREGIVER)$", message = "Role must be one of: ADMIN, PATIENT, PROVIDER, CAREGIVER")
    private String role;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;
}