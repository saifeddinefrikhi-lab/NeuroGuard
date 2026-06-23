package com.neuroguard.userservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;

@Getter
@Setter
public class GoogleLoginRequest {
    @NotBlank(message = "ID Token is required")
    @JsonProperty("idToken")
    private String idToken;

    @JsonProperty("role")
    private String role; // Optional: used for completing registration
}
