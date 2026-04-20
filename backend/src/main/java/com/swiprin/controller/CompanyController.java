package com.swiprin.controller;

import com.swiprin.dto.request.CreateCompanyRequest;
import com.swiprin.dto.request.UpdateCompanyRequest;
import com.swiprin.dto.response.CompanyResponse;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.service.CompanyService;
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
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Companies")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    @Operation(summary = "List companies (search + pagination)")
    public ResponseEntity<PageResponse<CompanyResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(companyService.getAll(search, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get company by ID")
    public ResponseEntity<CompanyResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create company (ADMIN only)")
    public ResponseEntity<CompanyResponse> create(@Valid @RequestBody CreateCompanyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update company (ADMIN only)")
    public ResponseEntity<CompanyResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateCompanyRequest req) {
        return ResponseEntity.ok(companyService.update(id, req));
    }

    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify company (ADMIN only)")
    public ResponseEntity<CompanyResponse> verify(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.verify(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete company (ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        companyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
