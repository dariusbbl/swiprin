package com.swiprin.controller;

import com.swiprin.dto.request.CreateCvDraftRequest;
import com.swiprin.dto.response.CvDraftResponse;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.CvDraftService;
import com.swiprin.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/cv-drafts")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "CV Drafts")
public class CvDraftController {

    private final CvDraftService     cvDraftService;
    private final FileStorageService fileStorageService;

    @GetMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "List own CV drafts")
    public ResponseEntity<List<CvDraftResponse>> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.getAllForUser(principal.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get CV draft by ID")
    public ResponseEntity<CvDraftResponse> getById(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.getById(id, principal.getId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Create CV draft")
    public ResponseEntity<CvDraftResponse> create(@Valid @RequestBody CreateCvDraftRequest req,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cvDraftService.create(req, principal.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Update CV draft")
    public ResponseEntity<CvDraftResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody CreateCvDraftRequest req,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.update(id, req, principal.getId()));
    }

    @PostMapping("/{id}/upload")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Upload CV file for a draft")
    public ResponseEntity<CvDraftResponse> uploadFile(@PathVariable Long id,
                                                       @RequestParam("file") MultipartFile file,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        String url = fileStorageService.storeCv(file, principal.getId());
        return ResponseEntity.ok(cvDraftService.setFileUrl(id, url, principal.getId()));
    }

    @GetMapping("/files/{userId}/{filename}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Download a CV file")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long userId,
                                                  @PathVariable String filename,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        // Candidates can only download their own files; recruiters/admins can download any
        Path filePath = fileStorageService.resolveFile(userId, filename);
        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists()) throw new ResourceNotFoundException("File not found");

            String contentType = filename.toLowerCase().endsWith(".pdf")
                    ? MediaType.APPLICATION_PDF_VALUE
                    : "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File not found");
        }
    }

    @PutMapping("/{id}/default")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Set CV draft as default")
    public ResponseEntity<CvDraftResponse> setDefault(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cvDraftService.setDefault(id, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Soft-delete CV draft")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        cvDraftService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
