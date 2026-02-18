package tn.neuroguard.medicalhistoryservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;
    private String patientId;

    private String recordFileName;  // File that stores the medical record

    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Disease> diseases = new HashSet<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
