package com.swiprin.dto.response;

import com.swiprin.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private String phoneNumber;
    private String jobTitle;
    private String businessEmail;
    private CompanyResponse company;
    private List<SkillResponse> skills;
    private LocalDateTime createdAt;
}
