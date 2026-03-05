package com.neuroguard.medicalhistoryservice.dto;


import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.entity.Surgery;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MedicalHistoryResponse {
    private Long id;
    private Long patientId;
    private String patientName;      // fetched from user-service
    private String diagnosis;
    private LocalDate diagnosisDate;
    private ProgressionStage progressionStage;
    private String geneticRisk;
    private String familyHistory;
    private String environmentalFactors;
    private String comorbidities;
    private String medicationAllergies;
    private String environmentalAllergies;
    private String foodAllergies;
    private List<Surgery> surgeries;
    private List<Long> providerIds;
    private List<String> providerNames; // optional, could be fetched later
    private List<Long> caregiverIds;
    private List<String> caregiverNames;
    private List<FileDto> files;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}