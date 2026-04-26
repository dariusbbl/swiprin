package com.swiprin.dto.response;

import com.swiprin.model.enums.EducationLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String bio;
    private String currentLocation;
    private EducationLevel educationLevel;
    private String faculty;
    private LocalDate graduationDate;
    private String linkedInUrl;
    private String githubUrl;
    private LocalDateTime updatedAt;
}
