package com.neuroguard.medicalhistoryservice.entity;


import jakarta.persistence.Embeddable;
import lombok.Data;

import java.time.LocalDate;

@Embeddable
@Data
public class Surgery {
    private String description;
    private LocalDate date;
}