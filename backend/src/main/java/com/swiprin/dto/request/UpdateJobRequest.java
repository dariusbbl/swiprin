package com.swiprin.dto.request;

import com.swiprin.model.enums.WorkMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateJobRequest {

    @Size(min = 2, max = 100)
    private String title;

    @Size(min = 10)
    private String description;
    private String location;
    private WorkMode workMode;
    private Boolean active;

    @Min(0) @Max(100)
    private Integer shortlistThreshold;

    private Set<Long> skillIds;
}
