package com.esprit.microservice.careplanservice.repositories;

import com.esprit.microservice.careplanservice.entities.CarePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CarePlanRepository extends JpaRepository<CarePlan, Long> {
    List<CarePlan> findByPatientId(Long patientId);
    List<CarePlan> findByProviderId(Long providerId);
}