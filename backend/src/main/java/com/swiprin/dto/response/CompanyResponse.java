package com.swiprin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {

    private Long id;
    private String name;
    private String website;
    private String description;
    private String logoUrl;
    private Boolean isVerified;
    private long jobCount;        // active jobs — visible to admin/recruiter, filtered in service
    private LocalDateTime createdAt;
}
