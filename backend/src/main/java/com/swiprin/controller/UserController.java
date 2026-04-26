package com.swiprin.controller;

import com.swiprin.dto.request.UpdateProfileRequest;
import com.swiprin.dto.request.UpdateUserProfileRequest;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.dto.response.UserProfileResponse;
import com.swiprin.dto.response.UserResponse;
import com.swiprin.model.enums.Role;
import com.swiprin.model.enums.UserStatus;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    private static final List<String> FACULTIES = List.of(
            // România
            "ETTI - Facultatea de Electronică, Telecomunicații și Tehnologia Informației (UPB)",
            "AC - Facultatea de Automatică și Calculatoare (UPB)",
            "FMI - Facultatea de Matematică și Informatică (UniBuc)",
            "CSIE - Facultatea de Cibernetică, Statistică și Informatică Economică (ASE)",
            "FILS - Facultatea de Inginerie în Limbi Străine (UPB)",
            "FII - Facultatea de Informatică (UAIC Iași)",
            "UTCN - Calculatoare și Tehnologia Informației (Cluj)",
            "UBB - Facultatea de Matematică și Informatică (Cluj)",
            "UVT - Facultatea de Matematică și Informatică (Timișoara)",
            // Europa
            "ETH Zürich - Computer Science",
            "TU Delft - Computer Science and Engineering",
            "TU Munich - Informatics",
            "KTH Stockholm - Computer Science",
            "Imperial College London - Computing",
            "University of Edinburgh - Informatics",
            "TU Berlin - Computer Science",
            "Politecnico di Milano - Computer Science and Engineering",
            "EPFL Lausanne - Computer Science",
            "University of Warsaw - Computer Science",
            "Czech Technical University - Computer Science",
            "Alta"
    );

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getById(principal.getId()));
    }

    @PutMapping("/me")
    @Operation(summary = "Update own profile and skills")
    public ResponseEntity<UserResponse> updateMe(@AuthenticationPrincipal UserPrincipal principal,
                                                  @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), req));
    }

    @GetMapping("/me/profile")
    @Operation(summary = "Get extended profile (bio, location, education, etc.)")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserProfileResponse profile = userService.getProfile(principal.getId());
        return profile != null ? ResponseEntity.ok(profile) : ResponseEntity.noContent().build();
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Create or update extended profile")
    public ResponseEntity<UserProfileResponse> upsertMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserProfileRequest req) {
        return ResponseEntity.ok(userService.upsertProfile(principal.getId(), req));
    }

    @GetMapping("/profile/faculties")
    @Operation(summary = "Get list of available faculties for profile selection")
    public ResponseEntity<List<String>> getFaculties() {
        return ResponseEntity.ok(FACULTIES);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users (ADMIN only, filterable by role)")
    public ResponseEntity<PageResponse<UserResponse>> getAll(
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userService.getAllByRole(role, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID (ADMIN only)")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve or reject a recruiter (ADMIN only)")
    public ResponseEntity<UserResponse> setStatus(@PathVariable Long id,
                                                   @RequestParam UserStatus status) {
        return ResponseEntity.ok(userService.setStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user (ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
