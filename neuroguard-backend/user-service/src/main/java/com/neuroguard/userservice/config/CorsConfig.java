package com.neuroguard.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Allow CORS for all endpoints (you can restrict it to specific paths if needed)
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200") // Allow Angular frontend to access the backend
                .allowedMethods("GET", "POST", "PUT", "DELETE") // Allow methods
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Allow credentials (like cookies or authorization headers)
    }
}