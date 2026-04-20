package com.swiprin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCompanyRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 250)
    @Pattern(
    regexp = "^(https?://).+",
    message = "Website must start with http:// or https://")
    private String website;

    private String description;
}
