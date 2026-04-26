package com.swiprin.dto.request;

import com.swiprin.model.enums.EducationLevel;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserProfileRequest {

    @Size(max = 1000)
    private String bio;

    @Size(max = 100)
    private String currentLocation;

    private EducationLevel educationLevel;

    @Size(max = 255)
    private String faculty;

    private LocalDate graduationDate;

    @Pattern(regexp = "^(https?://)?([\\w]+\\.)?linkedin\\.com/.*$",
             message = "Invalid LinkedIn URL")
    private String linkedInUrl;

    @Pattern(regexp = "^(https?://)?github\\.com/.*$",
             message = "Invalid GitHub URL")
    private String githubUrl;
}
