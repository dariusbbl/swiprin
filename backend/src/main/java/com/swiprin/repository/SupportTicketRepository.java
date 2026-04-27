package com.swiprin.repository;

import com.swiprin.model.SupportTicket;
import com.swiprin.model.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {

    Page<SupportTicket> findAllByUserId(Long userId, Pageable pageable);

    Page<SupportTicket> findAllByStatus(TicketStatus status, Pageable pageable);
}
