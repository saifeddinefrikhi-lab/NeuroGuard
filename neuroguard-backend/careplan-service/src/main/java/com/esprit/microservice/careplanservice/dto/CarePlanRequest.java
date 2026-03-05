package com.esprit.microservice.careplanservice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CarePlanRequest {
    @NotNull(message = "Patient ID is required")
    @Positive(message = "Patient ID must be positive")
    private Long patientId;

    /** Optional: for ADMIN only - ID of the healthcare provider who creates the plan. If null, current user is used. */
    @Positive(message = "Provider ID must be positive when provided")
    private Long providerId;

    /** Priority: LOW, MEDIUM, HIGH. Default MEDIUM if not set. */
    private String priority;

    private String nutritionPlan;
    private String sleepPlan;
    private String activityPlan;
    private String medicationPlan;

    /** Optional deadlines per section (patient sees timer/countdown). */
    private LocalDateTime nutritionDeadline;
    private LocalDateTime sleepDeadline;
    private LocalDateTime activityDeadline;
    private LocalDateTime medicationDeadline;
}