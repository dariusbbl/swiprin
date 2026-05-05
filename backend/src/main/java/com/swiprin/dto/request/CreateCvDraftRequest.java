package com.swiprin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCvDraftRequest {

    @NotBlank
    @Size(min = 1, max = 40)
    private String name;

    @Size(max = 512)
    private String fileUrl;

    private Boolean isDefault = false;
}
