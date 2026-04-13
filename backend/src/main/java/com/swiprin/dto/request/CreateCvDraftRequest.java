package com.swiprin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCvDraftRequest {

    @NotBlank
    @Size(min = 1, max = 40)
    private String name;

    private Boolean isDefault = false;
    // fileUrl is set after upload via separate endpoint
}
