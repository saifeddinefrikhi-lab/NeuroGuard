package com.neuroguard.medicalhistoryservice.controller;

import com.neuroguard.medicalhistoryservice.dto.PatientStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.ProviderStatisticsDTO;
import com.neuroguard.medicalhistoryservice.dto.CaregiverStatisticsDTO;
import com.neuroguard.medicalhistoryservice.service.PatientStatisticsService;
import com.neuroguard.medicalhistoryservice.service.ProviderStatisticsService;
import com.neuroguard.medicalhistoryservice.service.CaregiverStatisticsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Statistics Controller - Provides aggregated statistics endpoints
 * Fetches data for patient, provider, and caregiver dashboards
 */
@RestController
@RequestMapping("/api/statistics")
@Slf4j
public class StatisticsController {

    @Autowired
    private PatientStatisticsService patientStatisticsService;

    @Autowired
    private ProviderStatisticsService providerStatisticsService;

    @Autowired
    private CaregiverStatisticsService caregiverStatisticsService;

    /**
     * Get patient statistics for a specific patient
     * Endpoint: GET /api/statistics/patient/{patientId}
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<PatientStatisticsDTO> getPatientStatistics(@PathVariable Long patientId) {
        log.info("Fetching statistics for patient: {}", patientId);
        PatientStatisticsDTO stats = patientStatisticsService.getPatientStatistics(patientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get statistics for the current authenticated patient
     * Endpoint: GET /api/statistics/patient/me
     */
    @GetMapping("/patient/me")
    public ResponseEntity<PatientStatisticsDTO> getMyPatientStatistics(HttpServletRequest request) {
        Long patientId = (Long) request.getAttribute("userId");
        log.info("Fetching statistics for current patient: {}", patientId);
        if (patientId == null) {
            return ResponseEntity.status(401).build();
        }
        PatientStatisticsDTO stats = patientStatisticsService.getPatientStatistics(patientId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get statistics for the current authenticated provider
     * Endpoint: GET /api/statistics/provider/me
     */
    @GetMapping("/provider/me")
    public ResponseEntity<ProviderStatisticsDTO> getMyProviderStatistics(HttpServletRequest request) {
        Long providerId = (Long) request.getAttribute("userId");
        log.info("Fetching statistics for current provider: {}", providerId);
        if (providerId == null) {
            return ResponseEntity.status(401).build();
        }
        ProviderStatisticsDTO stats = providerStatisticsService.getProviderStatistics(providerId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get statistics for the current authenticated caregiver
     * Endpoint: GET /api/statistics/caregiver/me
     */
    @GetMapping("/caregiver/me")
    public ResponseEntity<CaregiverStatisticsDTO> getMyCaregiverStatistics(HttpServletRequest request) {
        Long caregiverId = (Long) request.getAttribute("userId");
        log.info("Fetching statistics for current caregiver: {}", caregiverId);
        if (caregiverId == null) {
            return ResponseEntity.status(401).build();
        }
        CaregiverStatisticsDTO stats = caregiverStatisticsService.getCaregiverStatistics(caregiverId);
        return ResponseEntity.ok(stats);
    }
}
