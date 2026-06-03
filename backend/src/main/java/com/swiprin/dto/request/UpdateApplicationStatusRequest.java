package com.swiprin.dto.request;

import com.swiprin.model.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateApplicationStatusRequest {

    @NotNull
    private ApplicationStatus status;

    private String rejectionNote;

    // Offer fields — populated only when status = OFFER
    private String    offerText;
    private Integer   offerSalary;
    private String    offerSalaryType;
    private String    offerEmploymentType;
    private LocalDate offerDeadline;
    private LocalDate offerStartDate;
}
