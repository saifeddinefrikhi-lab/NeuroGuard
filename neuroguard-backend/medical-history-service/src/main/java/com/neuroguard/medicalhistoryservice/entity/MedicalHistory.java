package com.neuroguard.medicalhistoryservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class MedicalHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Long patientId;

    // Diagnosis info
    private String diagnosis;
    private LocalDate diagnosisDate;
    @Enumerated(EnumType.STRING)
    private ProgressionStage progressionStage;

    // Other medical data
    @Column(length = 1000)
    private String geneticRisk;
    @Column(length = 1000)
    private String familyHistory;
    @Column(length = 1000)
    private String environmentalFactors;
    @Column(length = 1000)
    private String comorbidities;
    @Column(length = 1000)
    private String medicationAllergies;
    @Column(length = 1000)
    private String environmentalAllergies;
    @Column(length = 1000)
    private String foodAllergies;

    // Surgeries
    @ElementCollection
    @CollectionTable(name = "medical_history_surgeries", joinColumns = @JoinColumn(name = "medical_history_id"))
    private List<Surgery> surgeries = new ArrayList<>();

    // Assigned providers and caregivers
    @ElementCollection
    @CollectionTable(name = "medical_history_providers", joinColumns = @JoinColumn(name = "medical_history_id"))
    @Column(name = "provider_id")
    private List<Long> providerIds = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "medical_history_caregivers", joinColumns = @JoinColumn(name = "medical_history_id"))
    @Column(name = "caregiver_id")
    private List<Long> caregiverIds = new ArrayList<>();

    // Files
    @OneToMany(mappedBy = "medicalHistoryId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicalRecordFile> files = new ArrayList<>();

    // ---------- NEW FIELDS FOR ALZHEIMER'S RISK PREDICTION ----------
    // Cognitive scores (0-30 for MMSE, 0-10 for functional assessment and ADL)
    private Integer mmse;
    private Integer functionalAssessment;
    private Integer adl;

    // Symptom flags
    private Boolean memoryComplaints;
    private Boolean behavioralProblems;

    // Health risk factors
    private Boolean smoking;
    private Boolean cardiovascularDisease;
    private Boolean diabetes;
    private Boolean depression;
    private Boolean headInjury;
    private Boolean hypertension;

    // Extended clinical features (optional)
    private Integer alcoholConsumption;   // 0-10 scale
    private Integer physicalActivity;     // 0-10 scale
    private Integer dietQuality;          // 0-10 scale
    private Integer sleepQuality;         // 0-10 scale
    private Double bmi;
    private Integer cholesterolTotal;     // mg/dL
    // -----------------------------------------------------------------

    @CreationTimestamp
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}