package com.swiprin.controller;

import com.swiprin.dto.request.LoginRequest;
import com.swiprin.dto.request.RegisterCandidateRequest;
import com.swiprin.dto.request.RegisterRecruiterRequest;
import com.swiprin.dto.response.AuthResponse;
import com.swiprin.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/candidate")
    @Operation(summary = "Register as candidate")
    public ResponseEntity<AuthResponse> registerCandidate(@Valid @RequestBody RegisterCandidateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerCandidate(req));
    }

    @PostMapping("/register/recruiter")
    @Operation(summary = "Register as recruiter (pending admin approval)")
    public ResponseEntity<AuthResponse> registerRecruiter(@Valid @RequestBody RegisterRecruiterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerRecruiter(req));
    }

    @PostMapping("/login")
    @Operation(summary = "Login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
