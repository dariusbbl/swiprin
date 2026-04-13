package com.swiprin.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateApplicationRequest {

    @NotNull
    private Long jobId;

    private Long cvDraftId; // optional — uses default CV if not provided
}
