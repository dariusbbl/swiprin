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
public class CvDraftResponse {

    private Long id;
    private String name;
    private String fileUrl;
    private Boolean isDefault;
    private LocalDateTime createdAt;
}
