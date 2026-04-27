package com.swiprin.dto.request;

import com.swiprin.model.enums.TicketCategory;
import com.swiprin.model.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {

    @NotNull
    private TicketCategory category;

    @NotNull
    private TicketPriority priority;

    @NotBlank
    @Size(min = 10, max = 2000)
    private String message;

    private Boolean contactConsent = false;
}
