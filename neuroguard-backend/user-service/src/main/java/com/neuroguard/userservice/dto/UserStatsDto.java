package com.neuroguard.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDto {
    private long total;
    private long patients;
    private long providers;
    private long caregivers;
    private long admins;
}
