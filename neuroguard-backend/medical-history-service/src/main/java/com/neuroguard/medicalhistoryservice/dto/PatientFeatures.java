package com.neuroguard.medicalhistoryservice.dto;

import lombok.Data;

@Data
public class PatientFeatures {
    private Long patientId;
    private int age;
    private String gender;
    private String progressionStage;   // MILD, MODERATE, SEVERE
    private int yearsSinceDiagnosis;
    private int comorbidityCount;
    private int allergyCount;
    private boolean hasGeneticRisk;
    private boolean hasFamilyHistory;
    private int surgeryCount;
    private int caregiverCount;
    private int providerCount;

    // ---------- NEW FIELDS FOR ALZHEIMER'S RISK ----------
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
    // ------------------------------------------------------
}