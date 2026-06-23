package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.client.AlertServiceClient;
import com.neuroguard.medicalhistoryservice.dto.ProviderStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.AlertResponse;
import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.repository.ProviderStatisticsRepository;
import com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Provider Statistics Service - Aggregates patient data and alerts for healthcare providers
 * Uses table joins with MedicalHistory, Surgeries, and cross-service alert data
 */
@Service
@Slf4j
public class ProviderStatisticsService {

    @Autowired
    private ProviderStatisticsRepository providerStatisticsRepository;

    @Autowired
    private MedicalHistoryRepository medicalHistoryRepository;

    @Autowired
    private AlertServiceClient alertServiceClient;

    /**
     * Get comprehensive statistics for a provider
     * Aggregates: patient counts, progression stages, cognitive scores, alert statistics
     */
    public ProviderStatisticsDTO getProviderStatistics(Long providerId) {
        log.debug("Fetching statistics for provider: {}", providerId);

        // Get base medical history statistics from repository join queries
        ProviderStatisticsDTO stats = new ProviderStatisticsDTO();
        stats.setProviderId(providerId);

        // Count patients
        int totalPatients = providerStatisticsRepository.countPatientsByProviderId(providerId);
        stats.setTotalPatients(totalPatients);
        stats.setTotalMedicalHistories(totalPatients);

        // Progression stages
        stats.setMildCases(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MILD));
        stats.setModerateCases(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.MODERATE));
        stats.setSevereCases(providerStatisticsRepository.countByProgressionStage(providerId, ProgressionStage.SEVERE));

        // Cognitive scores
        stats.setAverageMMSE(providerStatisticsRepository.getAverageMMSE(providerId));
        stats.setAverageFunctionalAssessment(providerStatisticsRepository.getAverageFunctionalAssessment(providerId));
        stats.setAverageADL(providerStatisticsRepository.getAverageADL(providerId));

        // Risk factors
        stats.setPatientsWithGeneticRisk(providerStatisticsRepository.countPatientsWithGeneticRisk(providerId));
        stats.setPatientsWithComorbidities(providerStatisticsRepository.countPatientsWithComorbidities(providerId));
        stats.setPatientsWithAllergies(providerStatisticsRepository.countPatientsWithAllergies(providerId));

        // Get patient IDs for alert aggregation
        List<Long> patientIds = getPatientIdsByProviderId(providerId);

        try {
            // Fetch and aggregate alerts for all patients
            aggregateAlertStatistics(stats, patientIds);
        } catch (Exception e) {
            log.warn("Failed to fetch alert statistics for provider {}: {}", providerId, e.getMessage());
        }

        stats.setHistoryCoverage(100.0);  // All managed patients have histories

        // Calculate additional health metrics from medical history data
        calculateHealthRiskMetrics(stats, providerId);

        log.info("Successfully retrieved statistics for provider: {}", providerId);

        return stats;
    }

    /**
     * Calculate health risk metrics for patients managed by provider
     */
    private void calculateHealthRiskMetrics(ProviderStatisticsDTO stats, Long providerId) {
        List<com.neuroguard.medicalhistoryservice.entity.MedicalHistory> medicalHistories =
            medicalHistoryRepository.findByProviderId(providerId, Pageable.unpaged()).getContent();

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

    /**
     * Get patient IDs managed by a provider
     */
    private List<Long> getPatientIdsByProviderId(Long providerId) {
        return medicalHistoryRepository
            .findByProviderId(providerId, Pageable.unpaged())
            .stream()
            .map(mh -> mh.getPatientId())
            .collect(Collectors.toList());
    }

    /**
     * Aggregate alert statistics from alert service for multiple patients
     */
    private void aggregateAlertStatistics(ProviderStatisticsDTO stats, List<Long> patientIds) {
        if (patientIds.isEmpty()) {
            return;
        }

        // Fetch all alerts for these patients
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

            // Calculate alert coverage rate
            if (stats.getTotalPatients() > 0) {
                long patientsWithAlerts = allAlerts.stream()
                    .map(a -> a.getPatientId())
                    .distinct()
                    .count();
                stats.setAlertCoverageRate((patientsWithAlerts * 100.0) / stats.getTotalPatients());
            }
        }
    }
}
