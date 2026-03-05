package com.esprit.microservice.careplanservice.repositories;

import com.esprit.microservice.careplanservice.entities.CarePlanMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CarePlanMessageRepository extends JpaRepository<CarePlanMessage, Long> {

    List<CarePlanMessage> findByCarePlanIdOrderByCreatedAtAsc(Long carePlanId);
}
