package com.swiprin.controller;

import com.swiprin.dto.request.CreateApplicationRequest;
import com.swiprin.dto.request.CreateInterviewRequest;
import com.swiprin.dto.request.UpdateApplicationStatusRequest;
import com.swiprin.dto.request.UpdateInterviewRequest;
import com.swiprin.dto.response.*;
import com.swiprin.model.enums.ApplicationStatus;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    // ── Candidate ──────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Apply to a job")
    public ResponseEntity<ApplicationResponse> apply(
            @Valid @RequestBody CreateApplicationRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.apply(req, principal.getId()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get own applications (optional status filter + pagination)")
    public ResponseEntity<PageResponse<ApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getForCandidate(
                principal.getId(), status,
                PageRequest.of(page, size, Sort.by("appliedAt").descending())));
    }

    @PutMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Withdraw application (sets status to WITHDRAWN, kept in DB)")
    public ResponseEntity<Void> withdraw(@PathVariable Long id,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        applicationService.withdraw(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/interviews")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get all scheduled interviews for the current candidate")
    public ResponseEntity<PageResponse<InterviewResponse>> getMyInterviews(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getInterviewsForCandidate(
                principal.getId(), PageRequest.of(page, size)));
    }

    // ── Recruiter ──────────────────────────────────────────────────────────

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Get applications for a job (optional status filter, sorted by match%)")
    public ResponseEntity<PageResponse<ApplicationManagementResponse>> getForJob(
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(applicationService.getForJob(
                jobId, principal.getId(), status,
                PageRequest.of(page, size, Sort.by("matchPercent").descending())));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Update application status")
    public ResponseEntity<ApplicationManagementResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicationStatusRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.updateStatus(id, req, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Hard-delete application (RECRUITER only)")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        applicationService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/interviews")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Schedule an interview for an application")
    public ResponseEntity<InterviewResponse> scheduleInterview(
            @PathVariable Long id,
            @Valid @RequestBody CreateInterviewRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.scheduleInterview(id, req, principal.getId()));
    }

    @PutMapping("/interviews/{interviewId}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Update an interview")
    public ResponseEntity<InterviewResponse> updateInterview(
            @PathVariable Long interviewId,
            @Valid @RequestBody UpdateInterviewRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.updateInterview(interviewId, req, principal.getId()));
    }

    @GetMapping("/{id}/interviews")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Get all interviews for an application")
    public ResponseEntity<List<InterviewResponse>> getInterviewsForApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getInterviewsForApplication(id, principal.getId()));
    }
}
