package com.esprit.microservice.careplanservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarePlanStatsResponse {

    private long totalCarePlans;

    /** Count per priority: LOW, MEDIUM, HIGH */
    private Map<String, Long> byPriority;

    /** Per section (nutrition, sleep, activity, medication): count TODO vs DONE */
    private List<SectionStatDto> sectionStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SectionStatDto {
        private String section;
        private long todo;
        private long done;
    }
}
