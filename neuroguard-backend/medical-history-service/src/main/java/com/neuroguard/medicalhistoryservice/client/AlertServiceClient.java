package com.neuroguard.medicalhistoryservice.client;

import com.neuroguard.medicalhistoryservice.dto.AlertResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Alert Service Feign Client
 * Communicates with Risk Alert Service for alert data retrieval
 */
@FeignClient(name = "risk-alert-service", url = "${alert-service.url:}", path = "/alerts")
public interface AlertServiceClient {

    /**
     * Get all alerts for a specific patient
     */
    @GetMapping("/patient/{patientId}")
    List<AlertResponse> getPatientAlerts(@PathVariable("patientId") Long patientId);

    /**
     * Get alerts for multiple patients
     */
    @PostMapping("/batch")
    List<AlertResponse> getPatientAlertsForIds(@RequestBody List<Long> patientIds);

    /**
     * Get unresolved alerts for a patient
     */
    @GetMapping("/patient/{patientId}/unresolved")
    List<AlertResponse> getUnresolvedAlerts(@PathVariable("patientId") Long patientId);

    /**
     * Get critical alerts for a patient
     */
    @GetMapping("/patient/{patientId}/critical")
    List<AlertResponse> getCriticalAlerts(@PathVariable("patientId") Long patientId);
}
