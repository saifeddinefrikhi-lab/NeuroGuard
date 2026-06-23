package com.neuroguard.medicalhistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Patient Statistics DTO - Aggregated statistics for a patient's healthcare overview
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientStatisticsDTO {
    // Medical history
    private Long patientId;
    private boolean hasMedicalHistory;
    private String progressionStage;

    // Surgery stats
    private int totalSurgeries;

    // Alert statistics
    private int totalAlerts;
    private int pendingAlerts;
    private int resolvedAlerts;
    private int criticalAlerts;
    private int warningAlerts;
    private int infoAlerts;

    // Risk factors
    private int comorbiditiesCount;
    private int medicationAllergiesCount;
    private int foodAllergiesCount;
    private int environmentalAllergiesCount;

    // Cognitive assessment
    private Integer mmse;
    private Integer functionalAssessment;
    private Integer adl;

    // Health indicators
    private Boolean geneticRisk;
    private Boolean smoking;
    private Boolean cardiovascularDisease;
    private Boolean diabetes;
    private Boolean depression;

    // Additional health metrics
    private int totalRiskFactors;        // Sum of comorbidities + all allergies
    private int healthConditionCount;    // Count of health conditions present
}
