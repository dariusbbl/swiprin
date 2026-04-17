package com.swiprin.dto.request;

import lombok.Data;

@Data
public class UpdateCompanyRequest {

    @jakarta.validation.constraints.Size(min = 1, max = 100)
    private String name;

    @Size(max = 250)
    private String website;
    private String description;
    private String logoUrl;
}
