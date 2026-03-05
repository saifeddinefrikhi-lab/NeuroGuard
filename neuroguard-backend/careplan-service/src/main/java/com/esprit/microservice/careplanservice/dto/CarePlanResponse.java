package com.esprit.microservice.careplanservice.dto;


import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CarePlanResponse {
    private Long id;
    private Long patientId;
    private String patientName;      // Optionnel : nom du patient récupéré via Feign
    private Long providerId;
    private String providerName;     // Optionnel
    private String priority;
    /** Section statuses - patient can update each to DONE independently */
    private String nutritionStatus;
    private String sleepStatus;
    private String activityStatus;
    private String medicationStatus;
    private String nutritionPlan;
    private String sleepPlan;
    private String activityPlan;
    private String medicationPlan;
    /** Deadlines per section (patient sees timer). */
    private LocalDateTime nutritionDeadline;
    private LocalDateTime sleepDeadline;
    private LocalDateTime activityDeadline;
    private LocalDateTime medicationDeadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}