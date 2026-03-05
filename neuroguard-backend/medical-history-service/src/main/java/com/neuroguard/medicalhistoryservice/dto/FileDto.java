package com.neuroguard.medicalhistoryservice.dto;


import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FileDto {
    private Long id;
    private String fileName;
    private String fileType;
    private String fileUrl;   // URL to download/view file
    private LocalDateTime uploadedAt;
}
