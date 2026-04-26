package com.swiprin.service;

import com.swiprin.dto.request.UpdateProfileRequest;
import com.swiprin.dto.request.UpdateUserProfileRequest;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.dto.response.UserProfileResponse;
import com.swiprin.dto.response.UserResponse;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.Skill;
import com.swiprin.model.User;
import com.swiprin.model.UserProfile;
import com.swiprin.model.enums.Role;
import com.swiprin.model.enums.UserStatus;
import com.swiprin.repository.SkillRepository;
import com.swiprin.repository.UserProfileRepository;
import com.swiprin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final CompanyService companyService;
    private final UserProfileRepository userProfileRepository;

    public UserResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    public UserResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(user);
    }

    public PageResponse<UserResponse> getAllByRole(Role role, Pageable pageable) {
        Page<User> page = (role != null)
                ? userRepository.findAllByRole(role, pageable)
                : userRepository.findAll(pageable);
        return toPageResponse(page);
    }

    // Admin: approve or reject a recruiter
    @Transactional
    public UserResponse setStatus(Long id, UserStatus status) {
        User user = findOrThrow(id);
        user.setStatus(status);
        return toResponse(userRepository.save(user));
    }

    // Candidate/Recruiter: update own profile and skills
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = findOrThrow(userId);
        if (req.getFullName() != null) user.setFullName(req.getFullName().trim());
        if (req.getPhoneNumber() != null) user.setPhoneNumber(req.getPhoneNumber());
        if (req.getJobTitle() != null) user.setJobTitle(req.getJobTitle());
        if (req.getSkillIds() != null) user.setSkills(resolveSkills(req.getSkillIds()));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(Long id) {
        userRepository.delete(findOrThrow(id));
    }

    public UserProfileResponse getProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .map(this::toProfileResponse)
                .orElse(null);
    }

    @Transactional
    public UserProfileResponse upsertProfile(Long userId, UpdateUserProfileRequest req) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = findOrThrow(userId);
                    return UserProfile.builder().user(user).build();
                });

        if (req.getBio() != null) profile.setBio(req.getBio().trim());
        if (req.getCurrentLocation() != null) profile.setCurrentLocation(req.getCurrentLocation().trim());
        if (req.getEducationLevel() != null) profile.setEducationLevel(req.getEducationLevel());
        if (req.getFaculty() != null) profile.setFaculty(req.getFaculty().trim());
        if (req.getGraduationDate() != null) profile.setGraduationDate(req.getGraduationDate());
        if (req.getLinkedInUrl() != null) profile.setLinkedInUrl(req.getLinkedInUrl().trim());
        if (req.getGithubUrl() != null) profile.setGithubUrl(req.getGithubUrl().trim());

        return toProfileResponse(userProfileRepository.save(profile));
    }

    public UserProfileResponse toProfileResponse(UserProfile p) {
        return UserProfileResponse.builder()
                .id(p.getId())
                .bio(p.getBio())
                .currentLocation(p.getCurrentLocation())
                .educationLevel(p.getEducationLevel())
                .faculty(p.getFaculty())
                .graduationDate(p.getGraduationDate())
                .linkedInUrl(p.getLinkedInUrl())
                .githubUrl(p.getGithubUrl())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private Set<Skill> resolveSkills(Set<Long> skillIds) {
        if (skillIds.isEmpty()) return new HashSet<>();
        List<Skill> found = skillRepository.findAllByIdIn(skillIds);
        if (found.size() != skillIds.size()) {
            throw new com.swiprin.exception.BadRequestException("One or more skill IDs are invalid");
        }
        return new HashSet<>(found);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .jobTitle(user.getJobTitle())
                .businessEmail(user.getBusinessEmail())
                .company(user.getCompany() != null ? companyService.toResponse(user.getCompany()) : null)
                .skills(user.getSkills().stream().map(SkillService::toResponse).toList())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private PageResponse<UserResponse> toPageResponse(Page<User> page) {
        return PageResponse.<UserResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
