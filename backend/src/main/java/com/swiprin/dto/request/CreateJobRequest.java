package com.swiprin.dto.request;

import com.swiprin.model.enums.WorkMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class CreateJobRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    private String location;

    @NotNull
    private WorkMode workMode;

    @Min(0) @Max(100)
    private int shortlistThreshold = 70;

    private Set<Long> skillIds;
}
