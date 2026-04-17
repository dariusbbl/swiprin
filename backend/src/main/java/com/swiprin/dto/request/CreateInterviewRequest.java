package com.swiprin.dto.request;

import com.swiprin.model.enums.InterviewMode;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateInterviewRequest {

    @NotBlank
    private String title;

    @NotNull
    @Future
    private LocalDateTime scheduledAt;

    @NotNull
    private InterviewMode mode;

    private String location;

    private String description;
}
