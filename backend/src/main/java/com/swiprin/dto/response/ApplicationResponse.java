package com.swiprin.dto.response;

import com.swiprin.model.enums.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Candidate-facing: shows their own application status and match percent
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {

    private Long id;
    private JobResponse job;
    private CvDraftResponse cvDraft;
    private ApplicationStatus status;
    private Integer matchPercent;
    private Boolean shortlisted;
    private LocalDateTime appliedAt;
}
