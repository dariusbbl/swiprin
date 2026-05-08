package com.swiprin.repository;

import com.swiprin.model.Job;
import com.swiprin.model.enums.Seniority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobRepository extends JpaRepository<Job, Long> {

    Page<Job> findByActiveTrue(Pageable pageable);

    Page<Job> findByCompanyIdAndActiveTrue(Long companyId, Pageable pageable);

    long countByCompanyIdAndActiveTrue(Long companyId);

    Page<Job> findByRecruiterId(Long recruiterId, Pageable pageable);

    Page<Job> findByRecruiterIdAndActiveTrue(Long recruiterId, Pageable pageable);

    @Query("SELECT j FROM Job j WHERE j.active = true AND " +
           "(LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // Jobs sorted by skill overlap — no seniority, no location filter
    @Query("""
            SELECT j FROM Job j
            LEFT JOIN j.skills js ON js.id IN (
                SELECT s.id FROM User u JOIN u.skills s WHERE u.id = :userId
            )
            WHERE j.active = true
            GROUP BY j
            ORDER BY COUNT(js) DESC
            """)
    Page<Job> findActiveJobsSortedBySkillMatch(@Param("userId") Long userId, Pageable pageable);

    // Jobs sorted by skill overlap — with seniority filter
    @Query("""
            SELECT j FROM Job j
            LEFT JOIN j.skills js ON js.id IN (
                SELECT s.id FROM User u JOIN u.skills s WHERE u.id = :userId
            )
            WHERE j.active = true AND j.seniority = :seniority
            GROUP BY j
            ORDER BY COUNT(js) DESC
            """)
    Page<Job> findActiveJobsSortedBySkillMatchAndSeniority(
            @Param("userId") Long userId,
            @Param("seniority") Seniority seniority,
            Pageable pageable);

    // Jobs sorted by skill overlap — with location filter (city or country substring)
    @Query("""
            SELECT j FROM Job j
            LEFT JOIN j.skills js ON js.id IN (
                SELECT s.id FROM User u JOIN u.skills s WHERE u.id = :userId
            )
            WHERE j.active = true AND LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))
            GROUP BY j
            ORDER BY COUNT(js) DESC
            """)
    Page<Job> findActiveJobsSortedBySkillMatchAndLocation(
            @Param("userId") Long userId,
            @Param("location") String location,
            Pageable pageable);

    // Jobs sorted by skill overlap — with seniority + location filter
    @Query("""
            SELECT j FROM Job j
            LEFT JOIN j.skills js ON js.id IN (
                SELECT s.id FROM User u JOIN u.skills s WHERE u.id = :userId
            )
            WHERE j.active = true AND j.seniority = :seniority
              AND LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))
            GROUP BY j
            ORDER BY COUNT(js) DESC
            """)
    Page<Job> findActiveJobsSortedBySkillMatchAndSeniorityAndLocation(
            @Param("userId") Long userId,
            @Param("seniority") Seniority seniority,
            @Param("location") String location,
            Pageable pageable);
}
