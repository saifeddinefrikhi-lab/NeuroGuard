package com.esprit.microservice.careplanservice.services;

import com.esprit.microservice.careplanservice.dto.CarePlanMessageRequest;
import com.esprit.microservice.careplanservice.dto.CarePlanMessageResponse;
import com.esprit.microservice.careplanservice.dto.CarePlanRequest;
import com.esprit.microservice.careplanservice.dto.CarePlanResponse;
import com.esprit.microservice.careplanservice.dto.CarePlanStatsResponse;
import com.esprit.microservice.careplanservice.dto.UserDto;
import com.esprit.microservice.careplanservice.entities.CarePlan;
import com.esprit.microservice.careplanservice.entities.CarePlanMessage;
import com.esprit.microservice.careplanservice.entities.CarePlanStatus;
import com.esprit.microservice.careplanservice.entities.Priority;
import com.esprit.microservice.careplanservice.exceptions.UnauthorizedException;
import com.esprit.microservice.careplanservice.exceptions.ResourceNotFoundException;
import com.esprit.microservice.careplanservice.feign.UserServiceClient;
import com.esprit.microservice.careplanservice.repositories.CarePlanMessageRepository;
import com.esprit.microservice.careplanservice.repositories.CarePlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarePlanService {

    private final CarePlanRepository carePlanRepository;
    private final CarePlanMessageRepository carePlanMessageRepository;
    private final UserServiceClient userServiceClient;
    private final CarePlanMailService carePlanMailService;

    // Récupère l'ID de l'utilisateur connecté depuis le contexte
    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getDetails();
    }


    // Récupère le rôle de l'utilisateur connecté
    private String getCurrentUserRole() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .findFirst()
                .map(auth -> auth.getAuthority().replace("ROLE_", ""))
                .orElseThrow();
    }

    private Priority parsePriority(String value) {
        if (value == null || value.isBlank()) return Priority.MEDIUM;
        try {
            return Priority.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Priority.MEDIUM;
        }
    }

    // Vérifie que le patient existe et a le rôle PATIENT
    private void validatePatient(Long patientId) {
        UserDto patient = userServiceClient.getUserById(patientId);
        if (patient == null || !"PATIENT".equals(patient.getRole())) {
            throw new ResourceNotFoundException("Patient not found or not a patient");
        }
    }

    // Convertit une entité en DTO de réponse (peut inclure les noms via Feign)
    private CarePlanResponse mapToResponse(CarePlan carePlan) {
        String patientName = null;
        String providerName = null;
        try {
            UserDto patient = userServiceClient.getUserById(carePlan.getPatientId());
            patientName = patient.getFirstName() + " " + patient.getLastName();
            UserDto provider = userServiceClient.getUserById(carePlan.getProviderId());
            providerName = provider.getFirstName() + " " + provider.getLastName();
        } catch (Exception e) {
            // En cas d'échec, on laisse null
        }
        return CarePlanResponse.builder()
                .id(carePlan.getId())
                .patientId(carePlan.getPatientId())
                .patientName(patientName)
                .providerId(carePlan.getProviderId())
                .providerName(providerName)
                .nutritionPlan(carePlan.getNutritionPlan())
                .sleepPlan(carePlan.getSleepPlan())
                .activityPlan(carePlan.getActivityPlan())
                .priority(carePlan.getPriority() != null ? carePlan.getPriority().name() : "MEDIUM")
                .nutritionStatus(carePlan.getNutritionStatus() != null ? carePlan.getNutritionStatus().name() : "TODO")
                .sleepStatus(carePlan.getSleepStatus() != null ? carePlan.getSleepStatus().name() : "TODO")
                .activityStatus(carePlan.getActivityStatus() != null ? carePlan.getActivityStatus().name() : "TODO")
                .medicationStatus(carePlan.getMedicationStatus() != null ? carePlan.getMedicationStatus().name() : "TODO")
                .medicationPlan(carePlan.getMedicationPlan())
                .nutritionDeadline(carePlan.getNutritionDeadline())
                .sleepDeadline(carePlan.getSleepDeadline())
                .activityDeadline(carePlan.getActivityDeadline())
                .medicationDeadline(carePlan.getMedicationDeadline())
                .createdAt(carePlan.getCreatedAt())
                .updatedAt(carePlan.getUpdatedAt())
                .build();
    }

    // Création d'un care plan (PROVIDER ou ADMIN)
    @PreAuthorize("hasRole('PROVIDER') or hasRole('ADMIN')")
    @Transactional
    public CarePlanResponse createCarePlan(CarePlanRequest request) {
        Long providerId = getCurrentUserId();
        if (getCurrentUserRole().equals("ADMIN") && request.getProviderId() != null) {
            providerId = request.getProviderId();
        }
        validatePatient(request.getPatientId());

        CarePlan carePlan = new CarePlan();
        carePlan.setPatientId(request.getPatientId());
        carePlan.setProviderId(providerId);
        carePlan.setPriority(parsePriority(request.getPriority()));
        carePlan.setNutritionPlan(request.getNutritionPlan());
        carePlan.setSleepPlan(request.getSleepPlan());
        carePlan.setActivityPlan(request.getActivityPlan());
        carePlan.setMedicationPlan(request.getMedicationPlan());
        carePlan.setNutritionDeadline(request.getNutritionDeadline());
        carePlan.setSleepDeadline(request.getSleepDeadline());
        carePlan.setActivityDeadline(request.getActivityDeadline());
        carePlan.setMedicationDeadline(request.getMedicationDeadline());

        CarePlan saved = carePlanRepository.save(carePlan);
        sendCarePlanCreatedEmailToPatient(saved);
        return mapToResponse(saved);
    }

    /** Sends notification email to patient when a care plan is created (async, non-blocking). */
    private void sendCarePlanCreatedEmailToPatient(CarePlan carePlan) {
        try {
            UserDto patient = userServiceClient.getUserById(carePlan.getPatientId());
            UserDto provider = userServiceClient.getUserById(carePlan.getProviderId());
            if (patient == null) {
                log.warn("[MAIL] Cannot send email: patient id {} not found in user-service.", carePlan.getPatientId());
                return;
            }
            String providerFullName = provider != null
                    ? (provider.getFirstName() != null ? provider.getFirstName() : "") + " " + (provider.getLastName() != null ? provider.getLastName() : "")
                    : null;
            String priority = carePlan.getPriority() != null ? carePlan.getPriority().name() : "MEDIUM";
            carePlanMailService.sendCarePlanCreatedToPatient(
                    patient.getEmail(),
                    patient.getFirstName(),
                    providerFullName != null ? providerFullName.trim() : null,
                    carePlan.getId(),
                    priority
            );
        } catch (Exception e) {
            log.error("[MAIL] Could not prepare email (e.g. user-service unreachable): {}", e.getMessage(), e);
        }
    }

    // Mise à jour (provider créateur ou ADMIN)
    @PreAuthorize("hasRole('PROVIDER') or hasRole('ADMIN')")
    @Transactional
    public CarePlanResponse updateCarePlan(Long id, CarePlanRequest request) {
        CarePlan carePlan = carePlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Care plan not found"));

        if (!getCurrentUserRole().equals("ADMIN")) {
            Long providerId = getCurrentUserId();
            if (!carePlan.getProviderId().equals(providerId)) {
                throw new UnauthorizedException("You are not the creator of this care plan");
            }
        }

        // On peut aussi vérifier que le patient n'a pas changé, ou autoriser le changement
        if (!carePlan.getPatientId().equals(request.getPatientId())) {
            validatePatient(request.getPatientId());
            carePlan.setPatientId(request.getPatientId());
        }
        if (getCurrentUserRole().equals("ADMIN") && request.getProviderId() != null) {
            carePlan.setProviderId(request.getProviderId());
        }

        if (request.getPriority() != null) {
            carePlan.setPriority(parsePriority(request.getPriority()));
        }
        carePlan.setNutritionPlan(request.getNutritionPlan());
        carePlan.setSleepPlan(request.getSleepPlan());
        carePlan.setActivityPlan(request.getActivityPlan());
        carePlan.setMedicationPlan(request.getMedicationPlan());
        carePlan.setNutritionDeadline(request.getNutritionDeadline());
        carePlan.setSleepDeadline(request.getSleepDeadline());
        carePlan.setActivityDeadline(request.getActivityDeadline());
        carePlan.setMedicationDeadline(request.getMedicationDeadline());

        CarePlan updated = carePlanRepository.save(carePlan);
        return mapToResponse(updated);
    }

    // Suppression (provider créateur ou ADMIN)
    @PreAuthorize("hasRole('PROVIDER') or hasRole('ADMIN')")
    @Transactional
    public void deleteCarePlan(Long id) {
        CarePlan carePlan = carePlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Care plan not found"));
        if (!getCurrentUserRole().equals("ADMIN")) {
            Long providerId = getCurrentUserId();
            if (!carePlan.getProviderId().equals(providerId)) {
                throw new UnauthorizedException("You are not the creator of this care plan");
            }
        }
        carePlanRepository.delete(carePlan);
    }

    // Récupération par ID avec contrôle d'accès
    @PreAuthorize("isAuthenticated()")
    public CarePlanResponse getCarePlanById(Long id) {
        CarePlan carePlan = carePlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Care plan not found"));

        Long userId = getCurrentUserId();
        String role = getCurrentUserRole();

        if ("PROVIDER".equals(role)) {
            // Un provider peut voir n'importe quel plan (on pourrait restreindre à ses patients)
            return mapToResponse(carePlan);
        } else if ("PATIENT".equals(role)) {
            if (!carePlan.getPatientId().equals(userId)) {
                throw new UnauthorizedException("You can only view your own care plans");
            }
            return mapToResponse(carePlan);
        } else if ("CAREGIVER".equals(role)) {
            Boolean assigned = userServiceClient.isCaregiverAssignedToPatient(userId, carePlan.getPatientId());
            if (Boolean.TRUE.equals(assigned)) {
                return mapToResponse(carePlan);
            } else {
                throw new UnauthorizedException("You are not assigned to this patient");
            }
        } else if ("ADMIN".equals(role)) {
            return mapToResponse(carePlan);
        } else {
            throw new UnauthorizedException("Access denied");
        }
    }

    // Liste des care plans pour un patient donné
    @PreAuthorize("isAuthenticated()")
    public List<CarePlanResponse> getCarePlansByPatient(Long patientId) {
        // Vérifier l'existence du patient
        validatePatient(patientId);

        Long userId = getCurrentUserId();
        String role = getCurrentUserRole();

        // Contrôle d'accès
        if ("PATIENT".equals(role) && !userId.equals(patientId)) {
            throw new UnauthorizedException("You can only access your own care plans");
        }
        if ("CAREGIVER".equals(role)) {
            Boolean assigned = userServiceClient.isCaregiverAssignedToPatient(userId, patientId);
            if (!Boolean.TRUE.equals(assigned)) {
                throw new UnauthorizedException("You are not assigned to this patient");
            }
        }
        // PROVIDER et ADMIN peuvent voir tous les patients

        List<CarePlan> carePlans = carePlanRepository.findByPatientId(patientId);
        return carePlans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /** List care plans according to current user role: PROVIDER = his plans, ADMIN = all, PATIENT = his, CAREGIVER = assigned patients' plans */
    @PreAuthorize("isAuthenticated()")
    public List<CarePlanResponse> getCarePlansList() {
        Long userId = getCurrentUserId();
        String role = getCurrentUserRole();

        if ("PROVIDER".equals(role)) {
            List<CarePlan> plans = carePlanRepository.findByProviderId(userId);
            return plans.stream().map(this::mapToResponse).collect(Collectors.toList());
        }
        if ("ADMIN".equals(role)) {
            List<CarePlan> plans = carePlanRepository.findAll();
            return plans.stream().map(this::mapToResponse).collect(Collectors.toList());
        }
        if ("PATIENT".equals(role)) {
            List<CarePlan> plans = carePlanRepository.findByPatientId(userId);
            return plans.stream().map(this::mapToResponse).collect(Collectors.toList());
        }
        if ("CAREGIVER".equals(role)) {
            List<Long> patientIds = userServiceClient.getPatientIdsByCaregiver(userId);
            List<CarePlanResponse> result = new ArrayList<>();
            for (Long patientId : patientIds) {
                result.addAll(carePlanRepository.findByPatientId(patientId).stream().map(this::mapToResponse).collect(Collectors.toList()));
            }
            return result;
        }
        throw new UnauthorizedException("Access denied");
    }

    /** Patient only: update one section's status (nutrition, sleep, activity, medication) to TODO or DONE. */
    @PreAuthorize("hasRole('PATIENT')")
    @Transactional
    public CarePlanResponse updateSectionStatus(Long id, String section, String status) {
        CarePlan carePlan = carePlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Care plan not found"));
        Long patientId = getCurrentUserId();
        if (!carePlan.getPatientId().equals(patientId)) {
            throw new UnauthorizedException("You can only update status of your own care plans");
        }
        CarePlanStatus newStatus;
        try {
            newStatus = CarePlanStatus.valueOf(status != null ? status.toUpperCase() : "TODO");
        } catch (IllegalArgumentException e) {
            newStatus = CarePlanStatus.TODO;
        }
        String sec = section != null ? section.toUpperCase() : "";
        switch (sec) {
            case "NUTRITION" -> carePlan.setNutritionStatus(newStatus);
            case "SLEEP" -> carePlan.setSleepStatus(newStatus);
            case "ACTIVITY" -> carePlan.setActivityStatus(newStatus);
            case "MEDICATION" -> carePlan.setMedicationStatus(newStatus);
            default -> throw new IllegalArgumentException("Invalid section: " + section);
        }
        carePlanRepository.save(carePlan);
        return mapToResponse(carePlan);
    }

    /** Throws if current user cannot view this care plan (same rules as getCarePlanById). */
    private void ensureCanAccessCarePlan(CarePlan carePlan) {
        Long userId = getCurrentUserId();
        String role = getCurrentUserRole();
        if ("PROVIDER".equals(role)) return;
        if ("PATIENT".equals(role)) {
            if (!carePlan.getPatientId().equals(userId)) throw new UnauthorizedException("You can only view your own care plans");
            return;
        }
        if ("CAREGIVER".equals(role)) {
            Boolean assigned = userServiceClient.isCaregiverAssignedToPatient(userId, carePlan.getPatientId());
            if (!Boolean.TRUE.equals(assigned)) throw new UnauthorizedException("You are not assigned to this patient");
            return;
        }
        if ("ADMIN".equals(role)) return;
        throw new UnauthorizedException("Access denied");
    }

    /** Only the provider who created the plan or the patient can send messages. */
    private void ensureCanSendMessage(CarePlan carePlan) {
        Long userId = getCurrentUserId();
        if (carePlan.getProviderId().equals(userId) || carePlan.getPatientId().equals(userId)) return;
        throw new UnauthorizedException("Only the doctor or the patient can send messages in this chat");
    }

    private String getSenderDisplayName(Long senderId) {
        try {
            UserDto user = userServiceClient.getUserById(senderId);
            if (user == null) return "User #" + senderId;
            return user.getFirstName() + " " + user.getLastName();
        } catch (Exception e) {
            return "User #" + senderId;
        }
    }

    @PreAuthorize("isAuthenticated()")
    public List<CarePlanMessageResponse> getMessages(Long carePlanId) {
        CarePlan carePlan = carePlanRepository.findById(carePlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Care plan not found"));
        ensureCanAccessCarePlan(carePlan);
        return carePlanMessageRepository.findByCarePlanIdOrderByCreatedAtAsc(carePlanId).stream()
                .map(msg -> CarePlanMessageResponse.builder()
                        .id(msg.getId())
                        .carePlanId(msg.getCarePlanId())
                        .senderId(msg.getSenderId())
                        .senderName(getSenderDisplayName(msg.getSenderId()))
                        .content(msg.getContent())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public CarePlanMessageResponse sendMessage(Long carePlanId, CarePlanMessageRequest request) {
        CarePlan carePlan = carePlanRepository.findById(carePlanId)
                .orElseThrow(() -> new ResourceNotFoundException("Care plan not found"));
        ensureCanAccessCarePlan(carePlan);
        ensureCanSendMessage(carePlan);
        CarePlanMessage msg = new CarePlanMessage();
        msg.setCarePlanId(carePlanId);
        msg.setSenderId(getCurrentUserId());
        msg.setContent(request.getContent() != null ? request.getContent().trim() : "");
        msg = carePlanMessageRepository.save(msg);
        return CarePlanMessageResponse.builder()
                .id(msg.getId())
                .carePlanId(msg.getCarePlanId())
                .senderId(msg.getSenderId())
                .senderName(getSenderDisplayName(msg.getSenderId()))
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    /** Admin only: aggregate statistics for all care plans. */
    @PreAuthorize("hasRole('ADMIN')")
    public CarePlanStatsResponse getStats() {
        List<CarePlan> all = carePlanRepository.findAll();

        long total = all.size();
        Map<String, Long> byPriority = new HashMap<>();
        byPriority.put("LOW", 0L);
        byPriority.put("MEDIUM", 0L);
        byPriority.put("HIGH", 0L);

        long nutritionTodo = 0, nutritionDone = 0;
        long sleepTodo = 0, sleepDone = 0;
        long activityTodo = 0, activityDone = 0;
        long medicationTodo = 0, medicationDone = 0;

        for (CarePlan p : all) {
            if (p.getPriority() != null) {
                byPriority.merge(p.getPriority().name(), 1L, Long::sum);
            }
            if (CarePlanStatus.TODO.equals(p.getNutritionStatus())) nutritionTodo++; else nutritionDone++;
            if (CarePlanStatus.TODO.equals(p.getSleepStatus())) sleepTodo++; else sleepDone++;
            if (CarePlanStatus.TODO.equals(p.getActivityStatus())) activityTodo++; else activityDone++;
            if (CarePlanStatus.TODO.equals(p.getMedicationStatus())) medicationTodo++; else medicationDone++;
        }

        List<CarePlanStatsResponse.SectionStatDto> sectionStats = List.of(
                new CarePlanStatsResponse.SectionStatDto("nutrition", nutritionTodo, nutritionDone),
                new CarePlanStatsResponse.SectionStatDto("sleep", sleepTodo, sleepDone),
                new CarePlanStatsResponse.SectionStatDto("activity", activityTodo, activityDone),
                new CarePlanStatsResponse.SectionStatDto("medication", medicationTodo, medicationDone)
        );

        return CarePlanStatsResponse.builder()
                .totalCarePlans(total)
                .byPriority(byPriority)
                .sectionStats(sectionStats)
                .build();
    }
}