package com.neuroguard.medicalhistoryservice.service;

import com.neuroguard.medicalhistoryservice.entity.MedicalRecordFile;
import com.neuroguard.medicalhistoryservice.repository.MedicalRecordFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for migrating files from local storage to Azure Blob Storage.
 * This service handles batch migration of existing files from the local filesystem
 * to Azure Blob Storage, updating database records accordingly.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MigrationService {

    private final MedicalRecordFileRepository fileRepository;
    private final AzureBlobStorageService azureBlobStorageService;

    /**
     * Response DTO for migration status
     */
    public static class MigrationReport {
        public int totalFiles;
        public int migratedCount;
        public int failedCount;
        public List<String> errors;
        public long startTime;
        public long endTime;

        public MigrationReport() {
            this.errors = new ArrayList<>();
            this.startTime = System.currentTimeMillis();
        }

        public long getDurationMs() {
            return endTime - startTime;
        }
    }

    /**
     * Migrate all files from local storage to Azure Blob Storage
     * This is a long-running operation that should ideally run asynchronously
     *
     * @return MigrationReport with migration status
     */
    @Transactional
    public MigrationReport migrateAllFilesToAzure() {
        MigrationReport report = new MigrationReport();

        try {
            // Fetch all files from database
            List<MedicalRecordFile> allFiles = fileRepository.findAll();
            report.totalFiles = allFiles.size();

            if (allFiles.isEmpty()) {
                log.info("No files to migrate");
                report.endTime = System.currentTimeMillis();
                return report;
            }

            log.info("Starting migration of {} files to Azure Blob Storage", allFiles.size());

            // Migrate each file
            for (MedicalRecordFile file : allFiles) {
                try {
                    migrateFile(file);
                    report.migratedCount++;
                    log.debug("Migrated file: {} (ID: {})", file.getFileName(), file.getId());
                } catch (Exception e) {
                    report.failedCount++;
                    String errorMsg = String.format(
                            "Failed to migrate file ID %d (%s): %s",
                            file.getId(),
                            file.getFileName(),
                            e.getMessage()
                    );
                    report.errors.add(errorMsg);
                    log.error(errorMsg, e);
                }
            }

            report.endTime = System.currentTimeMillis();

            log.info("Migration completed - Total: {}, Migrated: {}, Failed: {}, Duration: {}ms",
                    report.totalFiles, report.migratedCount, report.failedCount, report.getDurationMs());

            return report;

        } catch (Exception e) {
            log.error("Migration process failed", e);
            report.endTime = System.currentTimeMillis();
            report.errors.add("Migration process failed: " + e.getMessage());
            throw new RuntimeException("Migration failed: " + e.getMessage(), e);
        }
    }

    /**
     * Migrate a single file from local storage to Azure
     *
     * @param file The MedicalRecordFile entity
     */
    private void migrateFile(MedicalRecordFile file) throws IOException {
        String oldFilePath = file.getFilePath();

        // Check if file still exists in local storage (might have been deleted)
        Path localPath = Paths.get(oldFilePath);
        if (!Files.exists(localPath)) {
            log.warn("Local file not found, skipping: {}", oldFilePath);
            return;
        }

        try {
            // Read file from local storage
            byte[] fileContent = Files.readAllBytes(localPath);
            long fileSize = fileContent.length;

            log.debug("Read local file: {} ({} bytes)", oldFilePath, fileSize);

            // Generate new blob name in Azure format: patientId/UUID_filename
            // Extract patient ID from old file path (format: uploads/medical-history/{patientId}/...)
            String patientId = extractPatientIdFromPath(oldFilePath);
            String fileName = file.getFileName();
            String blobName = patientId + "/" + UUID.randomUUID() + "_" + fileName;

            // Upload to Azure Blob Storage
            try (FileInputStream fis = new FileInputStream(localPath.toFile())) {
                azureBlobStorageService.uploadFile(blobName, fis, fileSize);
                log.debug("Uploaded to Azure: {}", blobName);
            }

            // Update database with new blob name
            file.setFilePath(blobName);
            fileRepository.save(file);
            log.debug("Updated database for file ID {}: {}", file.getId(), blobName);

            // Delete local file after successful migration
            try {
                Files.delete(localPath);
                log.debug("Deleted local file: {}", oldFilePath);
            } catch (IOException e) {
                // Log but don't fail migration if deletion fails
                log.warn("Failed to delete local file after migration: {}", oldFilePath, e);
            }

        } catch (Exception e) {
            log.error("Error migrating file {}: {}", oldFilePath, e.getMessage(), e);
            throw new RuntimeException("Failed to migrate file: " + e.getMessage(), e);
        }
    }

    /**
     * Extract patient ID from file path
     * Expects format: uploads/medical-history/{patientId}/...
     *
     * @param filePath The original file path
     * @return Patient ID or a placeholder if extraction fails
     */
    private String extractPatientIdFromPath(String filePath) {
        try {
            String[] parts = filePath.split("[/\\\\]");
            // Look for "medical-history" and get the next element as patient ID
            for (int i = 0; i < parts.length - 1; i++) {
                if ("medical-history".equals(parts[i]) && i + 1 < parts.length) {
                    return parts[i + 1];
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract patient ID from path: {}", filePath, e);
        }
        // Fallback to a placeholder if extraction fails
        return "unknown";
    }

    /**
     * Get migration status for a specific file
     * Returns a map with current status information
     *
     * @return Status map
     */
    public Map<String, Object> getMigrationStatus() {
        Map<String, Object> status = new HashMap<>();

        try {
            long totalFiles = fileRepository.count();

            // Count files that still use old local path format (starts with "uploads/")
            List<MedicalRecordFile> localStorageFiles = fileRepository.findAll().stream()
                    .filter(f -> f.getFilePath() != null && f.getFilePath().startsWith("uploads/"))
                    .toList();

            long migratedCount = totalFiles - localStorageFiles.size();

            status.put("totalFiles", totalFiles);
            status.put("migratedCount", migratedCount);
            status.put("remainingCount", localStorageFiles.size());
            status.put("migrationPercentage", totalFiles > 0 ? (migratedCount * 100 / totalFiles) : 0);

        } catch (Exception e) {
            log.error("Failed to get migration status", e);
            status.put("error", "Failed to retrieve migration status: " + e.getMessage());
        }

        return status;
    }
}
