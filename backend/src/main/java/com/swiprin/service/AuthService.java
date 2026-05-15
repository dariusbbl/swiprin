package com.swiprin.service;

import com.swiprin.dto.request.LoginRequest;
import com.swiprin.dto.request.RegisterCandidateRequest;
import com.swiprin.dto.request.RegisterRecruiterRequest;
import com.swiprin.dto.response.AuthResponse;
import com.swiprin.exception.BadRequestException;
import com.swiprin.exception.ForbiddenException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.Company;
import com.swiprin.model.User;
import com.swiprin.model.enums.Role;
import com.swiprin.model.enums.UserStatus;
import com.swiprin.repository.CompanyRepository;
import com.swiprin.repository.UserRepository;
import com.swiprin.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private String generateUniqueCode() {
        String code;
        do {
            code = String.format("%06d", ThreadLocalRandom.current().nextInt(100000, 1000000));
        } while (companyRepository.existsByCompanyCode(code));
        return code;
    }

    @Transactional
    public AuthResponse registerCandidate(RegisterCandidateRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already in use");
        }
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.CANDIDATE)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse registerRecruiter(RegisterRecruiterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already in use");
        }
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        boolean hasExistingCompany = req.getExistingCompanyCode() != null && !req.getExistingCompanyCode().isBlank();
        boolean hasNewCompany = req.getNewCompanyName() != null && !req.getNewCompanyName().isBlank();

        if (hasExistingCompany == hasNewCompany) {
            throw new BadRequestException("Choose either an existing company or provide new company details, not both");
        }

        Company company;
        if (hasExistingCompany) {
            company = companyRepository.findByCompanyCode(req.getExistingCompanyCode().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("No company found with code " + req.getExistingCompanyCode()));
        } else {
            company = Company.builder()
                    .name(req.getNewCompanyName())
                    .website(req.getNewCompanyWebsite())
                    .description(req.getNewCompanyDescription())
                    .companyCode(generateUniqueCode())
                    .isVerified(false)
                    .build();
            companyRepository.save(company);
        }

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.RECRUITER)
                .status(UserStatus.PENDING_APPROVAL)
                .phoneNumber(req.getPhoneNumber())
                .jobTitle(req.getJobTitle())
                .businessEmail(req.getBusinessEmail())
                .company(company)
                .build();

        userRepository.save(user);

        // No token returned — recruiter cannot log in until admin approves
        return AuthResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            throw new ForbiddenException("Your account is pending admin approval");
        }
        if (user.getStatus() == UserStatus.REJECTED) {
            throw new ForbiddenException("Your account has been rejected");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user))
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
