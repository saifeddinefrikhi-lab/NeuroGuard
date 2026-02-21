package com.neuroguard.medicalhistoryservice.controller;


import com.neuroguard.medicalhistoryservice.client.UserServiceClient;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryRequest;
import com.neuroguard.medicalhistoryservice.dto.MedicalHistoryResponse;
import com.neuroguard.medicalhistoryservice.dto.UserDto;
import com.neuroguard.medicalhistoryservice.service.MedicalHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/provider/medical-history")
@RequiredArgsConstructor
public class ProviderController {

    private final MedicalHistoryService historyService;
    private final UserServiceClient userServiceClient;

    @PostMapping
    public ResponseEntity<MedicalHistoryResponse> createHistory(@RequestBody MedicalHistoryRequest request,
                                                                HttpServletRequest httpRequest) {
        Long providerId = (Long) httpRequest.getAttribute("userId");
        MedicalHistoryResponse response = historyService.createMedicalHistory(request, providerId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{patientId}")
    public ResponseEntity<MedicalHistoryResponse> updateHistory(@PathVariable Long patientId,
                                                                @RequestBody MedicalHistoryRequest request,
                                                                HttpServletRequest httpRequest) {
        Long providerId = (Long) httpRequest.getAttribute("userId");
        MedicalHistoryResponse response = historyService.updateMedicalHistory(patientId, request, providerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<MedicalHistoryResponse>> getAllHistories(HttpServletRequest httpRequest) {
        Long providerId = (Long) httpRequest.getAttribute("userId");
        List<MedicalHistoryResponse> histories = historyService.getAllMedicalHistoriesForProvider(providerId);
        return ResponseEntity.ok(histories);
    }

    @DeleteMapping("/{patientId}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long patientId,
                                              HttpServletRequest httpRequest) {
        Long providerId = (Long) httpRequest.getAttribute("userId");
        historyService.deleteMedicalHistory(patientId, providerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<MedicalHistoryResponse> getHistory(@PathVariable Long patientId,
                                                             HttpServletRequest httpRequest) {
        Long requesterId = (Long) httpRequest.getAttribute("userId");
        String role = (String) httpRequest.getAttribute("userRole");
        MedicalHistoryResponse response = historyService.getMedicalHistoryByPatientId(patientId, requesterId, role);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/patients")
    public ResponseEntity<List<UserDto>> getPatients() {
        List<UserDto> patients = userServiceClient.getUsersByRole("PATIENT");
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/caregivers")
    public ResponseEntity<List<UserDto>> getCaregivers() {
        List<UserDto> caregivers = userServiceClient.getUsersByRole("CAREGIVER");
        return ResponseEntity.ok(caregivers);
    }
}