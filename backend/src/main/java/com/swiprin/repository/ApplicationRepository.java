package com.swiprin.repository;

import com.swiprin.model.Application;
import com.swiprin.model.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // REMOVED applications are filtered out from all list/count queries below.
    // The row is kept only so existsByJobIdAndUserId stays true and blocks re-applying.

    @Query("SELECT a FROM Application a WHERE a.user.id = :userId AND a.status <> 'REMOVED'")
    Page<Application> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    // Candidate: filter own applications by status
    Page<Application> findAllByUserIdAndStatus(Long userId, ApplicationStatus status, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.user.id = :userId AND a.shortlisted = :shortlisted AND a.status <> 'REMOVED'")
    Page<Application> findAllByUserIdAndShortlisted(
            @Param("userId") Long userId, @Param("shortlisted") Boolean shortlisted, Pageable pageable);

    Page<Application> findAllByUserIdAndStatusAndShortlisted(Long userId, ApplicationStatus status, Boolean shortlisted, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.job.id = :jobId AND a.status <> 'REMOVED'")
    Page<Application> findAllByJobId(@Param("jobId") Long jobId, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.job.id = :jobId AND a.shortlisted = true AND a.status <> 'REMOVED'")
    Page<Application> findAllByJobIdAndShortlistedTrue(@Param("jobId") Long jobId, Pageable pageable);

    // Recruiter: filter applications for a specific job by status
    Page<Application> findAllByJobIdAndStatus(Long jobId, ApplicationStatus status, Pageable pageable);

    @Query("SELECT a FROM Application a JOIN a.user u WHERE a.job.id = :jobId AND a.status <> 'REMOVED' AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Application> findAllByJobIdAndCandidateName(
            @Param("jobId") Long jobId, @Param("search") String search, Pageable pageable);

    @Query("SELECT a FROM Application a JOIN a.user u WHERE a.job.id = :jobId AND a.status = :status AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Application> findAllByJobIdAndStatusAndCandidateName(
            @Param("jobId") Long jobId, @Param("status") ApplicationStatus status,
            @Param("search") String search, Pageable pageable);

    @Query("SELECT a FROM Application a WHERE a.job.id = :jobId AND a.shortlisted = :shortlisted AND a.status <> 'REMOVED'")
    Page<Application> findAllByJobIdAndShortlisted(
            @Param("jobId") Long jobId, @Param("shortlisted") Boolean shortlisted, Pageable pageable);

    Page<Application> findAllByJobIdAndStatusAndShortlisted(Long jobId, ApplicationStatus status, Boolean shortlisted, Pageable pageable);

    @Query("SELECT a FROM Application a JOIN a.user u WHERE a.job.id = :jobId AND a.shortlisted = :shortlisted AND a.status <> 'REMOVED' AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Application> findAllByJobIdAndShortlistedAndCandidateName(
            @Param("jobId") Long jobId, @Param("shortlisted") Boolean shortlisted,
            @Param("search") String search, Pageable pageable);

    @Query("SELECT a FROM Application a JOIN a.user u WHERE a.job.id = :jobId AND a.status = :status AND a.shortlisted = :shortlisted AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Application> findAllByJobIdAndStatusAndShortlistedAndCandidateName(
            @Param("jobId") Long jobId, @Param("status") ApplicationStatus status,
            @Param("shortlisted") Boolean shortlisted, @Param("search") String search, Pageable pageable);

    Optional<Application> findByJobIdAndUserId(Long jobId, Long userId);

    boolean existsByJobIdAndUserId(Long jobId, Long userId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.id = :jobId AND a.status <> 'REMOVED'")
    long countByJobId(@Param("jobId") Long jobId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.user.id = :userId AND a.status <> 'REMOVED'")
    long countByUserId(@Param("userId") Long userId);

    long countByUserIdAndStatus(Long userId, ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM Application a JOIN a.job j WHERE j.recruiter.id = :recruiterId AND a.shortlisted = true")
    long countShortlistedByRecruiterId(@Param("recruiterId") Long recruiterId);

    @Query("SELECT COUNT(a) FROM Application a JOIN a.job j WHERE j.company.id = :companyId AND a.shortlisted = true")
    long countShortlistedByCompanyId(@Param("companyId") Long companyId);

    @Query("""
            SELECT a FROM Application a
            WHERE a.status = 'OFFER'
              AND a.offerDeadline < :today
              AND a.offerAcceptedAt IS NULL
              AND a.offerDeclinedAt IS NULL
            """)
    List<Application> findExpiredOffers(@Param("today") LocalDate today);

    // Applications for all jobs of a recruiter, sorted by match percent desc
    @Query("""
            SELECT a FROM Application a
            JOIN a.job j
            WHERE j.recruiter.id = :recruiterId
            ORDER BY a.matchPercent DESC NULLS LAST
            """)
    Page<Application> findAllByRecruiterIdOrderByMatchPercent(
            @Param("recruiterId") Long recruiterId, Pageable pageable);
}
