package com.neuroguard.userservice.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String phoneNumber;
    private String gender;
    private Integer age;

    private Double longitude;
    private Double latitude;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String password;

    @Column
    private LocalDateTime lastSeen;

    @Column
    private LocalDateTime bannedUntil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "caregiver_id")
    private Long caregiverId;

    @Column(name = "doctor_id")
    private Long doctorId;

    /**
     * Incremented whenever a user is banned/disabled,
     * effectively invalidating all older JWT tokens.
     */
    @Column(nullable = false)
    private long tokenVersion = 0;
}