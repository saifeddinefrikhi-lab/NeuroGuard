package com.neuroguard.medicalhistoryservice.config;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Azure Blob Storage integration.
 * Initializes BlobServiceClient as a Spring Bean if Azure Storage is enabled.
 */
@Configuration
@Slf4j
public class AzureStorageConfig {

    @Value("${azure.storage.connection-string:}")
    private String connectionString;

    @Value("${azure.storage.container-name:medical-records}")
    private String containerName;

    @Value("${azure.storage.enabled:false}")
    private boolean azureStorageEnabled;

    /**
     * Initialize BlobServiceClient bean for Azure Blob Storage operations
     * Only created if azure.storage.enabled=true and connection-string is provided
     *
     * @return BlobServiceClient configured with connection string
     */
    @Bean
    @ConditionalOnProperty(name = "azure.storage.enabled", havingValue = "true")
    public BlobServiceClient blobServiceClient() {
        if (connectionString == null || connectionString.trim().isEmpty()) {
            log.error("Azure Storage is enabled but connection string is not configured. " +
                    "Set 'AZURE_STORAGE_CONNECTION_STRING' environment variable.");
            throw new IllegalStateException(
                    "Azure Storage connection string not configured. " +
                    "Set 'AZURE_STORAGE_CONNECTION_STRING' environment variable."
            );
        }

        log.info("Initializing Azure Blob Storage client with container: {}", containerName);

        try {
            BlobServiceClient blobServiceClient = new BlobServiceClientBuilder()
                    .connectionString(connectionString)
                    .buildClient();

            // Create container if it doesn't exist
            createContainerIfNotExists(blobServiceClient);

            log.info("Azure Blob Storage client initialized successfully");
            return blobServiceClient;
        } catch (Exception e) {
            log.error("Failed to initialize Azure Blob Storage client", e);
            throw new RuntimeException("Failed to initialize Azure Blob Storage client: " + e.getMessage(), e);
        }
    }

    /**
     * Create blob container if it doesn't exist
     *
     * @param blobServiceClient The BlobServiceClient instance
     */
    private void createContainerIfNotExists(BlobServiceClient blobServiceClient) {
        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);

            if (!containerClient.exists()) {
                log.info("Creating blob container: {}", containerName);
                blobServiceClient.createBlobContainer(containerName);
                log.info("Blob container created successfully: {}", containerName);
            } else {
                log.debug("Blob container already exists: {}", containerName);
            }
        } catch (Exception e) {
            log.error("Failed to create or verify blob container: {}", containerName, e);
            throw new RuntimeException("Failed to create blob container: " + e.getMessage(), e);
        }
    }
}
