package tn.neuroguard.medicalhistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MedicalRecordDTO {

    private Long id;
    private String patientName;
    private String patientId;
    private String recordFileName;
    private Set<DiseaseDTO> diseases;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}


