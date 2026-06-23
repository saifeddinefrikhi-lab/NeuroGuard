package com.neuroguard.userservice.config;

import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedDefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedUser(
                    userRepository,
                    passwordEncoder,
                    "Admin",
                    "NeuroGuard",
                    "admin",
                    "admin@neuroguard.com",
                    Role.ADMIN,
                    "admin123"
            );
            seedUser(
                    userRepository,
                    passwordEncoder,
                    "Provider",
                    "NeuroGuard",
                    "provider",
                    "provider@neuroguard.com",
                    Role.PROVIDER,
                    "provider123"
            );
            seedUser(
                    userRepository,
                    passwordEncoder,
                    "Caregiver",
                    "NeuroGuard",
                    "caregiver",
                    "caregiver@neuroguard.com",
                    Role.CAREGIVER,
                    "caregiver123"
            );
            seedUser(
                    userRepository,
                    passwordEncoder,
                    "Patient",
                    "NeuroGuard",
                    "patient",
                    "patient@neuroguard.com",
                    Role.PATIENT,
                    "patient123"
            );
        };
    }

    private void seedUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String firstName,
            String lastName,
            String username,
            String email,
            Role role,
            String rawPassword
    ) {
        if (userRepository.existsByUsername(username) || userRepository.existsByEmail(email)) {
            return;
        }

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setUsername(username);
        user.setEmail(email);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
    }
}
