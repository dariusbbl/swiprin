package com.swiprin.repository;

import com.swiprin.model.CvDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CvDraftRepository extends JpaRepository<CvDraft, Long> {

    // Only non-deleted CVs are visible to the candidate
    List<CvDraft> findAllByUserIdAndDeletedFalse(Long userId);

    Optional<CvDraft> findByUserIdAndIsDefaultTrueAndDeletedFalse(Long userId);

    Optional<CvDraft> findByIdAndUserId(Long id, Long userId);

    // Clears the default flag for all CVs of a user before setting a new default
    @Modifying
    @Query("UPDATE CvDraft c SET c.isDefault = false WHERE c.user.id = :userId")
    void clearDefaultForUser(@Param("userId") Long userId);
}
