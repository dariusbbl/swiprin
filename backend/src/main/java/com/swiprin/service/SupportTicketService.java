package com.swiprin.service;

import com.swiprin.dto.request.CreateTicketRequest;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.dto.response.TicketResponse;
import com.swiprin.exception.ForbiddenException;
import com.swiprin.exception.ResourceNotFoundException;
import com.swiprin.model.SupportTicket;
import com.swiprin.model.User;
import com.swiprin.model.enums.TicketStatus;
import com.swiprin.repository.SupportTicketRepository;
import com.swiprin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional
    public TicketResponse create(CreateTicketRequest req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .category(req.getCategory())
                .priority(req.getPriority())
                .message(req.getMessage().trim())
                .contactConsent(Boolean.TRUE.equals(req.getContactConsent()))
                .build();

        return toResponse(ticketRepository.save(ticket));
    }

    public PageResponse<TicketResponse> getMyTickets(Long userId, Pageable pageable) {
        return toPageResponse(ticketRepository.findAllByUserId(userId, pageable));
    }

    // Admin: list all tickets, optional status filter
    public PageResponse<TicketResponse> getAll(TicketStatus status, Pageable pageable) {
        Page<SupportTicket> page = status != null
                ? ticketRepository.findAllByStatus(status, pageable)
                : ticketRepository.findAll(pageable);
        return toPageResponse(page);
    }

    // Admin: resolve a ticket
    @Transactional
    public TicketResponse resolve(Long ticketId, Long adminId) {
        SupportTicket ticket = findOrThrow(ticketId);
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedBy(admin);
        ticket.setResolvedAt(LocalDateTime.now());
        return toResponse(ticketRepository.save(ticket));
    }

    // Admin: mark as in-progress
    @Transactional
    public TicketResponse setInProgress(Long ticketId) {
        SupportTicket ticket = findOrThrow(ticketId);
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        return toResponse(ticketRepository.save(ticket));
    }

    @Transactional
    public void delete(Long ticketId, Long userId, boolean isAdmin) {
        SupportTicket ticket = findOrThrow(ticketId);
        if (!isAdmin && !ticket.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not own this ticket");
        }
        ticketRepository.delete(ticket);
    }

    private SupportTicket findOrThrow(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + id));
    }

    public TicketResponse toResponse(SupportTicket t) {
        return TicketResponse.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .userFullName(t.getUser().getFullName())
                .userEmail(t.getUser().getEmail())
                .category(t.getCategory())
                .priority(t.getPriority())
                .message(t.getMessage())
                .contactConsent(t.getContactConsent())
                .status(t.getStatus())
                .resolvedByName(t.getResolvedBy() != null ? t.getResolvedBy().getFullName() : null)
                .resolvedAt(t.getResolvedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private PageResponse<TicketResponse> toPageResponse(Page<SupportTicket> page) {
        return PageResponse.<TicketResponse>builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .page(page.getNumber()).size(page.getSize())
                .totalElements(page.getTotalElements()).totalPages(page.getTotalPages())
                .last(page.isLast()).build();
    }
}
