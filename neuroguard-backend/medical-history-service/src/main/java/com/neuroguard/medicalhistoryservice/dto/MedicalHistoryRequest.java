package com.neuroguard.medicalhistoryservice.dto;

import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.entity.Surgery;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class MedicalHistoryRequest {
    private Long patientId;          // required
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
    private List<Long> providerIds;          // optional additional providers (by ID)
    private List<String> caregiverNames;     // caregivers to assign by username (optional)
    private List<Long> caregiverIds;         // caregivers to assign by ID (optional, preferred)
}