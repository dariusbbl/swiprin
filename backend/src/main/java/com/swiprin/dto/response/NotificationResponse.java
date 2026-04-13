package com.swiprin.dto.response;

import com.swiprin.model.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private NotificationType type;
    private String message;
    private Boolean isRead;
    private Long referenceId;   // e.g. applicationId, jobId, interviewId — for frontend navigation
    private LocalDateTime createdAt;
}
