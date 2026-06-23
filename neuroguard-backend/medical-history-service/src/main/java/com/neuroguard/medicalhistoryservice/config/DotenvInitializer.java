package com.neuroguard.medicalhistoryservice.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Loads environment variables from .env file at application startup.
 * This runs before Spring beans are created, so env vars are available to @Value annotations.
 */
public class DotenvInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            // Load .env file from project root or current directory
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()  // Don't fail if .env doesn't exist
                    .load();

            // Put all .env variables into System properties so Spring can access them
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                // Set as system property if not already set (env vars take precedence)
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            });

            System.out.println("✓ Loaded environment variables from .env file");
        } catch (Exception e) {
            System.err.println("⚠ Warning: Could not load .env file: " + e.getMessage());
            // Don't throw exception - it's optional to have .env file
        }
    }
}
