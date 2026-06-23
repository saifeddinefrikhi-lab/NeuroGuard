package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.client.AlertServiceClient;
import com.neuroguard.medicalhistoryservice.dto.PatientStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.AlertResponse;
import com.neuroguard.medicalhistoryservice.entity.MedicalHistory;
import com.neuroguard.medicalhistoryservice.repository.PatientStatisticsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Patient Statistics Service - Aggregates medical history and alert statistics
 * Uses repositories with table joins for efficient data retrieval
 */
@Service
@Slf4j
public class PatientStatisticsService {

    @Autowired
    private PatientStatisticsRepository patientStatisticsRepository;

    @Autowired
    private AlertServiceClient alertServiceClient;

    /**
     * Get comprehensive statistics for a patient
     * Combines medical history data with alert statistics via Feign client
     */
    public PatientStatisticsDTO getPatientStatistics(Long patientId) {
        log.debug("Fetching statistics for patient: {}", patientId);

        // Get medical history
        MedicalHistory medicalHistory = patientStatisticsRepository.findByPatientId(patientId)
            .orElse(null);

        // Build DTO
        PatientStatisticsDTO stats = PatientStatisticsDTO.builder()
            .patientId(patientId)
            .hasMedicalHistory(medicalHistory != null)
            .progressionStage(medicalHistory != null ? medicalHistory.getProgressionStage().toString() : null)
            .totalSurgeries(medicalHistory != null ? (medicalHistory.getSurgeries() != null ? medicalHistory.getSurgeries().size() : 0) : 0)
            .mmse(medicalHistory != null ? medicalHistory.getMmse() : null)
            .functionalAssessment(medicalHistory != null ? medicalHistory.getFunctionalAssessment() : null)
            .adl(medicalHistory != null ? medicalHistory.getAdl() : null)
            .geneticRisk(medicalHistory != null ? (medicalHistory.getGeneticRisk() != null && !medicalHistory.getGeneticRisk().isBlank()) : false)
            .smoking(medicalHistory != null ? medicalHistory.getSmoking() : null)
            .cardiovascularDisease(medicalHistory != null ? medicalHistory.getCardiovascularDisease() : null)
            .diabetes(medicalHistory != null ? medicalHistory.getDiabetes() : null)
            .depression(medicalHistory != null ? medicalHistory.getDepression() : null)
            .comorbiditiesCount(countCommaItems(medicalHistory != null ? medicalHistory.getComorbidities() : null))
            .medicationAllergiesCount(countCommaItems(medicalHistory != null ? medicalHistory.getMedicationAllergies() : null))
            .foodAllergiesCount(countCommaItems(medicalHistory != null ? medicalHistory.getFoodAllergies() : null))
            .environmentalAllergiesCount(countCommaItems(medicalHistory != null ? medicalHistory.getEnvironmentalAllergies() : null))
            .totalRiskFactors(calculateTotalRiskFactors(medicalHistory))
            .healthConditionCount(calculateHealthConditionCount(medicalHistory))
            .build();

        try {
            // Fetch alerts from alert service and aggregate
            List<AlertResponse> alerts = alertServiceClient.getPatientAlerts(patientId);

            if (alerts != null && !alerts.isEmpty()) {
                int totalAlerts = alerts.size();
                int resolvedAlerts = (int) alerts.stream().filter(a -> a.isResolved()).count();
                int pendingAlerts = totalAlerts - resolvedAlerts;
                int criticalAlerts = (int) alerts.stream()
                    .filter(a -> !a.isResolved() && "CRITICAL".equalsIgnoreCase(a.getSeverity()))
                    .count();
                int warningAlerts = (int) alerts.stream()
                    .filter(a -> !a.isResolved() && "WARNING".equalsIgnoreCase(a.getSeverity()))
                    .count();
                int infoAlerts = (int) alerts.stream()
                    .filter(a -> !a.isResolved() && "INFO".equalsIgnoreCase(a.getSeverity()))
                    .count();

                stats.setTotalAlerts(totalAlerts);
                stats.setResolvedAlerts(resolvedAlerts);
                stats.setPendingAlerts(pendingAlerts);
                stats.setCriticalAlerts(criticalAlerts);
                stats.setWarningAlerts(warningAlerts);
                stats.setInfoAlerts(infoAlerts);
            }

            log.info("Successfully retrieved statistics for patient: {}", patientId);
        } catch (Exception e) {
            log.warn("Failed to fetch alert statistics for patient {}: {}", patientId, e.getMessage());
            // Continue with medical history stats even if alerts fail
        }

        return stats;
    }

    /**
     * Count comma-separated items
     */
    private int countCommaItems(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        return (int) java.util.Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .count();
    }

    /**
     * Calculate total risk factors from medical history
     */
    private int calculateTotalRiskFactors(MedicalHistory medicalHistory) {
        if (medicalHistory == null) {
            return 0;
        }
        return countCommaItems(medicalHistory.getComorbidities()) +
               countCommaItems(medicalHistory.getMedicationAllergies()) +
               countCommaItems(medicalHistory.getFoodAllergies()) +
               countCommaItems(medicalHistory.getEnvironmentalAllergies());
    }

    /**
     * Calculate number of health conditions (boolean flags)
     */
    private int calculateHealthConditionCount(MedicalHistory medicalHistory) {
        if (medicalHistory == null) {
            return 0;
        }
        int count = 0;
        if (medicalHistory.getGeneticRisk() != null && !medicalHistory.getGeneticRisk().isBlank()) count++;
        if (medicalHistory.getSmoking() != null && medicalHistory.getSmoking()) count++;
        if (medicalHistory.getCardiovascularDisease() != null && medicalHistory.getCardiovascularDisease()) count++;
        if (medicalHistory.getDiabetes() != null && medicalHistory.getDiabetes()) count++;
        if (medicalHistory.getDepression() != null && medicalHistory.getDepression()) count++;
        return count;
    }
}