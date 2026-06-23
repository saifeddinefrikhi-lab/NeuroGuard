package com.neuroguard.medicalhistoryservice.controller;

import com.neuroguard.medicalhistoryservice.entity.MedicalRecordFile;
import com.neuroguard.medicalhistoryservice.repository.MedicalRecordFileRepository;
import com.neuroguard.medicalhistoryservice.service.AzureBlobStorageService;
import com.neuroguard.medicalhistoryservice.service.MedicalHistoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;

@RestController
@RequiredArgsConstructor
@Slf4j
public class FileDownloadController {

    private final MedicalRecordFileRepository fileRepository;
    private final MedicalHistoryService medicalHistoryService;

    @Autowired(required = false)
    private AzureBlobStorageService azureBlobStorageService;

    /**
     * Download file from Azure Blob Storage with streaming
     * @param fileId The file ID to download
     * @param request HTTP request containing user context
     * @return Streaming response with file content
     */
    @GetMapping("/files/{fileId}")
    public ResponseEntity<StreamingResponseBody> downloadFile(@PathVariable Long fileId, HttpServletRequest request) {
        // Get current user from request (set by JWT filter)
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");

        // Validate required attributes
        if (userId == null || role == null) {
            log.warn("Missing userId or role in request");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MedicalRecordFile file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        // Validate file path
        if (file.getFilePath() == null || file.getFilePath().isEmpty()) {
            log.error("File path is null or empty for file ID: {}", fileId);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        // Check access control
        if (!medicalHistoryService.canAccessFile(fileId, userId, role)) {
            log.warn("Access denied for user {} to file {}", userId, fileId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Check if Azure Storage is configured
        if (azureBlobStorageService == null) {
            log.error("Azure Blob Storage is not configured for file ID: {}", fileId);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(outputStream -> outputStream.write("Azure Blob Storage is not configured".getBytes()));
        }

        try {
            String blobName = file.getFilePath();
            log.debug("Downloading file from Azure Blob Storage: {}", blobName);

            // Pre-validate that blob exists and is accessible
            if (!azureBlobStorageService.blobExists(blobName)) {
                log.error("Blob not found in Azure: {}", blobName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Create streaming response body that will download blob content
            StreamingResponseBody responseBody = outputStream -> {
                InputStream inputStream = null;
                try {
                    inputStream = azureBlobStorageService.downloadFile(blobName);
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    outputStream.flush();
                    log.debug("File downloaded successfully: {}", blobName);
                } catch (Exception e) {
                    log.error("Error streaming blob content: {}", blobName, e);
                    throw new RuntimeException("Error downloading file: " + e.getMessage(), e);
                } finally {
                    if (inputStream != null) {
                        try {
                            inputStream.close();
                        } catch (Exception e) {
                            log.warn("Failed to close input stream", e);
                        }
                    }
                }
            };

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, file.getFileType() != null ? file.getFileType() : "application/octet-stream")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .body(responseBody);

        } catch (Exception e) {
            log.error("Failed to download file: {}", fileId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

