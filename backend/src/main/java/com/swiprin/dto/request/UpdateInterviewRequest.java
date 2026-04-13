package com.swiprin.dto.request;

import com.swiprin.model.enums.InterviewMode;
import jakarta.validation.constraints.Future;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateInterviewRequest {

    private String title;

    @Future
    private LocalDateTime scheduledAt;

    private InterviewMode type;

    private String location;

    private String description;
}
