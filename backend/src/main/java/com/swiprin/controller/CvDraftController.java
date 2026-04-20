package com.swiprin.controller;

import com.swiprin.dto.request.CreateCvDraftRequest;
import com.swiprin.dto.response.CvDraftResponse;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.CvDraftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cv-drafts")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('CANDIDATE')")
@Tag(name = "CV Drafts")
public class CvDraftController {

    private final CvDraftService cvDraftService;

    @GetMapping
    @Operation(summary = "List own CV drafts")
    public ResponseEntity<List<CvDraftResponse>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.getAllForUser(principal.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get CV draft by ID")
    public ResponseEntity<CvDraftResponse> getById(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.getById(id, principal.getId()));
    }

    @PostMapping
    @Operation(summary = "Create CV draft")
    public ResponseEntity<CvDraftResponse> create(@Valid @RequestBody CreateCvDraftRequest req,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cvDraftService.create(req, principal.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update CV draft")
    public ResponseEntity<CvDraftResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody CreateCvDraftRequest req,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.update(id, req, principal.getId()));
    }

    @PutMapping("/{id}/default")
    @Operation(summary = "Set CV draft as default")
    public ResponseEntity<CvDraftResponse> setDefault(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.setDefault(id, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete CV draft")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        cvDraftService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
