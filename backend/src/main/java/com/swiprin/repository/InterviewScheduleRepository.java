package com.swiprin.repository;

import com.swiprin.model.InterviewSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, Long> {

    List<InterviewSchedule> findAllByApplicationIdOrderByScheduledAtAsc(Long applicationId);

    // "My Interviews" section: all upcoming interviews for a candidate, sorted by date
    @Query("""
            SELECT i FROM InterviewSchedule i
            JOIN i.application a
            WHERE a.user.id = :userId
            ORDER BY i.scheduledAt ASC
            """)
    Page<InterviewSchedule> findAllByUserId(@Param("userId") Long userId, Pageable pageable);

    boolean existsByIdAndApplicationJobRecruiterId(Long id, Long recruiterId);
}
