package com.swiprin.dto.response;

import com.swiprin.model.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Recruiter/Admin-facing: includes candidate profile and CV details
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationManagementResponse {

    private Long id;
    private JobManagementResponse job;
    private UserResponse candidate;
    private CvDraftResponse cvDraft;
    private ApplicationStatus status;
    private Integer matchPercent;
    private Boolean shortlisted;
    private LocalDateTime appliedAt;
}
