package com.swiprin.controller;

import com.swiprin.dto.request.CreateJobRequest;
import com.swiprin.dto.request.UpdateJobRequest;
import com.swiprin.dto.response.JobManagementResponse;
import com.swiprin.dto.response.JobResponse;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Jobs")
public class JobController {

    private final JobService jobService;

    // Candidate: swipe feed sorted by skill match
    @GetMapping("/feed")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Job feed for candidate, sorted by skill match")
    public ResponseEntity<PageResponse<JobResponse>> getFeed(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.getFeedForCandidate(principal.getId(), PageRequest.of(page, size)));
    }

    // Candidate: get single job
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get job details (candidate view — active only)")
    public ResponseEntity<JobResponse> getForCandidate(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.getByIdForCandidate(id, principal.getId()));
    }

    // Recruiter: own jobs
    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Recruiter's own jobs")
    public ResponseEntity<PageResponse<JobManagementResponse>> getMyJobs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                jobService.getByRecruiter(principal.getId(), activeOnly, PageRequest.of(page, size)));
    }

    // Recruiter: get single job (own)
    @GetMapping("/my/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Get own job details (recruiter view)")
    public ResponseEntity<JobManagementResponse> getMyJob(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.getByIdForRecruiter(id, principal.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Create job")
    public ResponseEntity<JobManagementResponse> create(@Valid @RequestBody CreateJobRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(jobService.create(req, principal.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Update own job")
    public ResponseEntity<JobManagementResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody UpdateJobRequest req,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(jobService.update(id, req, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Delete own job")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        jobService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
