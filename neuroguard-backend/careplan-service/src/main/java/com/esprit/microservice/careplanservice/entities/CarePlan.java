package com.esprit.microservice.careplanservice.entities;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "care_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CarePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;         // ID du patient (utilisateur)

    @Column(nullable = false)
    private Long providerId;        // ID du provider qui a créé le plan

    @Column(columnDefinition = "TEXT")
    private String nutritionPlan;   // Plan nutritionnel

    @Column(columnDefinition = "TEXT")
    private String sleepPlan;       // Plan de sommeil

    @Column(columnDefinition = "TEXT")
    private String activityPlan;    // Plan d'activités

    @Column(columnDefinition = "TEXT")
    private String medicationPlan;  // Plan de médication (optionnel)

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CarePlanStatus nutritionStatus = CarePlanStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CarePlanStatus sleepStatus = CarePlanStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CarePlanStatus activityStatus = CarePlanStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CarePlanStatus medicationStatus = CarePlanStatus.TODO;

    /** Deadline for nutrition activity (patient sees countdown). */
    private LocalDateTime nutritionDeadline;
    /** Deadline for sleep activity. */
    private LocalDateTime sleepDeadline;
    /** Deadline for activity plan. */
    private LocalDateTime activityDeadline;
    /** Deadline for medication plan. */
    private LocalDateTime medicationDeadline;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}