package com.swiprin.controller;

import com.swiprin.dto.request.CreateTicketRequest;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.dto.response.TicketResponse;
import com.swiprin.model.enums.TicketStatus;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Support Tickets")
public class SupportTicketController {

    private final SupportTicketService ticketService;

    @PostMapping
    @Operation(summary = "Submit a support/feedback ticket")
    public ResponseEntity<TicketResponse> create(
            @Valid @RequestBody CreateTicketRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.create(req, principal.getId()));
    }

    @GetMapping("/me")
    @Operation(summary = "Get own submitted tickets")
    public ResponseEntity<PageResponse<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ticketService.getMyTickets(
                principal.getId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all tickets (ADMIN only, optional status filter)")
    public ResponseEntity<PageResponse<TicketResponse>> getAll(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ticketService.getAll(
                status,
                PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PutMapping("/{id}/in-progress")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark ticket as in-progress (ADMIN only)")
    public ResponseEntity<TicketResponse> setInProgress(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.setInProgress(id));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Resolve a ticket (ADMIN only)")
    public ResponseEntity<TicketResponse> resolve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.resolve(id, principal.getId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete ticket (own ticket or ADMIN)")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        ticketService.delete(id, principal.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
