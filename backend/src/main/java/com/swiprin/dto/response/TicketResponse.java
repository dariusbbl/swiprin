package com.swiprin.dto.response;

import com.swiprin.model.enums.TicketCategory;
import com.swiprin.model.enums.TicketPriority;
import com.swiprin.model.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private TicketCategory category;
    private TicketPriority priority;
    private String message;
    private Boolean contactConsent;
    private TicketStatus status;
    private String resolvedByName;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
