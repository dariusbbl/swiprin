package com.swiprin.repository;

import com.swiprin.model.User;
import com.swiprin.model.enums.Role;
import com.swiprin.model.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findAllByRole(Role role, Pageable pageable);

    Page<User> findAllByStatus(UserStatus status, Pageable pageable);

    Page<User> findAllByRoleAndStatus(Role role, UserStatus status, Pageable pageable);

    Page<User> findByRoleAndCompanyNameContainingIgnoreCase(Role role, String companyName, Pageable pageable);

    Page<User> findByRoleAndStatusAndCompanyNameContainingIgnoreCase(
            Role role, UserStatus status, String companyName, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND u.role = 'RECRUITER'")
    Page<User> findRecruitersByCompanyId(@Param("companyId") Long companyId, Pageable pageable);
}
