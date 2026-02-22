package com.neuroguard.medicalhistoryservice.controller;


import com.neuroguard.medicalhistoryservice.client.UserServiceClient;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryResponse;
import com.neuroguard.medicalhistoryservice.dto.UserDto;
import com.neuroguard.medicalhistoryservice.service.MedicalHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/caregiver/medical-history")
@RequiredArgsConstructor
public class CaregiverController {

    private static final Logger log = LoggerFactory.getLogger(CaregiverController.class);

    private final MedicalHistoryService historyService;
    private final UserServiceClient userServiceClient;

    @GetMapping("/{patientId}")
    public ResponseEntity<MedicalHistoryResponse> getHistory(@PathVariable Long patientId,
                                                             HttpServletRequest httpRequest) {
        Long caregiverId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        MedicalHistoryResponse response = historyService.getMedicalHistoryByPatientId(patientId, caregiverId, role);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/patients")
    public ResponseEntity<List<UserDto>> getAssignedPatients(HttpServletRequest httpRequest) {
        Long caregiverId = (Long) httpRequest.getAttribute("userId");
        List<MedicalHistoryResponse> histories = historyService.getAllMedicalHistoriesForCaregiver(caregiverId);

        List<UserDto> patients = new ArrayList<>();
        for (MedicalHistoryResponse history : histories) {
            try {
                // Fetch complete user data from user service
                UserDto patient = userServiceClient.getUserById(history.getPatientId());
                patients.add(patient);
            } catch (Exception e) {
                log.error("Failed to fetch patient data for id: {}", history.getPatientId(), e);
                // Create a fallback UserDto with available information
                UserDto fallbackDto = new UserDto();
                fallbackDto.setId(history.getPatientId());
                fallbackDto.setFirstName(history.getPatientName().split(" ")[0]);
                if (history.getPatientName().contains(" ")) {
                    fallbackDto.setLastName(history.getPatientName().substring(history.getPatientName().indexOf(" ") + 1));
                }
                fallbackDto.setRole("PATIENT");
                fallbackDto.setUsername("N/A");
                fallbackDto.setEmail("N/A");
                patients.add(fallbackDto);
            }
        }

        return ResponseEntity.ok(patients);
    }
}