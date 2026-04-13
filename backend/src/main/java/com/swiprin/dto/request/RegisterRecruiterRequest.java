package com.swiprin.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRecruiterRequest {

    // Personal data
    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank
    private String confirmPassword;

    private String phoneNumber;

    @NotBlank
    private String jobTitle;

    @NotBlank
    @Email
    private String businessEmail;

    // Company data — either link to existing or register new
    private Long existingCompanyId;       // set if linking to an existing company

    private String newCompanyName;        // set if registering a new company
    private String newCompanyWebsite;
    private String newCompanyDescription;
    // logoUrl is handled separately via file upload endpoint
}
