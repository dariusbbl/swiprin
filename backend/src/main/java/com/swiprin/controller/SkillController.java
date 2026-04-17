package com.swiprin.controller;

import com.swiprin.dto.request.CreateSkillRequest;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.dto.response.SkillResponse;
import com.swiprin.service.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Skills")
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    @Operation(summary = "List all skills (public, supports search + pagination)")
    public ResponseEntity<PageResponse<SkillResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(skillService.getAll(search, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get skill by ID")
    public ResponseEntity<SkillResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create skill (ADMIN only)")
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody CreateSkillRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update skill (ADMIN only)")
    public ResponseEntity<SkillResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody CreateSkillRequest req) {
        return ResponseEntity.ok(skillService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete skill (ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        skillService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
