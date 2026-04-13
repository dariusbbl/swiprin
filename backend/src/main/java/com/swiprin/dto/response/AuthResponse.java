package com.swiprin.dto.response;

import com.swiprin.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    @Builder.Default
    private String tokenType = "Bearer";

    private String token;
    private Long userId;
    private String fullName;
    private String email;
    private Role role;
}
