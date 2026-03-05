package com.esprit.microservice.careplanservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CarePlanMessageResponse {
    private Long id;
    private Long carePlanId;
    private Long senderId;
    private String senderName;  // "Dr. X" or "Patient Y"
    private String content;
    private LocalDateTime createdAt;
}
