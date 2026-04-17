package com.swiprin.service;

import com.swiprin.dto.request.CreateApplicationRequest;
import com.swiprin.dto.request.CreateInterviewRequest;
import com.swiprin.dto.request.UpdateApplicationStatusRequest;
import com.swiprin.dto.request.UpdateInterviewRequest;
import com.swiprin.dto.response.*;
import com.swiprin.exception.BadRequestException;
import com.swiprin.exception.ForbiddenException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.*;
import com.swiprin.model.enums.ApplicationStatus;
import com.swiprin.model.enums.NotificationType;
import com.swiprin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final CvDraftRepository cvDraftRepository;
    private final InterviewScheduleRepository interviewScheduleRepository;
    private final NotificationService notificationService;
    private final JobService jobService;
    private final UserService userService;
    private final CvDraftService cvDraftService;

    @Transactional
    public ApplicationResponse apply(CreateApplicationRequest req, Long userId) {
        if (applicationRepository.existsByJobIdAndUserId(req.getJobId(), userId)) {
            throw new BadRequestException("You have already applied to this job");
        }

        Job job = jobRepository.findById(req.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!Boolean.TRUE.equals(job.getActive())) {
            throw new BadRequestException("This job is no longer accepting applications");
        }

        User candidate = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CvDraft cvDraft = resolveCvDraft(req.getCvDraftId(), userId);

        // The CV used for this application becomes the new default
        if (cvDraft != null) {
            cvDraftRepository.clearDefaultForUser(userId);
            cvDraft.setIsDefault(true);
            cvDraftRepository.save(cvDraft);
        }

        int matchPercent = calculateSkillMatch(candidate, job);

        Application application = Application.builder()
                .job(job)
                .user(candidate)
                .cvDraft(cvDraft)
                .matchPercent(matchPercent)
                .build();

        Application saved = applicationRepository.save(application);

        if (matchPercent >= job.getShortlistThreshold()) {
            saved.setShortlisted(true);
            applicationRepository.save(saved);
            notificationService.send(
                    userId,
                    NotificationType.SHORTLIST,
                    "You have been shortlisted for " + job.getTitle()
                            + " at " + job.getCompany().getName(),
                    saved.getId()
            );
        }

        return toCandidateResponse(saved);
    }

    public PageResponse<ApplicationResponse> getForCandidate(Long userId, ApplicationStatus status, Pageable pageable) {
        Page<Application> page = (status != null)
                ? applicationRepository.findAllByUserIdAndStatus(userId, status, pageable)
                : applicationRepository.findAllByUserId(userId, pageable);
        return toPageResponse(page, this::toCandidateResponse);
    }

    public PageResponse<ApplicationManagementResponse> getForJob(Long jobId, Long recruiterId,
                                                                   ApplicationStatus status, Pageable pageable) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        if (!job.getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this job");
        }
        Page<Application> page = (status != null)
                ? applicationRepository.findAllByJobIdAndStatus(jobId, status, pageable)
                : applicationRepository.findAllByJobId(jobId, pageable);
        return toPageResponse(page, this::toManagementResponse);
    }

    @Transactional
    public ApplicationManagementResponse updateStatus(Long id, UpdateApplicationStatusRequest req, Long recruiterId) {
        Application application = findOrThrow(id);
        if (!application.getJob().getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this application's job");
        }
        if (req.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Cannot set status to WITHDRAWN — only candidates can withdraw");
        }

        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(req.getStatus());
        Application saved = applicationRepository.save(application);

        if (!oldStatus.equals(req.getStatus())) {
            notificationService.send(
                    application.getUser().getId(),
                    NotificationType.STATUS_UPDATE,
                    "Your application for " + application.getJob().getTitle()
                            + " at " + application.getJob().getCompany().getName()
                            + " status updated to: " + req.getStatus().name(),
                    saved.getId()
            );
        }

        return toManagementResponse(saved);
    }

    // Candidate: signal no longer interested — kept in DB with WITHDRAWN status
    @Transactional
    public void withdraw(Long id, Long userId) {
        Application application = findOrThrow(id);
        if (!application.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not own this application");
        }
        if (application.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Application is already withdrawn");
        }
        if (application.getStatus() == ApplicationStatus.OFFER
                || application.getStatus() == ApplicationStatus.REJECTED) {
            throw new BadRequestException("Cannot withdraw an application at this stage");
        }
        application.setStatus(ApplicationStatus.WITHDRAWN);
        applicationRepository.save(application);
    }

    // Admin/Recruiter: hard delete
    @Transactional
    public void delete(Long id, Long recruiterId) {
        Application application = findOrThrow(id);
        if (!application.getJob().getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this application's job");
        }
        applicationRepository.delete(application);
    }

    @Transactional
    public InterviewResponse scheduleInterview(Long applicationId, CreateInterviewRequest req, Long recruiterId) {
        Application application = findOrThrow(applicationId);
        if (!application.getJob().getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this application's job");
        }

        InterviewSchedule interview = InterviewSchedule.builder()
                .application(application)
                .title(req.getTitle())
                .scheduledAt(req.getScheduledAt())
                .mode(req.getMode())
                .location(req.getLocation())
                .description(req.getDescription())
                .build();

        InterviewSchedule saved = interviewScheduleRepository.save(interview);

        notificationService.send(
                application.getUser().getId(),
                NotificationType.INTERVIEW_SCHEDULED,
                "Interview scheduled for " + application.getJob().getTitle()
                        + " at " + application.getJob().getCompany().getName()
                        + ": " + req.getTitle(),
                saved.getId()
        );

        return toInterviewResponse(saved);
    }

    @Transactional
    public InterviewResponse updateInterview(Long interviewId, UpdateInterviewRequest req, Long recruiterId) {
        InterviewSchedule interview = interviewScheduleRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
        if (!interviewScheduleRepository.existsByIdAndApplicationJobRecruiterId(interviewId, recruiterId)) {
            throw new ForbiddenException("You do not own this interview");
        }

        if (req.getTitle() != null) interview.setTitle(req.getTitle());
        if (req.getScheduledAt() != null) interview.setScheduledAt(req.getScheduledAt());
        if (req.getMode() != null) interview.setMode(req.getMode());
        if (req.getLocation() != null) interview.setLocation(req.getLocation());
        if (req.getDescription() != null) interview.setDescription(req.getDescription());

        InterviewSchedule saved = interviewScheduleRepository.save(interview);

        notificationService.send(
                interview.getApplication().getUser().getId(),
                NotificationType.INTERVIEW_UPDATED,
                "Interview updated for " + interview.getApplication().getJob().getTitle()
                        + " at " + interview.getApplication().getJob().getCompany().getName()
                        + ": " + saved.getTitle(),
                saved.getId()
        );

        return toInterviewResponse(saved);
    }

    public PageResponse<InterviewResponse> getInterviewsForCandidate(Long userId, Pageable pageable) {
        Page<InterviewSchedule> page = interviewScheduleRepository.findAllByUserId(userId, pageable);
        return PageResponse.<InterviewResponse>builder()
                .content(page.getContent().stream().map(this::toInterviewResponse).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }

    public List<InterviewResponse> getInterviewsForApplication(Long applicationId, Long recruiterId) {
        Application application = findOrThrow(applicationId);
        if (!application.getJob().getRecruiter().getId().equals(recruiterId)) {
            throw new ForbiddenException("You do not own this application's job");
        }
        return interviewScheduleRepository
                .findAllByApplicationIdOrderByScheduledAtAsc(applicationId)
                .stream().map(this::toInterviewResponse).toList();
    }

    // Resolves the CV to use — throws if none found
    private CvDraft resolveCvDraft(Long cvDraftId, Long userId) {
        if (cvDraftId != null) {
            CvDraft draft = cvDraftRepository.findByIdAndUserId(cvDraftId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("CV draft not found"));
            if (Boolean.TRUE.equals(draft.getDeleted())) {
                throw new BadRequestException("Selected CV draft has been deleted");
            }
            return draft;
        }
        return cvDraftRepository.findByUserIdAndIsDefaultTrueAndDeletedFalse(userId)
                .orElseThrow(() -> new BadRequestException(
                        "No default CV found. Please select or create a CV before applying"));
    }

    private int calculateSkillMatch(User candidate, Job job) {
        if (job.getSkills().isEmpty()) return 0;
        long overlap = candidate.getSkills().stream()
                .filter(s -> job.getSkills().contains(s))
                .count();
        return (int) Math.round((double) overlap / job.getSkills().size() * 100);
    }

    private Application findOrThrow(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
    }

    private ApplicationResponse toCandidateResponse(Application a) {
        return ApplicationResponse.builder()
                .id(a.getId())
                .job(jobService.toJobResponseInternal(a.getJob(), a.getUser().getId()))
                .cvDraft(a.getCvDraft() != null ? cvDraftService.toResponse(a.getCvDraft()) : null)
                .status(a.getStatus())
                .matchPercent(a.getMatchPercent())
                .shortlisted(a.getShortlisted())
                .appliedAt(a.getAppliedAt())
                .build();
    }

    private ApplicationManagementResponse toManagementResponse(Application a) {
        return ApplicationManagementResponse.builder()
                .id(a.getId())
                .job(jobService.toManagementResponse(a.getJob()))
                .candidate(userService.toResponse(a.getUser()))
                .cvDraft(a.getCvDraft() != null ? cvDraftService.toResponse(a.getCvDraft()) : null)
                .status(a.getStatus())
                .matchPercent(a.getMatchPercent())
                .shortlisted(a.getShortlisted())
                .appliedAt(a.getAppliedAt())
                .build();
    }

    private <T> PageResponse<T> toPageResponse(Page<Application> page,
                                                java.util.function.Function<Application, T> mapper) {
        return PageResponse.<T>builder()
                .content(page.getContent().stream().map(mapper).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }

    private InterviewResponse toInterviewResponse(InterviewSchedule i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .applicationId(i.getApplication().getId())
                .title(i.getTitle())
                .scheduledAt(i.getScheduledAt())
                .mode(i.getMode())
                .location(i.getLocation())
                .description(i.getDescription())
                .createdAt(i.getCreatedAt())
                .build();
    }
}
