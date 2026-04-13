package com.swiprin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

// Recruiter/Admin-facing job response — includes recruiter, threshold, application count
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobManagementResponse {

    private Long id;
    private String title;
    private String description;
    private String location;
    private Boolean remote;
    private Boolean active;
    private Integer shortlistThreshold;
    private CompanyResponse company;
    private UserResponse recruiter;
    private List<SkillResponse> skills;
    private long applicationCount;
    private LocalDateTime createdAt;
}
