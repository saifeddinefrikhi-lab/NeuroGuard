package com.neuroguard.medicalhistoryservice;

import com.neuroguard.medicalhistoryservice.config.DotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableAsync
public class MedicalHistoryServiceApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MedicalHistoryServiceApplication.class);
        // Load environment variables from .env file before application starts
        app.addInitializers(new DotenvInitializer());
        app.run(args);
    }

}
