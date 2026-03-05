package com.neuroguard.userservice.entities;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "caregiver_patient")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CaregiverPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "caregiver_id", nullable = false)
    private Long caregiverId;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    // Vous pouvez ajouter d'autres champs comme la date d'affectation
}