package com.swiprin.model;

import com.swiprin.model.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "applications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_draft_id")
    private CvDraft cvDraft;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "match_percent")
    private Integer matchPercent;

    @Column(name = "rejection_note", columnDefinition = "TEXT")
    private String rejectionNote;

    @Column(name = "offer_text", columnDefinition = "TEXT")
    private String offerText;

    @Column(name = "offer_salary")
    private Integer offerSalary;

    @Column(name = "offer_salary_type", length = 5)
    private String offerSalaryType;

    @Column(name = "offer_employment_type", length = 20)
    private String offerEmploymentType;

    @Column(name = "offer_deadline")
    private LocalDate offerDeadline;

    @Column(name = "offer_start_date")
    private LocalDate offerStartDate;

    @Column(name = "offer_accepted_at")
    private LocalDateTime offerAcceptedAt;

    @Column(name = "offer_declined_at")
    private LocalDateTime offerDeclinedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean shortlisted = false;

    @Column(name = "applied_at", nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private java.util.List<InterviewSchedule> interviews = new java.util.ArrayList<>();

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
    }
}
