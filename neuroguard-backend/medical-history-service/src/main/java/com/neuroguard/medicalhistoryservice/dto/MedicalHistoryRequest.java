package com.neuroguard.medicalhistoryservice.dto;

import com.neuroguard.medicalhistoryservice.entity.ProgressionStage;
import com.neuroguard.medicalhistoryservice.entity.Surgery;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class MedicalHistoryRequest {
    private Long patientId;
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
    private List<String> caregiverNames;
    private List<Long> caregiverIds;

    // ---------- NEW FIELDS ----------
    private Integer mmse;
    private Integer functionalAssessment;
    private Integer adl;
    private Boolean memoryComplaints;
    private Boolean behavioralProblems;
    private Boolean smoking;
    private Boolean cardiovascularDisease;
    private Boolean diabetes;
    private Boolean depression;
    private Boolean headInjury;
    private Boolean hypertension;
    private Integer alcoholConsumption;
    private Integer physicalActivity;
    private Integer dietQuality;
    private Integer sleepQuality;
    private Double bmi;
    private Integer cholesterolTotal;
}