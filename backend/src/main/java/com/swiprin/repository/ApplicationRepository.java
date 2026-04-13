package com.swiprin.repository;

import com.swiprin.model.Application;
import com.swiprin.model.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Page<Application> findAllByUserId(Long userId, Pageable pageable);

    // Candidate: filter own applications by status
    Page<Application> findAllByUserIdAndStatus(Long userId, ApplicationStatus status, Pageable pageable);

    Page<Application> findAllByJobId(Long jobId, Pageable pageable);

    Page<Application> findAllByJobIdAndShortlistedTrue(Long jobId, Pageable pageable);

    // Recruiter: filter applications for a specific job by status
    Page<Application> findAllByJobIdAndStatus(Long jobId, ApplicationStatus status, Pageable pageable);

    Optional<Application> findByJobIdAndUserId(Long jobId, Long userId);

    boolean existsByJobIdAndUserId(Long jobId, Long userId);

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
