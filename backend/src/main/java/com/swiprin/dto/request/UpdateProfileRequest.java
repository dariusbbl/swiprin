package com.swiprin.dto.request;

import jakarta.validation.constraints.Email;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateProfileRequest {

    private String fullName;

    @Email
    private String email;

    private String phoneNumber;

    private String jobTitle;

    private Set<Long> skillIds; // candidate updates their skills from profile page
}
