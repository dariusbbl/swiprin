package com.swiprin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// Candidate-facing job response — no recruiter info, no shortlist threshold
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private String location;
    private Boolean remote;
    private CompanyResponse company;
    private List<SkillResponse> skills;
    private Boolean applied;        // true if the authenticated candidate already applied
    private LocalDateTime createdAt;
}
