package com.swiprin.dto.response;

import com.swiprin.model.enums.InterviewMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewResponse {

    private Long id;
    private Long applicationId;
    private String title;
    private LocalDateTime scheduledAt;
    private InterviewMode mode;
    private String location;
    private String description;
    private LocalDateTime createdAt;
}
