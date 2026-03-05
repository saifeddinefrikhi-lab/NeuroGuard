package com.esprit.microservice.careplanservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CarePlanMessageRequest {

    @NotBlank(message = "Message content is required")
    @Size(max = 4000)
    private String content;
}
