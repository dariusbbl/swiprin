package com.swiprin.controller;

import com.swiprin.dto.response.NotificationResponse;
import com.swiprin.dto.response.PageResponse;
import com.swiprin.security.UserPrincipal;
import com.swiprin.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get own notifications (paginated, newest first)")
    public ResponseEntity<PageResponse<NotificationResponse>> getAll(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                notificationService.getForUser(principal.getId(), PageRequest.of(page, size)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count (for bell badge)")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                Map.of("count", notificationService.getUnreadCount(principal.getId())));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<Void> markOneAsRead(@PathVariable Long id,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markOneAsRead(id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.noContent().build();
    }
}
