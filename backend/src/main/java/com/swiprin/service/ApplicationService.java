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

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    private final MatchingService matchingService;

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

        int matchPercent = matchingService.computeMatch(candidate, job, cvDraft);

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
                            + " at <strong>" + job.getCompany().getName() + "</strong>",
                    saved.getId()
            );
        }

        return toCandidateResponse(saved);
    }

    public Map<String, Long> getStatusCountsForCandidate(Long userId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("ALL", applicationRepository.countByUserId(userId));
        Arrays.stream(ApplicationStatus.values()).forEach(s ->
            counts.put(s.name(), applicationRepository.countByUserIdAndStatus(userId, s))
        );
        return counts;
    }

    public PageResponse<ApplicationResponse> getForCandidate(Long userId, ApplicationStatus status, Boolean shortlisted, Pageable pageable) {
        Page<Application> page;
        if (shortlisted != null) {
            page = (status != null)
                    ? applicationRepository.findAllByUserIdAndStatusAndShortlisted(userId, status, shortlisted, pageable)
                    : applicationRepository.findAllByUserIdAndShortlisted(userId, shortlisted, pageable);
        } else {
            page = (status != null)
                    ? applicationRepository.findAllByUserIdAndStatus(userId, status, pageable)
                    : applicationRepository.findAllByUserId(userId, pageable);
        }
        return toPageResponse(page, this::toCandidateResponse);
    }

    public PageResponse<ApplicationManagementResponse> getForJob(Long jobId, Long recruiterId,
                                                                   ApplicationStatus status, String search,
                                                                   Boolean shortlisted, Pageable pageable) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        requireSameCompany(job, recruiterId);
        boolean hasSearch = search != null && !search.isBlank();
        String s = hasSearch ? search.trim() : null;
        Page<Application> page;
        if (shortlisted != null) {
            if (hasSearch && status != null)
                page = applicationRepository.findAllByJobIdAndStatusAndShortlistedAndCandidateName(jobId, status, shortlisted, s, pageable);
            else if (hasSearch)
                page = applicationRepository.findAllByJobIdAndShortlistedAndCandidateName(jobId, shortlisted, s, pageable);
            else if (status != null)
                page = applicationRepository.findAllByJobIdAndStatusAndShortlisted(jobId, status, shortlisted, pageable);
            else
                page = applicationRepository.findAllByJobIdAndShortlisted(jobId, shortlisted, pageable);
        } else {
            if (hasSearch && status != null)
                page = applicationRepository.findAllByJobIdAndStatusAndCandidateName(jobId, status, s, pageable);
            else if (hasSearch)
                page = applicationRepository.findAllByJobIdAndCandidateName(jobId, s, pageable);
            else if (status != null)
                page = applicationRepository.findAllByJobIdAndStatus(jobId, status, pageable);
            else
                page = applicationRepository.findAllByJobId(jobId, pageable);
        }
        return toPageResponse(page, this::toManagementResponse);
    }

    @Transactional
    public ApplicationManagementResponse updateStatus(Long id, UpdateApplicationStatusRequest req, Long recruiterId) {
        Application application = findOrThrow(id);
        requireSameCompany(application.getJob(), recruiterId);
        if (req.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Cannot set status to WITHDRAWN — only candidates can withdraw");
        }

        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(req.getStatus());

        if (req.getStatus() == ApplicationStatus.REJECTED) {
            String note = req.getRejectionNote();
            application.setRejectionNote(note != null && !note.isBlank() ? note.trim() : null);
            application.setShortlisted(false);
        }

        Application saved = applicationRepository.save(application);

        if (!oldStatus.equals(req.getStatus())) {
            String msg = "Your application for " + application.getJob().getTitle()
                    + " at <strong>" + application.getJob().getCompany().getName() + "</strong>"
                    + " status updated to: " + req.getStatus().name();
            if (req.getStatus() == ApplicationStatus.REJECTED && application.getRejectionNote() != null) {
                msg += ". The recruiter left feedback — check your applications for details.";
            }
            notificationService.send(application.getUser().getId(), NotificationType.STATUS_UPDATE, msg, saved.getId());
        }

        return toManagementResponse(saved);
    }

    public long countShortlistedForRecruiter(Long recruiterId) {
        User recruiter = userRepository.findById(recruiterId).orElse(null);
        if (recruiter == null || recruiter.getCompany() == null) return 0L;
        return applicationRepository.countShortlistedByCompanyId(recruiter.getCompany().getId());
    }

    @Transactional
    public ApplicationManagementResponse toggleShortlist(Long id, Long recruiterId) {
        Application application = findOrThrow(id);
        requireSameCompany(application.getJob(), recruiterId);

        if (application.getStatus() == ApplicationStatus.REJECTED) {
            throw new BadRequestException("Cannot shortlist a rejected candidate. Change their status first.");
        }

        boolean nowShortlisted = !Boolean.TRUE.equals(application.getShortlisted());
        application.setShortlisted(nowShortlisted);
        Application saved = applicationRepository.save(application);

        if (nowShortlisted) {
            notificationService.send(
                    application.getUser().getId(),
                    NotificationType.SHORTLIST,
                    "You have been shortlisted for " + application.getJob().getTitle()
                            + " at <strong>" + application.getJob().getCompany().getName() + "</strong>",
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
        requireSameCompany(application.getJob(), recruiterId);
        applicationRepository.delete(application);
    }

    @Transactional
    public InterviewResponse scheduleInterview(Long applicationId, CreateInterviewRequest req, Long recruiterId) {
        Application application = findOrThrow(applicationId);
        requireSameCompany(application.getJob(), recruiterId);

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
                        + " at <strong>" + application.getJob().getCompany().getName() + "</strong>"
                        + ": " + req.getTitle(),
                saved.getId()
        );

        return toInterviewResponse(saved);
    }

    @Transactional
    public InterviewResponse updateInterview(Long interviewId, UpdateInterviewRequest req, Long recruiterId) {
        InterviewSchedule interview = interviewScheduleRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
        User recruiter = userRepository.findById(recruiterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long companyId = recruiter.getCompany() != null ? recruiter.getCompany().getId() : null;
        if (companyId == null || !interviewScheduleRepository.existsByIdAndApplicationJobCompanyId(interviewId, companyId)) {
            throw new ForbiddenException("You do not have access to this interview");
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
                        + " at <strong>" + interview.getApplication().getJob().getCompany().getName() + "</strong>"
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
        requireSameCompany(application.getJob(), recruiterId);
        return interviewScheduleRepository
                .findAllByApplicationIdOrderByScheduledAtAsc(applicationId)
                .stream().map(this::toInterviewResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<InterviewResponse> getInterviewsForCompany(Long recruiterId, Long jobId, Pageable pageable) {
        User recruiter = userRepository.findById(recruiterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (recruiter.getCompany() == null) {
            return PageResponse.<InterviewResponse>builder()
                    .content(List.of()).page(0).size(pageable.getPageSize())
                    .totalElements(0L).totalPages(0).last(true).build();
        }
        Long companyId = recruiter.getCompany().getId();
        Page<InterviewSchedule> page = (jobId != null)
                ? interviewScheduleRepository.findByCompanyIdAndJobId(companyId, jobId, pageable)
                : interviewScheduleRepository.findByCompanyId(companyId, pageable);
        return PageResponse.<InterviewResponse>builder()
                .content(page.getContent().stream().map(this::toInterviewResponseFull).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }

    public List<InterviewResponse> getInterviewsForOwnApplication(Long applicationId, Long candidateId) {
        Application application = findOrThrow(applicationId);
        if (!application.getUser().getId().equals(candidateId)) {
            throw new ForbiddenException("This is not your application");
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

    private Application findOrThrow(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));
    }

    private void requireSameCompany(Job job, Long recruiterId) {
        User recruiter = userRepository.findById(recruiterId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long jobCompanyId       = job.getRecruiter().getCompany() != null ? job.getRecruiter().getCompany().getId() : null;
        Long recruiterCompanyId = recruiter.getCompany() != null ? recruiter.getCompany().getId() : null;
        if (jobCompanyId == null || !jobCompanyId.equals(recruiterCompanyId)) {
            throw new ForbiddenException("You do not have access to this job");
        }
    }

    private ApplicationResponse toCandidateResponse(Application a) {
        return ApplicationResponse.builder()
                .id(a.getId())
                .job(jobService.toJobResponseInternal(a.getJob(), a.getUser().getId()))
                .cvDraft(a.getCvDraft() != null ? cvDraftService.toResponse(a.getCvDraft()) : null)
                .status(a.getStatus())
                .matchPercent(a.getMatchPercent())
                .shortlisted(a.getShortlisted())
                .rejectionNote(a.getRejectionNote())
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
                .rejectionNote(a.getRejectionNote())
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

    private InterviewResponse toInterviewResponseFull(InterviewSchedule i) {
        Application app = i.getApplication();
        return InterviewResponse.builder()
                .id(i.getId())
                .applicationId(app.getId())
                .title(i.getTitle())
                .scheduledAt(i.getScheduledAt())
                .mode(i.getMode())
                .location(i.getLocation())
                .description(i.getDescription())
                .createdAt(i.getCreatedAt())
                .jobId(app.getJob().getId())
                .jobTitle(app.getJob().getTitle())
                .candidateName(app.getUser().getFullName())
                .build();
    }
}
