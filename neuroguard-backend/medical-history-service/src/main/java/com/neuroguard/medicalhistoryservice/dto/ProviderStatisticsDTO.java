package com.neuroguard.medicalhistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Provider Statistics DTO - Aggregated statistics for a healthcare provider's dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProviderStatisticsDTO {
    private Long providerId;

    // Patient management
    private int totalPatients;
    private int totalMedicalHistories;

    // Progression stages
    private int mildCases;
    private int moderateCases;
    private int severeCases;

    // Alert statistics
    private int totalAlerts;
    private int pendingAlerts;
    private int resolvedAlerts;
    private int criticalAlerts;
    private int warningAlerts;
    private int infoAlerts;

    // Risk factors across patients
    private int patientsWithGeneticRisk;
    private int patientsWithComorbidities;
    private int patientsWithAllergies;

    // Cognitive health indicators
    private double averageMMSE;
    private double averageFunctionalAssessment;
    private double averageADL;

    // Coverage metrics
    private double historyCoverage;              // % of patients with medical history
    private double alertCoverageRate;            // % of patients with at least one alert

    // Additional health metrics
    private int patientsWithHealthRisks;         // Count with comorbidities OR genetic risk
    private double averageRiskFactors;           // Avg number of health conditions per patient
}
