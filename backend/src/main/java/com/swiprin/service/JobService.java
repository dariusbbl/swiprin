package com.swiprin.service;

import com.swiprin.dto.request.CreateJobRequest;
import com.swiprin.dto.request.UpdateJobRequest;
import com.swiprin.dto.response.*;
import com.swiprin.exception.BadRequestException;
import com.swiprin.exception.ForbiddenException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.Job;
import com.swiprin.model.Skill;
import com.swiprin.model.User;
import com.swiprin.model.enums.UserStatus;
import com.swiprin.repository.ApplicationRepository;
import com.swiprin.repository.JobRepository;
import com.swiprin.repository.SkillRepository;
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
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ApplicationRepository applicationRepository;
    private final CompanyService companyService;
    private final UserService userService;

    // Candidate feed — sorted by skill match, includes applied flag
    public PageResponse<JobResponse> getFeedForCandidate(Long userId, Pageable pageable) {
        Page<Job> page = jobRepository.findActiveJobsSortedBySkillMatch(userId, pageable);
        return PageResponse.<JobResponse>builder()
                .content(page.getContent().stream().map(j -> toJobResponse(j, userId)).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    // Recruiter — own jobs
    public PageResponse<JobManagementResponse> getByRecruiter(Long recruiterId, Boolean activeOnly, Pageable pageable) {
        Page<Job> page = Boolean.TRUE.equals(activeOnly)
                ? jobRepository.findByRecruiterIdAndActiveTrue(recruiterId, pageable)
                : jobRepository.findByRecruiterId(recruiterId, pageable);
        return toManagementPageResponse(page);
    }

    public JobManagementResponse getByIdForRecruiter(Long jobId, Long recruiterId) {
        Job job = findOrThrow(jobId);
        if (!job.getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this job");
        }
        return toManagementResponse(job);
    }

    // Candidates can only see active jobs
    public JobResponse getByIdForCandidate(Long jobId, Long userId) {
        Job job = findOrThrow(jobId);
        if (!Boolean.TRUE.equals(job.getActive())) {
            throw new ResourceNotFoundException("Job not found: " + jobId);
        }
        return toJobResponse(job, userId);
    }

    @Transactional
    public JobManagementResponse create(CreateJobRequest req, Long recruiterId) {
        User recruiter = userRepository.findById(recruiterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (recruiter.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("Recruiter account is not active");
        }
        if (recruiter.getCompany() == null) {
            throw new BadRequestException("Recruiter must belong to a company before posting jobs");
        }

        Job job = Job.builder()
                .title(req.getTitle().trim())
                .description(req.getDescription().trim())
                .location(req.getLocation() != null ? req.getLocation().trim() : null)
                .workMode(req.getWorkMode())
                .shortlistThreshold(req.getShortlistThreshold())
                .active(true)
                .company(recruiter.getCompany())
                .recruiter(recruiter)
                .skills(resolveSkills(req.getSkillIds()))
                .build();

        return toManagementResponse(jobRepository.save(job));
    }

    @Transactional
    public JobManagementResponse update(Long jobId, UpdateJobRequest req, Long recruiterId) {
        Job job = findOrThrow(jobId);
        if (!job.getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this job");
        }
        if (req.getTitle() != null) job.setTitle(req.getTitle().trim());
        if (req.getDescription() != null) job.setDescription(req.getDescription().trim());
        if (req.getLocation() != null) job.setLocation(req.getLocation().trim());
        if (req.getWorkMode() != null) job.setWorkMode(req.getWorkMode());
        if (req.getActive() != null) job.setActive(req.getActive());
        if (req.getShortlistThreshold() != null) job.setShortlistThreshold(req.getShortlistThreshold());
        if (req.getSkillIds() != null) job.setSkills(resolveSkills(req.getSkillIds()));
        return toManagementResponse(jobRepository.save(job));
    }

    @Transactional
    public void delete(Long jobId, Long recruiterId) {
        Job job = findOrThrow(jobId);
        if (!job.getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this job");
        }
        jobRepository.delete(job);
    }

    private Set<Skill> resolveSkills(Set<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return new HashSet<>();
        List<Skill> found = skillRepository.findAllByIdIn(skillIds);
        if (found.size() != skillIds.size()) {
            throw new BadRequestException("One or more skill IDs are invalid");
        }
        return new HashSet<>(found);
    }

    private Job findOrThrow(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + id));
    }

    // Used internally (e.g. from ApplicationService) — no active check, preserves history
    public JobResponse toJobResponseInternal(Job job, Long userId) {
        return toJobResponse(job, userId);
    }

    private JobResponse toJobResponse(Job job, Long userId) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .location(job.getLocation())
                .workMode(job.getWorkMode())
                .company(companyService.toResponse(job.getCompany()))
                .skills(job.getSkills().stream().map(SkillService::toResponse).toList())
                .applied(applicationRepository.existsByJobIdAndUserId(job.getId(), userId))
                .createdAt(job.getCreatedAt())
                .build();
    }

    public JobManagementResponse toManagementResponse(Job job) {
        return JobManagementResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .location(job.getLocation())
                .workMode(job.getWorkMode())
                .active(job.getActive())
                .shortlistThreshold(job.getShortlistThreshold())
                .company(companyService.toResponse(job.getCompany()))
                .recruiter(userService.toResponse(job.getRecruiter()))
                .skills(job.getSkills().stream().map(SkillService::toResponse).toList())
                .applicationCount(applicationRepository.countByJobId(job.getId()))
                .createdAt(job.getCreatedAt())
                .build();
    }

    private PageResponse<JobManagementResponse> toManagementPageResponse(Page<Job> page) {
        return PageResponse.<JobManagementResponse>builder()
                .content(page.getContent().stream().map(this::toManagementResponse).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
