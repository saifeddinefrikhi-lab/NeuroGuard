package com.neuroguard.userservice.services;

import com.neuroguard.userservice.dto.CreateUserRequest;
import com.neuroguard.userservice.dto.UpdateUserRequest;
import com.neuroguard.userservice.dto.UserDto;
import com.neuroguard.userservice.dto.UserStatsDto;
import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.UserStatus;
import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.security.JwtUtils;
import com.neuroguard.userservice.repositories.PasswordResetTokenRepository;
import com.neuroguard.userservice.repositories.UserRepository;
import com.neuroguard.userservice.events.UserCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private KeycloakService keycloakService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    // Register a new user
    public String registerUser(User user) {
        String normalizedUsername = normalizeIdentifier(user.getUsername());
        String normalizedEmail = normalizeEmail(user.getEmail());
        String rawPassword = user.getPassword();

        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return "User already exists!";
        }
        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            return "Username already exists!";
        }
        if (rawPassword != null) {
            user.setPassword(passwordEncoder.encode(rawPassword));
        }
        User saved = userRepository.saveAndFlush(user);
        try {
            keycloakService.createOrUpdateUser(saved, rawPassword);
        } catch (RuntimeException e) {
            userRepository.delete(saved);
            throw e;
        }
        return "User registered successfully!";
    }

    // Register a new user from Google Login
    public User registerGoogleUser(User user) {
        String normalizedEmail = normalizeEmail(user.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new RuntimeException("Email already exists");
        }
        user.setEmail(normalizedEmail);
        user.setPassword(null);
        return userRepository.save(user);
    }

    public String loginUser(String username, String password) {
        String normalizedIdentifier = normalizeIdentifier(username);

        User user = userRepository.findByUsernameIgnoreCase(normalizedIdentifier)
                .or(() -> userRepository.findByEmailIgnoreCase(normalizedIdentifier))
                .orElse(null);

        if (user == null || user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new RuntimeException("BANNED");
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new RuntimeException("DISABLED");
        }

        return keycloakService.login(user.getUsername(), password);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalizedIdentifier = normalizeIdentifier(username);

        User user = userRepository.findByUsernameIgnoreCase(normalizedIdentifier)
                .or(() -> userRepository.findByEmailIgnoreCase(normalizedIdentifier))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .roles(String.valueOf(user.getRole()))
                .build();
    }

    public void updateLastSeen(String username) {
        userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
            user.setLastSeen(java.time.LocalDateTime.now());
            userRepository.save(user);
        });
    }

    public void clearLastSeen(String username) {
        userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
            user.setLastSeen(null);
            userRepository.save(user);
        });
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public UserDto createUser(CreateUserRequest request) {
        String normalizedUsername = normalizeIdentifier(request.getUsername());
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setUsername(normalizedUsername);
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setGender(request.getGender());
        user.setAge(request.getAge());
        user.setRole(Role.valueOf(request.getRole().toUpperCase()));
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        log.info("Creating new user via Admin: {}", request.getEmail());
        User saved = userRepository.saveAndFlush(user);
        
        eventPublisher.publishEvent(new UserCreatedEvent(this, saved.getEmail()));
        
        return convertToDto(saved);
    }

    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        
        if (request.getUsername() != null) {
            String normalizedUsername = normalizeIdentifier(request.getUsername());
            if (!user.getUsername().equalsIgnoreCase(normalizedUsername) && userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(normalizedUsername);
        }
        
        if (request.getEmail() != null) {
            String normalizedEmail = normalizeEmail(request.getEmail());
            if (!user.getEmail().equalsIgnoreCase(normalizedEmail) && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(normalizedEmail);
        }
        
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getAge() != null) user.setAge(request.getAge());
        if (request.getRole() != null) user.setRole(Role.valueOf(request.getRole().toUpperCase()));
        if (request.getPassword() != null) user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User updated = userRepository.save(user);
        return convertToDto(updated);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        passwordResetTokenRepository.deleteAllTokensByUser(user);
        userRepository.delete(user);
    }

    @Transactional
    public UserDto updateUserStatus(Long id, UserStatus newStatus, Integer durationHours) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        user.setStatus(newStatus);
        
        if (newStatus == UserStatus.BANNED && durationHours != null && durationHours > 0) {
            user.setBannedUntil(java.time.LocalDateTime.now().plusHours(durationHours));
            log.info("User {} banned for {} hours", user.getUsername(), durationHours);
        } else if (newStatus == UserStatus.ACTIVE || newStatus == UserStatus.DISABLED) {
            user.setBannedUntil(null);
        }

        user.setTokenVersion(user.getTokenVersion() + 1);
        User saved = userRepository.save(user);
        log.info("User {} status changed to {} by admin", user.getUsername(), newStatus);
        return convertToDto(saved);
    }

    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        
        dto.setRole(user.getRole() != null ? user.getRole().name() : "PATIENT");
        dto.setStatus(user.getStatus() != null ? user.getStatus().name() : "ACTIVE");
        dto.setBannedUntil(user.getBannedUntil());
        
        if (user.getLastSeen() != null) {
            java.time.LocalDateTime fifteenMinutesAgo = java.time.LocalDateTime.now().minusMinutes(15);
            dto.setConnected(user.getLastSeen().isAfter(fifteenMinutesAgo));
        } else {
            dto.setConnected(false);
        }
        
        return dto;
    }

    public UserStatsDto getStats() {
        long patients = userRepository.countByRole(Role.PATIENT);
        long providers = userRepository.countByRole(Role.PROVIDER);
        long caregivers = userRepository.countByRole(Role.CAREGIVER);
        long admins = userRepository.countByRole(Role.ADMIN);
        long total = userRepository.count();
        return new UserStatsDto(total, patients, providers, caregivers, admins);
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    public void updateUserPassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private String normalizeIdentifier(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeEmail(String value) {
        String normalized = normalizeIdentifier(value);
        return normalized == null ? null : normalized.toLowerCase();
    }
}
