package com.esprit.microservice.careplanservice.dto;

import lombok.Data;

@Data
public class StatusUpdateRequest {
    /** Section: nutrition, sleep, activity, medication */
    private String section;
    /** TODO or DONE */
    private String status;
}
