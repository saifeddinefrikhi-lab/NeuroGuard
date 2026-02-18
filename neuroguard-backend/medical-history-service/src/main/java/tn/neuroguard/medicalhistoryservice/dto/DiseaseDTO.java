package tn.neuroguard.medicalhistoryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class DiseaseDTO {

    private Long id;
    private String name;
    private String description;
    private Long medicalRecordId;
    private LocalDateTime diagnosedAt;

}

