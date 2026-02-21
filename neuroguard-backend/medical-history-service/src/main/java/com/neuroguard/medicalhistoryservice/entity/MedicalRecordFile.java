package com.neuroguard.medicalhistoryservice.entity;


import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class MedicalRecordFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long medicalHistoryId;

    private String fileName;
    private String fileType;
    private String filePath;  // stored on disk or cloud
    private LocalDateTime uploadedAt;
}