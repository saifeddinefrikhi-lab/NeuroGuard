package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.client.AlertServiceClient;
import com.neuroguard.medicalhistoryservice.dto.CaregiverStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.AlertResponse;
import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.repository.CaregiverStatisticsRepository;
import com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Caregiver Statistics Service - Aggregates assigned patient data and alerts for caregivers
 * Uses table joins with MedicalHistory and cross-service alert aggregation
 */
@Service
@Slf4j
public class CaregiverStatisticsService {

    @Autowired
    private CaregiverStatisticsRepository caregiverStatisticsRepository;

    @Autowired
    private MedicalHistoryRepository medicalHistoryRepository;

    @Autowired
    private AlertServiceClient alertServiceClient;

    /**
     * Get comprehensive statistics for a caregiver
     * Aggregates: assigned patients, progression stages, cognitive scores, alert statistics
     */
    public CaregiverStatisticsDTO getCaregiverStatistics(Long caregiverId) {
        log.debug("Fetching statistics for caregiver: {}", caregiverId);

        // Get base statistics from repository
        CaregiverStatisticsDTO stats = new CaregiverStatisticsDTO();
        stats.setCaregiverId(caregiverId);

        // Count assigned patients
        int totalAssignedPatients = caregiverStatisticsRepository.countAssignedPatients(caregiverId);
        int patientsWithHistory = caregiverStatisticsRepository.countAssignedPatientsWithHistory(caregiverId);

        stats.setTotalAssignedPatients(totalAssignedPatients);
        stats.setPatientsWithMedicalHistory(patientsWithHistory);

        // Calculate history coverage
        if (totalAssignedPatients > 0) {
            stats.setHistoryCoverage((patientsWithHistory * 100.0) / totalAssignedPatients);
        }

        // Progression stages
        stats.setMildCases(caregiverStatisticsRepository.countByProgressionStage(caregiverId, ProgressionStage.MILD));
        stats.setModerateCases(caregiverStatisticsRepository.countByProgressionStage(caregiverId, ProgressionStage.MODERATE));
        stats.setSevereCases(caregiverStatisticsRepository.countByProgressionStage(caregiverId, ProgressionStage.SEVERE));

        // Cognitive scores
        stats.setAverageMMSE(caregiverStatisticsRepository.getAverageMMSE(caregiverId));
        stats.setAverageFunctionalAssessment(caregiverStatisticsRepository.getAverageFunctionalAssessment(caregiverId));
        stats.setAverageADL(caregiverStatisticsRepository.getAverageADL(caregiverId));

        // High risk patients
        stats.setPatientsWithLowMMSE(caregiverStatisticsRepository.countPatientsWithLowMMSE(caregiverId));
        stats.setPatientsWithCognitiveDifficultyOptions(
            caregiverStatisticsRepository.countPatientsWithHighDependency(caregiverId)
        );

        // Get patient IDs for alert aggregation
        List<Long> patientIds = getPatientIdsByCaregiverId(caregiverId);

        try {
            // Fetch and aggregate alerts for assigned patients
            aggregateAlertStatistics(stats, patientIds);
        } catch (Exception e) {
            log.warn("Failed to fetch alert statistics for caregiver {}: {}", caregiverId, e.getMessage());
        }

        // Calculate additional health metrics for assigned patients
        calculateHealthRiskMetrics(stats, caregiverId);

        log.info("Successfully retrieved statistics for caregiver: {}", caregiverId);
        return stats;
    }

    /**
     * Get patient IDs assigned to a caregiver
     */
    private List<Long> getPatientIdsByCaregiverId(Long caregiverId) {
        return medicalHistoryRepository
            .findByCaregiverId(caregiverId, Pageable.unpaged())
            .stream()
            .map(mh -> mh.getPatientId())
            .collect(Collectors.toList());
    }

    /**
     * Aggregate alert statistics from alert service for multiple patients
     */
    private void aggregateAlertStatistics(CaregiverStatisticsDTO stats, List<Long> patientIds) {
        if (patientIds.isEmpty()) {
            return;
        }

        // Fetch all alerts for these assigned patients
        List<AlertResponse> allAlerts = alertServiceClient.getPatientAlertsForIds(patientIds);

        if (allAlerts != null && !allAlerts.isEmpty()) {
            int totalAlerts = allAlerts.size();
            int resolvedAlerts = (int) allAlerts.stream().filter(a -> a.isResolved()).count();
            int pendingAlerts = totalAlerts - resolvedAlerts;

            int criticalAlerts = (int) allAlerts.stream()
                .filter(a -> !a.isResolved() && "CRITICAL".equalsIgnoreCase(a.getSeverity()))
                .count();
            int warningAlerts = (int) allAlerts.stream()
                .filter(a -> !a.isResolved() && "WARNING".equalsIgnoreCase(a.getSeverity()))
                .count();
            int infoAlerts = (int) allAlerts.stream()
                .filter(a -> !a.isResolved() && "INFO".equalsIgnoreCase(a.getSeverity()))
                .count();

            stats.setTotalAlerts(totalAlerts);
            stats.setResolvedAlerts(resolvedAlerts);
            stats.setPendingAlerts(pendingAlerts);
            stats.setCriticalAlerts(criticalAlerts);
            stats.setWarningAlerts(warningAlerts);
            stats.setInfoAlerts(infoAlerts);

            // Calculate resolution rate and critical alert rate
            if (totalAlerts > 0) {
                stats.setAlertResolutionRate((resolvedAlerts * 100.0) / totalAlerts);
                stats.setCriticalAlertRate((criticalAlerts * 100.0) / totalAlerts);
            }

            stats.setUnresolvedCriticalAlerts(criticalAlerts);
        }
    }

    /**
     * Calculate health risk metrics for patients assigned to caregiver
     */
    private void calculateHealthRiskMetrics(CaregiverStatisticsDTO stats, Long caregiverId) {
        List<com.neuroguard.medicalhistoryservice.entity.MedicalHistory> medicalHistories =
            medicalHistoryRepository.findByCaregiverId(caregiverId, Pageable.unpaged()).getContent();

        if (medicalHistories.isEmpty()) {
            stats.setPatientsWithHealthRisks(0);
            stats.setAverageRiskFactors(0.0);
            return;
        }

        int patientsWithHealthRisks = 0;
        int totalRiskFactors = 0;

        for (com.neuroguard.medicalhistoryservice.entity.MedicalHistory mh : medicalHistories) {
            int comorbidityCount = countCommaItems(mh.getComorbidities());
            boolean hasGeneticRisk = mh.getGeneticRisk() != null && !mh.getGeneticRisk().isBlank();

            if (comorbidityCount > 0 || hasGeneticRisk) {
                patientsWithHealthRisks++;
            }

            totalRiskFactors += countCommaItems(mh.getComorbidities()) +
                               countCommaItems(mh.getMedicationAllergies()) +
                               countCommaItems(mh.getFoodAllergies()) +
                               countCommaItems(mh.getEnvironmentalAllergies());
        }

        stats.setPatientsWithHealthRisks(patientsWithHealthRisks);
        stats.setAverageRiskFactors((double) totalRiskFactors / medicalHistories.size());
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
}