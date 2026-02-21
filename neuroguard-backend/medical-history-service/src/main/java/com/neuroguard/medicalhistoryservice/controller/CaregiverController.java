package com.neuroguard.medicalhistoryservice.controller;


import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryResponse;
import com.neuroguard.medicalhistoryservice.dto.UserDto;
import com.neuroguard.medicalhistoryservice.service.MedicalHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/caregiver/medical-history")
@RequiredArgsConstructor
public class CaregiverController {

    private final MedicalHistoryService historyService;

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

        List<UserDto> patients = histories.stream()
                .map(h -> {
                    UserDto dto = new UserDto();
                    dto.setId(h.getPatientId());
                    dto.setFirstName(h.getPatientName().split(" ")[0]);
                    if (h.getPatientName().contains(" ")) {
                        dto.setLastName(h.getPatientName().substring(h.getPatientName().indexOf(" ") + 1));
                    }
                    dto.setRole("PATIENT");
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(patients);
    }
}