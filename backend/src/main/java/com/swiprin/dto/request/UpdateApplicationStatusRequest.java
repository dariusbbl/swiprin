package com.swiprin.dto.request;

import com.swiprin.model.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateApplicationStatusRequest {

    @NotNull
    private ApplicationStatus status;
}
