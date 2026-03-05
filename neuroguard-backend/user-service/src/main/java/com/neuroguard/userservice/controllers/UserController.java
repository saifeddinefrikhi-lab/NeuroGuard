package com.neuroguard.userservice.controllers;

import com.neuroguard.userservice.dto.UserDto;
import com.neuroguard.userservice.entities.Role;
import com.neuroguard.userservice.entities.User;
import com.neuroguard.userservice.repositories.UserRepository;
import com.neuroguard.userservice.services.CaregiverAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

// In user-service, e.g., UserController.java
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaregiverAssignmentService caregiverAssignmentService;


    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    UserDto dto = new UserDto();
                    dto.setId(user.getId());
                    dto.setUsername(user.getUsername());
                    dto.setEmail(user.getEmail());
                    dto.setFirstName(user.getFirstName());
                    dto.setLastName(user.getLastName());
                    dto.setRole(user.getRole().name());
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDto>> getUsersByRole(@PathVariable String role) {
        try {
            Role roleEnum = Role.valueOf(role.toUpperCase());
            List<User> users = userRepository.findByRole(roleEnum);
            List<UserDto> dtos = users.stream().map(this::convertToDto).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Helper method to convert User to UserDto (reuse existing mapping logic)
    private UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole().name());
        return dto;
    }
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(user -> {
                    UserDto dto = new UserDto();
                    dto.setId(user.getId());
                    dto.setUsername(user.getUsername());
                    dto.setEmail(user.getEmail());
                    dto.setFirstName(user.getFirstName());
                    dto.setLastName(user.getLastName());
                    dto.setRole(user.getRole().name());
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/caregiver/{caregiverId}/patients/{patientId}/assigned")
    public ResponseEntity<Boolean> isCaregiverAssigned(
            @PathVariable Long caregiverId,
            @PathVariable Long patientId) {
        boolean assigned = caregiverAssignmentService.isCaregiverAssignedToPatient(caregiverId, patientId);
        return ResponseEntity.ok(assigned);
    }

    // Nouvel endpoint : lister les IDs des patients d'un caregiver
    @GetMapping("/caregiver/{caregiverId}/patients")
    public ResponseEntity<List<Long>> getPatientIdsByCaregiver(@PathVariable Long caregiverId) {
        List<Long> patientIds = caregiverAssignmentService.getPatientIdsByCaregiver(caregiverId);
        return ResponseEntity.ok(patientIds);
    }

    // Optionnel : endpoint pour assigner (POST) et désassigner (DELETE)
    @PostMapping("/caregiver/{caregiverId}/patients/{patientId}")
    public ResponseEntity<Void> assignCaregiver(
            @PathVariable Long caregiverId,
            @PathVariable Long patientId) {
        caregiverAssignmentService.assignCaregiverToPatient(caregiverId, patientId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/caregiver/{caregiverId}/patients/{patientId}")
    public ResponseEntity<Void> unassignCaregiver(
            @PathVariable Long caregiverId,
            @PathVariable Long patientId) {
        caregiverAssignmentService.unassignCaregiverFromPatient(caregiverId, patientId);
        return ResponseEntity.noContent().build();
    }

}