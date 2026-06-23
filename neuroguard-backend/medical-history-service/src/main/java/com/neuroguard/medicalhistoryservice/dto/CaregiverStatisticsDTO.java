package com.neuroguard.medicalhistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Caregiver Statistics DTO - Aggregated statistics for a caregiver's patient management
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaregiverStatisticsDTO {
    private Long caregiverId;

    // Patient assignment
    private int totalAssignedPatients;
    private int patientsWithMedicalHistory;
    private double historyCoverage;              // % of assigned patients with history

    // Progression tracking
    private int mildCases;
    private int moderateCases;
    private int severeCases;

    // Alert statistics (for assigned patients)
    private int totalAlerts;
    private int pendingAlerts;
    private int resolvedAlerts;
    private int criticalAlerts;
    private int warningAlerts;
    private int infoAlerts;

    // Risk assessment
    private double averageMMSE;
    private double averageFunctionalAssessment;
    private double averageADL;

    // Alert trends
    private double alertResolutionRate;          // % of resolved alerts
    private double criticalAlertRate;            // % of critical alerts among all alerts
    private int unresolvedCriticalAlerts;        // Count of unresolved critical alerts

    // Cognitive health distribution
    private int patientsWithLowMMSE;             // MMSE < 18
    private int patientsWithCognitiveDifficultyOptions;  // Low functional assessment or ADL

    // Additional health metrics
    private int patientsWithHealthRisks;         // Count with comorbidities OR genetic risk
    private double averageRiskFactors;           // Avg number of health conditions per patient
}
