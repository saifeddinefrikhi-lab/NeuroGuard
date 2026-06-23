package com.neuroguard.medicalhistoryservice.service;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing files in Azure Blob Storage.
 * Handles upload, download, delete, and CDN URL generation operations.
 */
@Service
@Slf4j
public class AzureBlobStorageService {

    private BlobServiceClient blobServiceClient;

    @Value("${azure.storage.container-name:medical-records}")
    private String containerName;

    @Value("${azure.storage.cdn-endpoint-url:}")
    private String cdnEndpointUrl;

    @Value("${azure.storage.enabled:true}")
    private boolean azureStorageEnabled;

    @Autowired(required = false)
    public void setBlobServiceClient(BlobServiceClient blobServiceClient) {
        this.blobServiceClient = blobServiceClient;
    }

    /**
     * Upload a file to Azure Blob Storage
     *
     * @param blobName The blob name/path (e.g., "patientId/UUID_filename.pdf")
     * @param data     The file input stream
     * @param length   The file size in bytes
     * @return The blob URI
     */
    public String uploadFile(String blobName, InputStream data, long length) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            log.info("Uploading file to Azure Blob Storage: {}/{}", containerName, blobName);
            blobClient.upload(data, length, true);
            log.info("File uploaded successfully: {}", blobName);

            return blobClient.getBlobUrl();
        } catch (Exception e) {
            log.error("Failed to upload file to Azure Blob Storage: {}", blobName, e);
            throw new RuntimeException("Failed to upload file to Azure Blob Storage: " + e.getMessage(), e);
        }
    }

    /**
     * Download a file from Azure Blob Storage
     *
     * @param blobName The blob name/path
     * @return InputStream with the file stream for reading
     */
    public InputStream downloadFile(String blobName) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (!blobClient.exists()) {
                log.warn("Blob not found: {}", blobName);
                throw new RuntimeException("File not found in Azure Blob Storage: " + blobName);
            }

            log.debug("Downloading file from Azure Blob Storage: {}", blobName);
            return blobClient.openInputStream();
        } catch (Exception e) {
            log.error("Failed to download file from Azure Blob Storage: {}", blobName, e);
            throw new RuntimeException("Failed to download file from Azure Blob Storage: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file from Azure Blob Storage
     *
     * @param blobName The blob name/path
     */
    public void deleteFile(String blobName) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (blobClient.exists()) {
                log.info("Deleting file from Azure Blob Storage: {}", blobName);
                blobClient.delete();
                log.info("File deleted successfully: {}", blobName);
            } else {
                log.warn("File not found for deletion: {}", blobName);
            }
        } catch (Exception e) {
            log.error("Failed to delete file from Azure Blob Storage: {}", blobName, e);
            // Don't throw exception for delete failures - log and continue
        }
    }

    /**
     * List all blobs in a container with optional prefix
     *
     * @param prefix Optional prefix to filter blobs (e.g., "123/" for patient 123)
     * @return List of blob names
     */
    public List<String> listFiles(String prefix) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        List<String> blobNames = new ArrayList<>();
        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);

            log.debug("Listing files with prefix: {}", prefix != null ? prefix : "none");

            if (prefix != null && !prefix.isEmpty()) {
                containerClient.listBlobsByHierarchy(prefix).forEach(item -> {
                    if (!item.isPrefix()) {
                        blobNames.add(item.getName());
                    }
                });
            } else {
                containerClient.listBlobs().forEach(item -> blobNames.add(item.getName()));
            }

            log.debug("Found {} files", blobNames.size());
        } catch (Exception e) {
            log.error("Failed to list files from Azure Blob Storage", e);
            throw new RuntimeException("Failed to list files from Azure Blob Storage: " + e.getMessage(), e);
        }

        return blobNames;
    }

    /**
     * Generate a CDN URL for a blob if CDN is configured
     *
     * @param blobName The blob name/path
     * @return CDN URL or direct blob URL
     */
    public String generateFileUrl(String blobName) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        // If CDN endpoint is configured, use it; otherwise use direct blob URL
        if (cdnEndpointUrl != null && !cdnEndpointUrl.isEmpty()) {
            // Ensure CDN URL ends with / if not
            String endpoint = cdnEndpointUrl.endsWith("/") ? cdnEndpointUrl : cdnEndpointUrl + "/";
            log.debug("Generating CDN URL for blob: {}", blobName);
            return endpoint + blobName;
        } else {
            // Fall back to direct blob storage URL
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            log.debug("Generating direct blob URL for: {}", blobName);
            return blobClient.getBlobUrl();
        }
    }

    /**
     * Check if a blob exists
     *
     * @param blobName The blob name/path
     * @return true if blob exists, false otherwise
     */
    public boolean blobExists(String blobName) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            return blobClient.exists();
        } catch (Exception e) {
            log.error("Failed to check blob existence: {}", blobName, e);
            return false;
        }
    }

    /**
     * Get blob properties (size, modified date, etc.)
     *
     * @param blobName The blob name/path
     * @return Blob size in bytes
     */
    public long getBlobSize(String blobName) {
        if (!azureStorageEnabled) {
            throw new IllegalStateException("Azure Storage is not enabled");
        }

        try {
            BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
            BlobClient blobClient = containerClient.getBlobClient(blobName);

            if (blobClient.exists()) {
                long size = blobClient.getProperties().getBlobSize();
                log.debug("Blob size for {}: {} bytes", blobName, size);
                return size;
            }
        } catch (Exception e) {
            log.error("Failed to get blob size: {}", blobName, e);
        }

        return 0;
    }
}
