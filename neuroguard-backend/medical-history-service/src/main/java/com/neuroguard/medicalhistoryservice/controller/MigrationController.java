package com.neuroguard.medicalhistoryservice.controller;

import com.neuroguard.medicalhistoryservice.service.MigrationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller for managing file migration from local storage to Azure Blob Storage.
 * These endpoints are admin-only and should only be accessible to system administrators.
 */
@RestController
@RequestMapping("/admin/migration")
@RequiredArgsConstructor
@Slf4j
public class MigrationController {

    private final MigrationService migrationService;

    /**
     * Start migration of all files to Azure Blob Storage
     * This is a long-running operation that should ideally run asynchronously
     *
     * Admin-only endpoint
     *
     * @param request HTTP request containing user context
     * @return MigrationReport with migration status
     */
    @PostMapping("/migrate-to-azure")
    public ResponseEntity<?> migrateToAzure(HttpServletRequest request) {
        // Verify admin access
        if (!isAdminUser(request)) {
            log.warn("Unauthorized migration request from user ID: {}", request.getAttribute("userId"));
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only administrators can initiate migration"));
        }

        try {
            log.info("Starting file migration to Azure Blob Storage. Initiated by: {}", request.getAttribute("userId"));

            // Note: In production, this should be run asynchronously (e.g., using @Async or a background job)
            // For now, we'll run it synchronously. Consider implementing a job queue for large migrations.
            MigrationService.MigrationReport report = migrationService.migrateAllFilesToAzure();

            log.info("Migration completed: Total={}, Migrated={}, Failed={}, Duration={}ms",
                    report.totalFiles, report.migratedCount, report.failedCount, report.getDurationMs());

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            log.error("Migration failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Migration failed",
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * Get current migration status
     * Shows how many files have been migrated vs. still need migration
     *
     * Admin-only endpoint
     *
     * @param request HTTP request containing user context
     * @return Status map with migration progress
     */
    @GetMapping("/status")
    public ResponseEntity<?> getMigrationStatus(HttpServletRequest request) {
        // Verify admin access
        if (!isAdminUser(request)) {
            log.warn("Unauthorized status request from user ID: {}", request.getAttribute("userId"));
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only administrators can view migration status"));
        }

        try {
            Map<String, Object> status = migrationService.getMigrationStatus();
            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("Failed to retrieve migration status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Failed to retrieve status",
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * Verify if the request is from an admin user
     * Checks the userRole attribute set by JWT filter
     *
     * @param request HTTP request containing user context
     * @return true if user is admin, false otherwise
     */
    private boolean isAdminUser(HttpServletRequest request) {
        try {
            String role = (String) request.getAttribute("userRole");
            return role != null && role.equalsIgnoreCase("ADMIN");
        } catch (Exception e) {
            log.error("Failed to verify admin role", e);
            return false;
        }
    }
}
