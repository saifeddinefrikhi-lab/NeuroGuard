package com.neuroguard.medicalhistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Alert Response DTO - Data Transfer Object for Alert Service communication
 * Used by AlertServiceClient to fetch alert statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String message;
    private String severity;
    private boolean resolved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
